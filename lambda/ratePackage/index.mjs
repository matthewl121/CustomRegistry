import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createResponse } from './utils/createResponse.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getRepoUrlFromPackage } from './readPackage.json.mjs';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert exec to promise-based
const execAsync = promisify(exec);

// Constants
const BUCKET_NAME = "acmeregistrys3";
const URL_FILE_PATH = path.join(__dirname, '..', '..', 'phase1', 'data', 'url.txt');
const CUSTOM_REGISTRY_DIR = path.join(__dirname, '..', '..', 'phase1');

// Initialize AWS SDK and S3 client
const s3Client = new S3Client({ region: "us-east-1" });

// Helper function to validate URL
const isValidUrl = (url) => {
    try {
        new URL(url);
        const lowerUrl = url.toLowerCase();
        return lowerUrl.includes('github.com') || lowerUrl.includes('npmjs.com');
    } catch {
        return false;
    }
};

// Helper function to run the Custom Registry program
const runCustomRegistryProgram = async (url) => {
    try {
        console.log('Running Custom Registry program with URL:', url);
        
        // Ensure the data directory exists
        const dataDir = path.join(CUSTOM_REGISTRY_DIR, 'data');
        await fs.mkdir(dataDir, { recursive: true });

        // Delete the file if it exists
        try {
            await fs.unlink(URL_FILE_PATH);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }

        // Write the URL to the file
        await fs.writeFile(URL_FILE_PATH, url);

        // Execute the program from the correct directory
        const { stdout, stderr } = await execAsync('./run data/url.txt', {
            cwd: CUSTOM_REGISTRY_DIR
        });
        
        if (stderr) {
            console.error('Program stderr:', stderr);
        }
        
        return stdout.trim();
    } catch (error) {
        console.error('Error running Custom Registry program:', error);
        throw error;
    } finally {
        // Clean up: try to delete the file after execution
        try {
            await fs.unlink(URL_FILE_PATH);
        } catch (err) {
            console.log('Cleanup warning:', err.message);
        }
    }
};

