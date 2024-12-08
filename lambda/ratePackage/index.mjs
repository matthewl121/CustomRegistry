import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createResponse } from './utils/createResponse.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import { gunzipSync } from 'zlib';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import unzipper from 'unzipper'; // Ensure consistency by using 'unzipper' if preferred

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert exec to promise-based
const execAsync = promisify(exec);

// Constants
const BUCKET_NAME = "acmeregistrys3";
const DEFAULT_SCORE = "-1";
const ALLOWED_UPLOAD_SOURCES = ['github', 'npm', 'content'];
const URL_FILE_PATH = path.join(__dirname, '..', '..', 'phase1', 'data', 'url.txt');
const CUSTOM_REGISTRY_DIR = path.join(__dirname, '..', '..', 'phase1');

// Initialize AWS SDK and S3 client
const s3Client = new S3Client({ region: "us-east-1" });

// Helper function to validate URL
const isValidUrl = (url) => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('github.com') || lowerUrl.includes('npmjs.com');
};

// Updated Helper function to run the Custom Registry program
const runCustomRegistryProgram = async (url) => {
    try {
        // Ensure the data directory exists
        const dataDir = path.join(CUSTOM_REGISTRY_DIR, 'data');
        await fs.mkdir(dataDir, { recursive: true });

        // Validate and sanitize URL format
        const urlObj = new URL(url);
        const sanitizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.split('/').slice(0, 3).join('/')}`;

        if (!isValidUrl(sanitizedUrl)) {
            throw new Error(`Invalid URL format: ${sanitizedUrl}`);
        }

        // Delete the file if it exists
        try {
            await fs.unlink(URL_FILE_PATH);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err; // Ignore file not found errors
        }

        // Write the sanitized URL to the file
        await fs.writeFile(URL_FILE_PATH, sanitizedUrl);

        // Execute the program from the correct directory
        console.log('Current Directory:', __dirname);
        const { stdout, stderr } = await execAsync('./run data/url.txt', {
            cwd: CUSTOM_REGISTRY_DIR
        });

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
            console.log('Cleanup warning:', err.message);
        }
    }
};

// Updated Helper function to extract URL from package.json in archive (ZIP or tar.gz)
const getUrlFromArchive = async (s3Response) => {
    try {
        // Convert S3 response body stream to buffer
        const buffer = s3Response.Body instanceof Readable
            ? await streamToBuffer(s3Response.Body)
            : s3Response.Body;


        // Check if the data is a ZIP archive (signature starts with 'PK')
        if (buffer.slice(0, 2).toString('hex') === '504b') { // 'PK' in hex

            // Parse ZIP using AdmZip
            const zip = new AdmZip(buffer);

            // Find and extract package.json
            const entry = zip.getEntries().find((e) => e.entryName.endsWith('package.json') && !e.entryName.includes('node_modules/'));
            if (!entry) {
                console.error('Error: package.json not found in ZIP file');
                throw new Error('package.json not found in ZIP file');
            }

            const packageJsonContent = entry.getData().toString('utf8');
            const packageJson = JSON.parse(packageJsonContent);

            // Extract URL
            const url = packageJson.repository?.url ||
                packageJson.homepage ||
                (typeof packageJson.repository === 'string' ? packageJson.repository : null);

            if (!url) {
                console.error('Error: No URL found in package.json fields');
                throw new Error('No URL found in package.json fields');
            }

            return sanitizeUrl(url);
        }

        // If not a ZIP file, assume gzip
        let unzippedBuffer;
        try {
            unzippedBuffer = gunzipSync(buffer);
        } catch (error) {
            console.error('Error decompressing gzip data:', error);
            throw new Error('Failed to decompress package data - invalid gzip format');
        }

        // Parse the unzipped content as JSON
        let packageJson;
        try {
            packageJson = JSON.parse(unzippedBuffer.toString('utf8'));
        } catch (error) {
            console.error('Error parsing package.json:', error);
            throw new Error('Invalid package.json format - failed to parse JSON');
        }

        // Extract URL from package.json fields
        const url = packageJson.repository?.url ||
            packageJson.homepage ||
            (typeof packageJson.repository === 'string' ? packageJson.repository : null);

        if (!url) {
            console.error('Error: No URL found in package.json fields');
            throw new Error('No URL found in package.json fields');
        }

        return sanitizeUrl(url);
    } catch (error) {
        console.error('Error extracting URL:', error.message);
        return null;
    }
};


// Helper function to sanitize URL
const sanitizeUrl = (url) => {
    const cleanUrl = url.replace(/^git\+/, '')
        .replace(/\.git$/, '')
        .replace(/^ssh:\/\//, 'https://')
        .replace(/^git:\/\//, 'https://');

    let urlObj;
    try {
        urlObj = new URL(cleanUrl);
    } catch (error) {
        throw new Error(`Invalid URL format: ${cleanUrl}`);
    }

    const sanitizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.split('/').slice(0, 3).join('/')}`;
    if (!isValidUrl(sanitizedUrl)) {
        throw new Error('Invalid repository URL - must contain github.com or npmjs.com');
    }

    return sanitizedUrl;
};

