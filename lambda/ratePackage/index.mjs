import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createResponse } from './utils/createResponse.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { gunzipSync } from 'zlib';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Updated Helper function to extract URL from package.json in gzipped file
const getUrlFromGzip = async (s3Response) => {
    try {
        // Convert S3 response body stream to buffer
        const streamToBuffer = async (stream) => {
            try {
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                return Buffer.concat(chunks);
            } catch (error) {
                console.error('Error converting stream to buffer:', error);
                throw new Error('Failed to read package data stream');
            }
        };

        // Handle case where Body might be a buffer or stream
        let base64EncodedBuffer;
        try {
            base64EncodedBuffer = s3Response.Body instanceof Readable
                ? await streamToBuffer(s3Response.Body)
                : s3Response.Body;
        } catch (error) {
            console.error('Error processing S3 response body:', error);
            throw new Error('Failed to process package data');
        }

        // Decode base64-encoded data
        let gzippedBuffer;
        try {
            gzippedBuffer = Buffer.from(base64EncodedBuffer.toString('utf8'), 'base64');
        } catch (error) {
            console.error('Error decoding base64 data:', error);
            throw new Error('Failed to decode base64 data');
        }

        // Decompress the gzipped content
        let unzippedBuffer;
        try {
            unzippedBuffer = gunzipSync(gzippedBuffer);
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
            console.error('No URL found in package.json fields');
            throw new Error('Missing URL information - no repository URL, homepage, or repository string found in package.json');
        }

        // Clean and sanitize the URL
        const cleanUrl = url.replace(/^git\+/, '')
            .replace(/\.git$/, '')
            .replace(/^ssh:\/\//, 'https://')
            .replace(/^git:\/\//, 'https://');

        // Validate URL format
        let urlObj;
        try {
            urlObj = new URL(cleanUrl);
        } catch (error) {
            console.error('Error parsing URL:', error);
            throw new Error(`Invalid URL format in package.json: ${cleanUrl}`);
        }

        // Create sanitized URL
        const sanitizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.split('/').slice(0, 3).join('/')}`;

        if (!isValidUrl(sanitizedUrl)) {
            console.error('URL does not contain valid hostname:', sanitizedUrl);
            throw new Error('Invalid repository URL - must contain github.com or npmjs.com');
        }

        return sanitizedUrl;
    } catch (error) {
        // Log the specific error that was thrown
        console.error('Error extracting URL from gzip:', error.message);
        return null;
    }
};

/////////////////////////


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
                const url = await getUrlFromGzip(s3Response);
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
        }

        // Parse customRegistryResult and map it to the required fields
        const customRegistryResult = metadata.customRegistryResult || '';
        const parsedResult = {
            BusFactor: parseFloat(customRegistryResult.match(/BusFactor: (\d+\.\d+)/)?.[1] || 0),
            BusFactorLatency: parseFloat(customRegistryResult.match(/BusFactorLatency: (\d+\.\d+)/)?.[1] || 0),
            Correctness: parseFloat(customRegistryResult.match(/Correctness: (\d+\.\d+)/)?.[1] || 0),
            CorrectnessLatency: parseFloat(customRegistryResult.match(/CorrectnessLatency: (\d+\.\d+)/)?.[1] || 0),
            RampUp: parseFloat(customRegistryResult.match(/RampUp: (\d+\.\d+)/)?.[1] || 0),
            RampUpLatency: parseFloat(customRegistryResult.match(/RampUpLatency: (\d+\.\d+)/)?.[1] || 0),
            ResponsiveMaintainer: parseFloat(customRegistryResult.match(/ResponsiveMaintainer: (\d+\.\d+)/)?.[1] || 0),
            ResponsiveMaintainerLatency: parseFloat(customRegistryResult.match(/ResponsiveMaintainerLatency: (\d+\.\d+)/)?.[1] || 0),
            LicenseScore: parseFloat(customRegistryResult.match(/LicenseScore: (\d+\.\d+)/)?.[1] || 0),
            LicenseScoreLatency: parseFloat(customRegistryResult.match(/LicenseScoreLatency: (\d+\.\d+)/)?.[1] || 0),
            GoodPinningPractice: parseFloat(customRegistryResult.match(/GoodPinningPractice: (\d+\.\d+)/)?.[1] || 0),
            GoodPinningPracticeLatency: parseFloat(customRegistryResult.match(/GoodPinningPracticeLatency: (\d+\.\d+)/)?.[1] || 0),
            PullRequest: parseFloat(customRegistryResult.match(/PullRequest: (\d+\.\d+)/)?.[1] || 0),
            PullRequestLatency: parseFloat(customRegistryResult.match(/PullRequestLatency: (\d+\.\d+)/)?.[1] || 0),
            NetScore: parseFloat(customRegistryResult.match(/NetScore: (\d+\.\d+)/)?.[1] || 0),
            NetScoreLatency: parseFloat(customRegistryResult.match(/NetScoreLatency: (\d+\.\d+)/)?.[1] || 0),
        };

        // Return only parsed results in the response
        return createResponse(200, {
            ...parsedResult // Spread parsed result directly in the response body
        });
    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { message: "The package rating system choked on at least one of the metrics."});
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

// // // Helper function to extract URL from package.json in gzipped file
// // const getUrlFromGzip = async (s3Response) => {
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
// //         const gzippedBuffer = s3Response.Body instanceof Readable ?
// //             await streamToBuffer(s3Response.Body) :
// //             s3Response.Body;

// //         // Decompress the gzipped content
// //         const unzippedBuffer = gunzipSync(gzippedBuffer);
        
// //         // Parse the unzipped content as JSON (assuming it's package.json)
// //         const packageJson = JSON.parse(unzippedBuffer.toString('utf8'));

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
// //         console.error('Error extracting URL from gzip:', error);
// //         return null;
// //     }
// // };

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
// //                 const url = await getUrlFromGzip(s3Response);
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

//         // Handle case where Body might be a buffer or stream
//         const gzippedBuffer = s3Response.Body instanceof Readable
//             ? await streamToBuffer(s3Response.Body)
//             : s3Response.Body;

//         // Decompress the gzipped content
//         const unzippedBuffer = gunzipSync(gzippedBuffer);

//         // Parse the unzipped content as JSON (assuming it's package.json)
//         const packageJson = JSON.parse(unzippedBuffer.toString('utf8'));

//         // Extract URL from package.json fields
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

//         // Validate the URL
//         if (!isValidUrl(cleanUrl)) {
//             throw new Error('Invalid URL: must contain github.com or npmjs.com');
//         }

//         return cleanUrl;
//     } catch (error) {
//         console.error('Error extracting URL from gzip:', error);
//         return null;
//     }
// };

// // Updated constructPackageUrl function
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