// Helper function to construct package URL
const constructPackageUrl = async (uploadVia, metadata, s3Response) => {
    console.log('Constructing package URL for:', { uploadVia, metadata });
    
    try {
        switch (uploadVia?.toLowerCase()) {
            case 'github':
                if (!metadata.url) {
                    console.error('No GitHub URL provided in metadata');
                    return null;
                }
                return isValidUrl(metadata.url) ? metadata.url : null;
                
            case 'npm':
                if (!metadata.name) {
                    console.error('No NPM package name provided in metadata');
                    return null;
                }
                const npmUrl = `https://www.npmjs.com/package/${metadata.name}`;
                return isValidUrl(npmUrl) ? npmUrl : null;
                
            case 'content':
                try {
                    // Convert S3 response body stream to base64
                    const streamToBuffer = async (stream) => {
                        const chunks = [];
                        for await (const chunk of stream) {
                            chunks.push(chunk);
                        }
                        return Buffer.concat(chunks);
                    };

                    const contentBuffer = s3Response.Body instanceof Readable ?
                        await streamToBuffer(s3Response.Body) :
                        s3Response.Body;
                    
                    const base64Content = contentBuffer.toString('base64');
                    const url = await getRepoUrlFromPackage(base64Content);
                    
                    return url && isValidUrl(url) ? url : null;
                } catch (error) {
                    console.error('Error getting URL from content:', error);
                    return null;
                }
                
            default:
                console.error('Unknown upload source:', uploadVia);
                return null;
        }
    } catch (error) {
        console.error('Error in constructPackageUrl:', error);
        return null;
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

// Helper function to create default metrics
const createDefaultMetrics = (message = null) => ({
    BusFactor: 0,
    BusFactorLatency: 0,
    Correctness: 0,
    CorrectnessLatency: 0,
    RampUp: 0,
    RampUpLatency: 0,
    ResponsiveMaintainer: 0,
    ResponsiveMaintainerLatency: 0,
    LicenseScore: 0,
    LicenseScoreLatency: 0,
    GoodPinningPractice: 0,
    GoodPinningPracticeLatency: 0,
    PullRequest: 0,
    PullRequestLatency: 0,
    NetScore: 0,
    NetScoreLatency: 0,
    ...(message ? { message } : {})
});

// Main handler function
export const ratePackageHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Input validation
        const packageId = event.pathParameters?.id;
        if (!packageId) {
            return createResponse(400, { 
                message: 'There is missing field(s) in the PackageID',
                ...createDefaultMetrics()
            });
        }

        // Check if package exists
        const exists = await checkPackageExists(packageId);
        if (!exists) {
            console.log(`Package ${packageId} not found`);
            return createResponse(404, { 
                message: "Package does not exist.",
                ...createDefaultMetrics()
            });
        }

        // Fetch package data from S3
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: packageId
        }));

        let metadata = response.Metadata || {};

        // Construct package URL
        const packageUrl = await constructPackageUrl(metadata.uploadvia, metadata, response);
        if (!packageUrl) {
            return createResponse(400, { 
                message: "Unable to determine package repository URL",
                ...createDefaultMetrics()
            });
        }

        // Run the Custom Registry program with the URL
        try {
            const programOutput = await runCustomRegistryProgram(packageUrl);
            console.log('Custom Registry program completed with output:', programOutput);

            // Parse the output and extract metrics
            const metrics = {
                BusFactor: parseFloat(programOutput.match(/BusFactor: (\d+\.\d+)/)?.[1] || 0),
                BusFactorLatency: parseFloat(programOutput.match(/BusFactorLatency: (\d+\.\d+)/)?.[1] || 0),
                Correctness: parseFloat(programOutput.match(/Correctness: (\d+\.\d+)/)?.[1] || 0),
                CorrectnessLatency: parseFloat(programOutput.match(/CorrectnessLatency: (\d+\.\d+)/)?.[1] || 0),
                RampUp: parseFloat(programOutput.match(/RampUp: (\d+\.\d+)/)?.[1] || 0),
                RampUpLatency: parseFloat(programOutput.match(/RampUpLatency: (\d+\.\d+)/)?.[1] || 0),
                ResponsiveMaintainer: parseFloat(programOutput.match(/ResponsiveMaintainer: (\d+\.\d+)/)?.[1] || 0),
                ResponsiveMaintainerLatency: parseFloat(programOutput.match(/ResponsiveMaintainerLatency: (\d+\.\d+)/)?.[1] || 0),
                LicenseScore: parseFloat(programOutput.match(/LicenseScore: (\d+\.\d+)/)?.[1] || 0),
                LicenseScoreLatency: parseFloat(programOutput.match(/LicenseScoreLatency: (\d+\.\d+)/)?.[1] || 0),
                GoodPinningPractice: parseFloat(programOutput.match(/GoodPinningPractice: (\d+\.\d+)/)?.[1] || 0),
                GoodPinningPracticeLatency: parseFloat(programOutput.match(/GoodPinningPracticeLatency: (\d+\.\d+)/)?.[1] || 0),
                PullRequest: parseFloat(programOutput.match(/PullRequest: (\d+\.\d+)/)?.[1] || 0),
                PullRequestLatency: parseFloat(programOutput.match(/PullRequestLatency: (\d+\.\d+)/)?.[1] || 0),
                NetScore: parseFloat(programOutput.match(/NetScore: (\d+\.\d+)/)?.[1] || 0),
                NetScoreLatency: parseFloat(programOutput.match(/NetScoreLatency: (\d+\.\d+)/)?.[1] || 0)
            };

            return createResponse(200, metrics);
        } catch (error) {
            console.error('Error processing package:', error);
            return createResponse(500, {
                message: "The package rating system choked on at least one of the metrics.",
                ...createDefaultMetrics()
            });
        }
    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, {
            message: "The package rating system choked on at least one of the metrics.",
            ...createDefaultMetrics()
        });
    }
};
// import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// import { createResponse } from './utils/createResponse.mjs';
// import { exec } from 'child_process';
// import { promisify } from 'util';
// import fs from 'fs/promises';
// import path from 'path';
// import { gunzipSync } from 'zlib';
// import { Readable } from 'stream';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// // Set up __dirname equivalent for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Convert exec to promise-based
// const execAsync = promisify(exec);