// Updated constructPackageUrl function
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
                const url = await getUrlFromArchive(s3Response);
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

// Helper function to convert a stream to a buffer
const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
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

export const ratePackageHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        if (!event) {
            return createResponse(400, { message: 'There is missing field(s) in the PackageID' });
        }
        // Input validation
        const packageId = event.pathParameters?.id;
        if (!packageId) {
            return createResponse(400, { message: 'There is missing field(s) in the PackageID' });
        }

        // Check if package exists
        const exists = await checkPackageExists(packageId);
        if (!exists) {
            console.log(`Package ${packageId} not found`);
            return createResponse(404, { message: "Package does not exist." });
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
        if (packageUrl && packageUrl !== metadata.packageurl) { // S3 metadata keys are lowercase
            metadata.packageurl = packageUrl; // S3 metadata keys are automatically lowercased

            // Update the metadata in S3
            // try {
            //     await s3Client.send(new PutObjectCommand({
            //         Bucket: BUCKET_NAME,
            //         Key: packageId,
            //         Metadata: metadata,
            //         Body: response.Body // Re-upload the same body with updated metadata
            //     }));
            //     console.log(`Updated metadata for package ${packageId}`);
            // } catch (error) {
            //     console.error('Error updating S3 metadata:', error);
            //     // Proceed without updating metadata
            // }

            // Run the Custom Registry program with the URL
            try {
                const programOutput = await runCustomRegistryProgram(packageUrl);
                metadata.customregistryresult = programOutput; // S3 metadata keys are lowercase
            } catch (error) {
                console.error('Failed to run Custom Registry program:', error);
                metadata.customregistryresult = `Error: ${error.message}`;
            }
        }

        /* 
        // Parse customRegistryResult and map it to the required fields
        let customRegistryResult;
        if (typeof metadata.customregistryresult === 'string') {
            customRegistryResult = JSON.parse(metadata.customregistryresult);
        } else {
            customRegistryResult = metadata.customregistryresult;
        }

        console.log("\n\nINSIDE RATEPACKAGE");
        console.log(customRegistryResult);
        console.log(`BusFactor: ${customRegistryResult.BusFactor}`);
        const parsedResult = {
            BusFactor: parseFloat(customRegistryResult.BusFactor || 0),
            BusFactorLatency: parseFloat(customRegistryResult.BusFactor_Latency || 0),
            Correctness: parseFloat(customRegistryResult.Correctness || 0),
            CorrectnessLatency: parseFloat(customRegistryResult.Correctness_Latency || 0),
            RampUp: parseFloat(customRegistryResult.RampUp || 0),
            RampUpLatency: parseFloat(customRegistryResult.RampUp_Latency || 0),
            ResponsiveMaintainer: parseFloat(customRegistryResult.ResponsiveMaintainer || 0),
            ResponsiveMaintainerLatency: parseFloat(customRegistryResult.ResponsiveMaintainer_Latency || 0),
            LicenseScore: parseFloat(customRegistryResult.License || 0),
            LicenseScoreLatency: parseFloat(customRegistryResult.License_Latency || 0),
            GoodPinningPractice: parseFloat(customRegistryResult.DependencyPinning || 0),
            GoodPinningPracticeLatency: parseFloat(customRegistryResult.DependencyPinning_Latency || 0),
            PullRequest: parseFloat(customRegistryResult.CodeReview || 0),
            PullRequestLatency: parseFloat(customRegistryResult.CodeReview_Latency || 0),
            NetScore: parseFloat(customRegistryResult.NetScore || 0),
            NetScoreLatency: parseFloat(customRegistryResult.NetScore_Latency || 0),
        };
        console.log(parsedResult);
        console.log("\n\n");
        */

       // Parse customRegistryResult and map it to the required fields
        const customRegistryResult = metadata.customregistryresult || '';
        // Parse the JSON string to an object
        let parsedCustomRegistryResult;
        try {
            parsedCustomRegistryResult = JSON.parse(customRegistryResult);
        } catch (error) {
            console.error("Error parsing customRegistryResult:", error);
            parsedCustomRegistryResult = {};
        }

        console.log("JSON parsed result", parsedCustomRegistryResult); // Log to verify parsed object
        console.log("Bus Factor", parsedCustomRegistryResult.BusFactor); // Log to verify parsed object

        const parsedResult = {
            BusFactor: parseFloat(parsedCustomRegistryResult.BusFactor || 0),
            BusFactorLatency: parseFloat(parsedCustomRegistryResult.BusFactor_Latency || 0),
            Correctness: parseFloat(parsedCustomRegistryResult.Correctness || 0),
            CorrectnessLatency: parseFloat(parsedCustomRegistryResult.Correctness_Latency || 0),
            RampUp: parseFloat(parsedCustomRegistryResult.RampUp || 0),
            RampUpLatency: parseFloat(parsedCustomRegistryResult.RampUp_Latency || 0),
            ResponsiveMaintainer: parseFloat(parsedCustomRegistryResult.ResponsiveMaintainer || 0),
            ResponsiveMaintainerLatency: parseFloat(parsedCustomRegistryResult.ResponsiveMaintainer_Latency || 0),
            LicenseScore: parseFloat(parsedCustomRegistryResult.LicenseScore || parsedCustomRegistryResult.License || 0),
            LicenseScoreLatency: parseFloat(parsedCustomRegistryResult.LicenseScore_Latency || parsedCustomRegistryResult.License_Latency || 0),
            GoodPinningPractice: parseFloat(parsedCustomRegistryResult.GoodPinningPractice || parsedCustomRegistryResult.DependencyPinning || 0),
            GoodPinningPracticeLatency: parseFloat(parsedCustomRegistryResult.GoodPinningPractice_Latency || parsedCustomRegistryResult.DependencyPinning_Latency || 0),
            PullRequest: parseFloat(parsedCustomRegistryResult.PullRequest || parsedCustomRegistryResult.CodeReview || 0),
            PullRequestLatency: parseFloat(parsedCustomRegistryResult.PullRequest_Latency || parsedCustomRegistryResult.CodeReview_Latency || 0),
            NetScore: parseFloat(parsedCustomRegistryResult.NetScore || 0),
            NetScoreLatency: parseFloat(parsedCustomRegistryResult.NetScore_Latency || 0),
        };

        console.log("Parsed response:", parsedResult);
        console.log("\n\n");

        // Return only parsed results in the response
        return createResponse(200, {
            ...parsedResult // Spread parsed result directly in the response body
        });
    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { message: "The package rating system choked on at least one of the metrics." });
    }
};
