import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createResponse } from './utils/createResponse.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';

// Convert exec to promise-based
const execAsync = promisify(exec);

// Constants
const BUCKET_NAME = "acmeregistrys3";
const DEFAULT_SCORE = "-1";
const ALLOWED_UPLOAD_SOURCES = ['github', 'npm', 'content'];
const URL_FILE_PATH = 'CustomRegistry/data/url.txt';

// Initialize AWS SDK and S3 client
const s3Client = new S3Client({ region: "us-east-1" });

// Helper function to validate URL
const isValidUrl = (url) => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('github.com') || lowerUrl.includes('npmjs.com');
};

// Helper function to extract URL from package.json in S3 zip file
const getUrlFromZip = async (s3Response) => {
    try {
        // Convert S3 response body stream to buffer
        const streamToBuffer = async (stream) => {
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        };

        // Handle case where Body might be a Buffer
        const buffer = s3Response.Body instanceof Readable ? 
            await streamToBuffer(s3Response.Body) : 
            s3Response.Body;

        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        // Find package.json in the zip
        const packageJsonEntry = zipEntries.find(entry => {
            const entryPath = entry.entryName.toLowerCase();
            return entryPath.endsWith('package.json') && !entryPath.includes('node_modules/');
        });

        if (!packageJsonEntry) {
            throw new Error('No package.json found in zip file');
        }

        // Read and parse package.json
        const packageJson = JSON.parse(packageJsonEntry.getData().toString('utf8'));
        
        // Get URL from package.json - could be in repository.url, homepage, or other fields
        const url = packageJson.repository?.url || 
                   packageJson.homepage || 
                   (typeof packageJson.repository === 'string' ? packageJson.repository : null);

        if (!url) {
            throw new Error('No URL found in package.json');
        }

        // Clean the URL
        const cleanUrl = url.replace(/^git\+/, '')
                          .replace(/\.git$/, '')
                          .replace(/^ssh:\/\//, 'https://')
                          .replace(/^git:\/\//, 'https://');

        // Validate URL contains github or npm
        if (!isValidUrl(cleanUrl)) {
            throw new Error('URL must contain either github.com or npmjs.com');
        }

        return cleanUrl;
    } catch (error) {
        console.error('Error extracting URL from zip:', error);
        return null;
    }
};

// Helper function to run the Custom Registry program
const runCustomRegistryProgram = async (url) => {
    try {
        // Ensure the data directory exists
        await fs.mkdir(path.dirname(URL_FILE_PATH), { recursive: true });
        
        // Delete the file if it exists
        try {
            await fs.unlink(URL_FILE_PATH);
        } catch (err) {
            // Ignore error if file doesn't exist
            if (err.code !== 'ENOENT') throw err;
        }

        // Write the URL to the file
        await fs.writeFile(URL_FILE_PATH, url);

        // Execute the program
        const { stdout, stderr } = await execAsync(`cd CustomRegistry && ./run data/url.txt`);
        console.log('Program output:', stdout);
        if (stderr) {
            console.error('Program stderr:', stderr);
        }
        return stdout.trim();
    } catch (error) {
        console.error('Error running Custom Registry program:', error);
        return `Error: ${error.message}`;
    } finally {
        // Clean up: try to delete the file after execution
        try {
            await fs.unlink(URL_FILE_PATH);
        } catch (err) {
            // Ignore cleanup errors
            console.log('Cleanup warning:', err.message);
        }
    }
};

// Helper function to update metadata in S3
const updateMetadata = async (packageId, metadata) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: packageId,
        Metadata: metadata,
        MetadataDirective: "REPLACE"
    };
    await s3Client.send(new PutObjectCommand(params));
    console.log('Metadata updated successfully:', metadata);
};

// Helper function to construct package URL
const constructPackageUrl = async (uploadVia, metadata, s3Response) => {
    switch (uploadVia?.toLowerCase()) {
        case 'github':
            const githubUrl = metadata.url || 'Invalid GitHub URL';
            return isValidUrl(githubUrl) ? githubUrl : 'Invalid GitHub URL';
        case 'npm':
            const npmUrl = metadata.name ? `https://www.npmjs.com/package/${metadata.name}` : 'Invalid NPM package name';
            return isValidUrl(npmUrl) ? npmUrl : 'Invalid NPM package name';
        case 'content':
            try {
                const url = await getUrlFromZip(s3Response);
                if (!url || !isValidUrl(url)) {
                    return 'Content URL not available';
                }
                return url;
            } catch (error) {
                console.error('Error getting URL from content:', error);
                return 'Content URL not available';
            }
        default:
            return 'Unknown source';
    }
};

// Helper function to check if package exists
const checkPackageExists = async (packageId) => {
    try {
        await s3Client.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: packageId
        }));
        return true;
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
};

// Main handler function
export const ratePackageHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Input validation
        const packageId = event.pathParameters?.id;
        if (!packageId) {
            return createResponse(400, { error: 'Package ID is required' });
        }

        // Check if package exists
        const exists = await checkPackageExists(packageId);
        if (!exists) {
            console.log(`Package ${packageId} not found`);
            return createResponse(404, {
                error: `Package ${packageId} not found`,
                packageId
            });
        }

        // Fetch package data from S3
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: packageId
        }));
        
        let metadata = response.Metadata || {};

        // Add/update score if missing
        if (!metadata.score) {
            metadata.score = DEFAULT_SCORE;
            metadata.lastUpdated = new Date().toISOString();
        }

        // Construct and add package URL to metadata
        const packageUrl = await constructPackageUrl(metadata.uploadvia, metadata, response);
        if (packageUrl && packageUrl !== metadata.packageUrl) {
            metadata.packageUrl = packageUrl;
            
            // Run the Custom Registry program with the URL
            try {
                const programOutput = await runCustomRegistryProgram(packageUrl);
                console.log('Custom Registry program completed with output:', programOutput);
                metadata.customRegistryResult = programOutput;
            } catch (error) {
                console.error('Failed to run Custom Registry program:', error);
                metadata.customRegistryResult = `Error: ${error.message}`;
            }
            
            await updateMetadata(packageId, metadata);
            console.log('Updated metadata with new package URL:', packageUrl);
        }

        return createResponse(200, {
            packageId,
            metadata,
            packageUrl,
            uploadVia: metadata.uploadvia
        });

    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, {
            error: `Internal server error: ${error.message}`,
            requestId: event.requestContext?.requestId
        });
    }
};