// // Constants
// const BUCKET_NAME = "acmeregistrys3";
// const DEFAULT_SCORE = "-1";
// const ALLOWED_UPLOAD_SOURCES = ['github', 'npm', 'content'];
// const URL_FILE_PATH = path.join(__dirname, '..', '..', 'phase1', 'data', 'url.txt');
// const CUSTOM_REGISTRY_DIR = path.join(__dirname, '..', '..', 'phase1');

// // Initialize AWS SDK and S3 client
// const s3Client = new S3Client({ region: "us-east-1" });

// // Helper function to validate URL
// const isValidUrl = (url) => {
//     const lowerUrl = url.toLowerCase();
//     return lowerUrl.includes('github.com') || lowerUrl.includes('npmjs.com');
// };

// // Helper function to extract URL from package.json in gzipped file
// const getUrlFromGzip = async (s3Response) => {
//     try {
//         // Convert S3 response body stream to buffer
//         const streamToBuffer = async (stream) => {
//             const chunks = [];
//             for await (const chunk of stream) {
//                 chunks.push(chunk);
//             }
//             return Buffer.concat(chunks);
//         };

//         // Handle case where Body might be a Buffer
//         const gzippedBuffer = s3Response.Body instanceof Readable ?
//             await streamToBuffer(s3Response.Body) :
//             s3Response.Body;

//         // Decompress the gzipped content
//         const unzippedBuffer = gunzipSync(gzippedBuffer);
        
//         // Parse the unzipped content as JSON (assuming it's package.json)
//         const packageJson = JSON.parse(unzippedBuffer.toString('utf8'));

//         // Get URL from package.json - could be in repository.url, homepage, or other fields
//         const url = packageJson.repository?.url ||
//             packageJson.homepage ||
//             (typeof packageJson.repository === 'string' ? packageJson.repository : null);

//         if (!url) {
//             throw new Error('No URL found in package.json');
//         }

//         // Clean the URL
//         const cleanUrl = url.replace(/^git\+/, '')
//             .replace(/\.git$/, '')
//             .replace(/^ssh:\/\//, 'https://')
//             .replace(/^git:\/\//, 'https://');

//         // Validate URL contains github or npm
//         if (!isValidUrl(cleanUrl)) {
//             throw new Error('URL must contain either github.com or npmjs.com');
//         }

//         return cleanUrl;
//     } catch (error) {
//         console.error('Error extracting URL from gzip:', error);
//         return null;
//     }
// };

// // Helper function to run the Custom Registry program
// const runCustomRegistryProgram = async (url) => {
//     try {
//         // Ensure the data directory exists
//         const dataDir = path.join(CUSTOM_REGISTRY_DIR, 'data');
//         await fs.mkdir(dataDir, { recursive: true });

//         // Delete the file if it exists
//         try {
//             await fs.unlink(URL_FILE_PATH);
//         } catch (err) {
//             // Ignore error if file doesn't exist
//             if (err.code !== 'ENOENT') throw err;
//         }

//         // Write the URL to the file
//         await fs.writeFile(URL_FILE_PATH, url);

//         // Execute the program from the correct directory
//         const { stdout, stderr } = await execAsync('./run data/url.txt', {
//             cwd: CUSTOM_REGISTRY_DIR
//         });
        
//         console.log('Program output:', stdout);
//         if (stderr) {
//             console.error('Program stderr:', stderr);
//         }
//         return stdout.trim();
//     } catch (error) {
//         console.error('Error running Custom Registry program:', error);
//         return `Error: ${error.message}`;
//     } finally {
//         // Clean up: try to delete the file after execution
//         try {
//             await fs.unlink(URL_FILE_PATH);
//         } catch (err) {
//             // Ignore cleanup errors
//             console.log('Cleanup warning:', err.message);
//         }
//     }
// };

// // Helper function to construct package URL
// const constructPackageUrl = async (uploadVia, metadata, s3Response) => {
//     switch (uploadVia?.toLowerCase()) {
//         case 'github':
//             const githubUrl = metadata.url || 'Invalid GitHub URL';
//             return isValidUrl(githubUrl) ? githubUrl : 'Invalid GitHub URL';
//         case 'npm':
//             const npmUrl = metadata.name ? `https://www.npmjs.com/package/${metadata.name}` : 'Invalid NPM package name';
//             return isValidUrl(npmUrl) ? npmUrl : 'Invalid NPM package name';
//         case 'content':
//             try {
//                 const url = await getUrlFromGzip(s3Response);
//                 if (!url || !isValidUrl(url)) {
//                     return 'Content URL not available';
//                 }
//                 return url;
//             } catch (error) {
//                 console.error('Error getting URL from content:', error);
//                 return 'Content URL not available';
//             }
//         default:
//             return 'Unknown source';
//     }
// };

// // Helper function to check if package exists
// const checkPackageExists = async (packageId) => {
//     try {
//         await s3Client.send(new HeadObjectCommand({
//             Bucket: BUCKET_NAME,
//             Key: packageId
//         }));
//         return true;
//     } catch (error) {
//         if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
//             return false;
//         }
//         throw error;
//     }
// };

// // Main handler function
// export const ratePackageHandler = async (event) => {
//     console.log('Received event:', JSON.stringify(event, null, 2));

//     try {
//         // Input validation
//         const packageId = event.pathParameters?.id;
//         if (!packageId) {
//             return createResponse(400, { message: 'There is missing field(s) in the PackageID' });
//         }

//         // Check if package exists
//         const exists = await checkPackageExists(packageId);
//         if (!exists) {
//             console.log(`Package ${packageId} not found`);
//             return createResponse(404, { message: "Package does not exist." });
//         }

//         // Fetch package data from S3
//         const response = await s3Client.send(new GetObjectCommand({
//             Bucket: BUCKET_NAME,
//             Key: packageId
//         }));

//         let metadata = response.Metadata || {};

//         // Add/update score if missing
//         if (!metadata.score) {
//             metadata.score = DEFAULT_SCORE;
//             metadata.lastUpdated = new Date().toISOString();
//         }

//         // Construct and add package URL to metadata
//         const packageUrl = await constructPackageUrl(metadata.uploadvia, metadata, response);
//         if (packageUrl && packageUrl !== metadata.packageUrl) {
//             metadata.packageUrl = packageUrl;

//             // Run the Custom Registry program with the URL
//             try {
//                 const programOutput = await runCustomRegistryProgram(packageUrl);
//                 console.log('Custom Registry program completed with output:', programOutput);
//                 metadata.customRegistryResult = programOutput;
//             } catch (error) {
//                 console.error('Failed to run Custom Registry program:', error);
//                 metadata.customRegistryResult = `Error: ${error.message}`;
//             }
//         }

//         // Parse customRegistryResult and map it to the required fields
//         const customRegistryResult = metadata.customRegistryResult || '';
//         const parsedResult = {
//             BusFactor: parseFloat(customRegistryResult.match(/BusFactor: (\d+\.\d+)/)?.[1] || 0),
//             BusFactorLatency: parseFloat(customRegistryResult.match(/BusFactorLatency: (\d+\.\d+)/)?.[1] || 0),
//             Correctness: parseFloat(customRegistryResult.match(/Correctness: (\d+\.\d+)/)?.[1] || 0),
//             CorrectnessLatency: parseFloat(customRegistryResult.match(/CorrectnessLatency: (\d+\.\d+)/)?.[1] || 0),
//             RampUp: parseFloat(customRegistryResult.match(/RampUp: (\d+\.\d+)/)?.[1] || 0),
//             RampUpLatency: parseFloat(customRegistryResult.match(/RampUpLatency: (\d+\.\d+)/)?.[1] || 0),
//             ResponsiveMaintainer: parseFloat(customRegistryResult.match(/ResponsiveMaintainer: (\d+\.\d+)/)?.[1] || 0),
//             ResponsiveMaintainerLatency: parseFloat(customRegistryResult.match(/ResponsiveMaintainerLatency: (\d+\.\d+)/)?.[1] || 0),
//             LicenseScore: parseFloat(customRegistryResult.match(/LicenseScore: (\d+\.\d+)/)?.[1] || 0),
//             LicenseScoreLatency: parseFloat(customRegistryResult.match(/LicenseScoreLatency: (\d+\.\d+)/)?.[1] || 0),
//             GoodPinningPractice: parseFloat(customRegistryResult.match(/GoodPinningPractice: (\d+\.\d+)/)?.[1] || 0),
//             GoodPinningPracticeLatency: parseFloat(customRegistryResult.match(/GoodPinningPracticeLatency: (\d+\.\d+)/)?.[1] || 0),
//             PullRequest: parseFloat(customRegistryResult.match(/PullRequest: (\d+\.\d+)/)?.[1] || 0),
//             PullRequestLatency: parseFloat(customRegistryResult.match(/PullRequestLatency: (\d+\.\d+)/)?.[1] || 0),
//             NetScore: parseFloat(customRegistryResult.match(/NetScore: (\d+\.\d+)/)?.[1] || 0),
//             NetScoreLatency: parseFloat(customRegistryResult.match(/NetScoreLatency: (\d+\.\d+)/)?.[1] || 0),
//         };

//         // Return only parsed results in the response
//         return createResponse(200, {
//             ...parsedResult // Spread parsed result directly in the response body
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         return createResponse(500, { message: "The package rating system choked on at least one of the metrics."});
//     }
// };

// // import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// // import { createResponse } from './utils/createResponse.mjs';
// // import { exec } from 'child_process';
// // import { promisify } from 'util';
// // import fs from 'fs/promises';
// // import path from 'path';
// // import AdmZip from 'adm-zip';
// // import { Readable } from 'stream';

// // // Convert exec to promise-based
// // const execAsync = promisify(exec);

// // // Constants
// // const BUCKET_NAME = "acmeregistrys3";
// // const DEFAULT_SCORE = "-1";
// // const ALLOWED_UPLOAD_SOURCES = ['github', 'npm', 'content'];
// // const URL_FILE_PATH = '../../phase1/data/url.txt';

// // // Initialize AWS SDK and S3 client
// // const s3Client = new S3Client({ region: "us-east-1" });

// // // Helper function to validate URL
// // const isValidUrl = (url) => {
// //     const lowerUrl = url.toLowerCase();
// //     return lowerUrl.includes('github.com') || lowerUrl.includes('npmjs.com');
// // };

// // // Helper function to extract URL from package.json in S3 zip file
// // const getUrlFromZip = async (s3Response) => {
// //     try {
// //         // Convert S3 response body stream to buffer
// //         const streamToBuffer = async (stream) => {
// //             const chunks = [];
// //             for await (const chunk of stream) {
// //                 chunks.push(chunk);
// //             }
// //             return Buffer.concat(chunks);
// //         };

// //         // Handle case where Body might be a Buffer
// //         const buffer = s3Response.Body instanceof Readable ?
// //             await streamToBuffer(s3Response.Body) :
// //             s3Response.Body;

// //         const zip = new AdmZip(buffer);
// //         const zipEntries = zip.getEntries();

// //         // Find package.json in the zip
// //         const packageJsonEntry = zipEntries.find(entry => {
// //             const entryPath = entry.entryName.toLowerCase();
// //             return entryPath.endsWith('package.json') && !entryPath.includes('node_modules/');
// //         });

// //         if (!packageJsonEntry) {
// //             throw new Error('No package.json found in zip file');
// //         }

// //         // Read and parse package.json
// //         const packageJson = JSON.parse(packageJsonEntry.getData().toString('utf8'));

// //         // Get URL from package.json - could be in repository.url, homepage, or other fields
// //         const url = packageJson.repository?.url ||
// //             packageJson.homepage ||
// //             (typeof packageJson.repository === 'string' ? packageJson.repository : null);

// //         if (!url) {
// //             throw new Error('No URL found in package.json');
// //         }

// //         // Clean the URL
// //         const cleanUrl = url.replace(/^git\+/, '')
// //             .replace(/\.git$/, '')
// //             .replace(/^ssh:\/\//, 'https://')
// //             .replace(/^git:\/\//, 'https://');

// //         // Validate URL contains github or npm
// //         if (!isValidUrl(cleanUrl)) {
// //             throw new Error('URL must contain either github.com or npmjs.com');
// //         }

// //         return cleanUrl;
// //     } catch (error) {
// //         console.error('Error extracting URL from zip:', error);
// //         return null;
// //     }
// // };

// // // Helper function to run the Custom Registry program
// // const runCustomRegistryProgram = async (url) => {
// //     try {
// //         // Ensure the data directory exists
// //         await fs.mkdir(path.dirname(URL_FILE_PATH), { recursive: true });

// //         // Delete the file if it exists
// //         try {
// //             await fs.unlink(URL_FILE_PATH);
// //         } catch (err) {
// //             // Ignore error if file doesn't exist
// //             if (err.code !== 'ENOENT') throw err;
// //         }

// //         // Write the URL to the file
// //         await fs.writeFile(URL_FILE_PATH, url);

// //         // Execute the program
// //         const { stdout, stderr } = await execAsync(`cd CustomRegistry/phase1 && ./run data/url.txt`);
// //         console.log('Program output:', stdout);
// //         if (stderr) {
// //             console.error('Program stderr:', stderr);
// //         }
// //         return stdout.trim();
// //     } catch (error) {
// //         console.error('Error running Custom Registry program:', error);
// //         return `Error: ${error.message}`;
// //     } finally {
// //         // Clean up: try to delete the file after execution
// //         try {
// //             await fs.unlink(URL_FILE_PATH);
// //         } catch (err) {
// //             // Ignore cleanup errors
// //             console.log('Cleanup warning:', err.message);
// //         }
// //     }
// // };

// // // Helper function to construct package URL
// // const constructPackageUrl = async (uploadVia, metadata, s3Response) => {
// //     switch (uploadVia?.toLowerCase()) {
// //         case 'github':
// //             const githubUrl = metadata.url || 'Invalid GitHub URL';
// //             return isValidUrl(githubUrl) ? githubUrl : 'Invalid GitHub URL';
// //         case 'npm':
// //             const npmUrl = metadata.name ? `https://www.npmjs.com/package/${metadata.name}` : 'Invalid NPM package name';
// //             return isValidUrl(npmUrl) ? npmUrl : 'Invalid NPM package name';
// //         case 'content':
// //             try {
// //                 const url = await getUrlFromZip(s3Response);
// //                 if (!url || !isValidUrl(url)) {
// //                     return 'Content URL not available';
// //                 }
// //                 return url;
// //             } catch (error) {
// //                 console.error('Error getting URL from content:', error);
// //                 return 'Content URL not available';
// //             }
// //         default:
// //             return 'Unknown source';
// //     }
// // };

// // // Helper function to check if package exists
// // const checkPackageExists = async (packageId) => {
// //     try {
// //         await s3Client.send(new HeadObjectCommand({
// //             Bucket: BUCKET_NAME,
// //             Key: packageId
// //         }));
// //         return true;
// //     } catch (error) {
// //         if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
// //             return false;
// //         }
// //         throw error;
// //     }
// // };

// // // Main handler function
// // export const ratePackageHandler = async (event) => {
// //     console.log('Received event:', JSON.stringify(event, null, 2));

// //     try {
// //         // Input validation
// //         const packageId = event.pathParameters?.id;
// //         if (!packageId) {
// //             return createResponse(400, { error: 'Package ID is required' });
// //         }

// //         // Check if package exists
// //         const exists = await checkPackageExists(packageId);
// //         if (!exists) {
// //             console.log(`Package ${packageId} not found`);
// //             return createResponse(404, {
// //                 error: `Package ${packageId} not found`,
// //                 packageId
// //             });
// //         }

// //         // Fetch package data from S3
// //         const response = await s3Client.send(new GetObjectCommand({
// //             Bucket: BUCKET_NAME,
// //             Key: packageId
// //         }));

// //         let metadata = response.Metadata || {};

// //         // Add/update score if missing
// //         if (!metadata.score) {
// //             metadata.score = DEFAULT_SCORE;
// //             metadata.lastUpdated = new Date().toISOString();
// //         }

// //         // Construct and add package URL to metadata
// //         const packageUrl = await constructPackageUrl(metadata.uploadvia, metadata, response);
// //         if (packageUrl && packageUrl !== metadata.packageUrl) {
// //             metadata.packageUrl = packageUrl;

// //             // Run the Custom Registry program with the URL
// //             try {
// //                 const programOutput = await runCustomRegistryProgram(packageUrl);
// //                 console.log('Custom Registry program completed with output:', programOutput);
// //                 metadata.customRegistryResult = programOutput;
// //             } catch (error) {
// //                 console.error('Failed to run Custom Registry program:', error);
// //                 metadata.customRegistryResult = `Error: ${error.message}`;
// //             }
// //         }

// //         // Parse customRegistryResult and map it to the required fields
// //         const customRegistryResult = metadata.customRegistryResult || '';
// //         const parsedResult = {
// //             BusFactor: parseFloat(customRegistryResult.match(/BusFactor: (\d+\.\d+)/)?.[1] || 0),
// //             BusFactorLatency: parseFloat(customRegistryResult.match(/BusFactorLatency: (\d+\.\d+)/)?.[1] || 0),
// //             Correctness: parseFloat(customRegistryResult.match(/Correctness: (\d+\.\d+)/)?.[1] || 0),
// //             CorrectnessLatency: parseFloat(customRegistryResult.match(/CorrectnessLatency: (\d+\.\d+)/)?.[1] || 0),
// //             RampUp: parseFloat(customRegistryResult.match(/RampUp: (\d+\.\d+)/)?.[1] || 0),
// //             RampUpLatency: parseFloat(customRegistryResult.match(/RampUpLatency: (\d+\.\d+)/)?.[1] || 0),
// //             ResponsiveMaintainer: parseFloat(customRegistryResult.match(/ResponsiveMaintainer: (\d+\.\d+)/)?.[1] || 0),
// //             ResponsiveMaintainerLatency: parseFloat(customRegistryResult.match(/ResponsiveMaintainerLatency: (\d+\.\d+)/)?.[1] || 0),
// //             LicenseScore: parseFloat(customRegistryResult.match(/LicenseScore: (\d+\.\d+)/)?.[1] || 0),
// //             LicenseScoreLatency: parseFloat(customRegistryResult.match(/LicenseScoreLatency: (\d+\.\d+)/)?.[1] || 0),
// //             GoodPinningPractice: parseFloat(customRegistryResult.match(/GoodPinningPractice: (\d+\.\d+)/)?.[1] || 0),
// //             GoodPinningPracticeLatency: parseFloat(customRegistryResult.match(/GoodPinningPracticeLatency: (\d+\.\d+)/)?.[1] || 0),
// //             PullRequest: parseFloat(customRegistryResult.match(/PullRequest: (\d+\.\d+)/)?.[1] || 0),
// //             PullRequestLatency: parseFloat(customRegistryResult.match(/PullRequestLatency: (\d+\.\d+)/)?.[1] || 0),
// //             NetScore: parseFloat(customRegistryResult.match(/NetScore: (\d+\.\d+)/)?.[1] || 0),
// //             NetScoreLatency: parseFloat(customRegistryResult.match(/NetScoreLatency: (\d+\.\d+)/)?.[1] || 0),
// //         };

// //         // Return only parsed results in the response
// //         return createResponse(200, {
// //             ...parsedResult // Spread parsed result directly in the response body
// //         });
// //     } catch (error) {
// //         console.error('Error:', error);
// //         return createResponse(500, {
// //             error: `Internal server error: ${error.message}`,
// //             requestId: event.requestContext?.requestId
// //         });
// //     }
// // };
