// index.mjs
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// Constants
const BUCKET_NAME = "acmeregistrys3";
const DEFAULT_SCORE = "-1";
const ALLOWED_UPLOAD_SOURCES = ['github', 'npm', 'content'];

// Initialize S3 client outside the handler for better performance
const s3Client = new S3Client({ region: "us-east-1" });

// Reusable CORS headers
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// Helper function for API responses
const createResponse = (statusCode, body) => ({
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
});

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
const constructPackageUrl = (uploadVia, metadata) => {
    switch (uploadVia?.toLowerCase()) {
        case 'github':
            return metadata.url || 'Invalid GitHub URL';
        case 'npm':
            return metadata.name ? `https://www.npmjs.com/package/${metadata.name}` : 'Invalid NPM package name';
        case 'content':
            return metadata.contentUrl || 'Content URL not available';
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
export const handler = async (event) => {
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

        try {
            // Fetch package data
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
            const packageUrl = constructPackageUrl(metadata.uploadvia, metadata);
            if (packageUrl && packageUrl !== metadata.packageUrl) {
                metadata.packageUrl = packageUrl;
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
            // Handle case where GetObject fails
            if (error.$metadata?.httpStatusCode === 404 || error.name === 'NoSuchKey') {
                console.log(`Package ${packageId} not found during fetch`);
                return createResponse(404, { 
                    error: `Package ${packageId} not found`,
                    packageId
                });
            }
            throw error;
        }

    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { 
            error: `Internal server error: ${error.message}`,
            requestId: event.requestContext?.requestId
        });
    }
};

// import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
// import { Client } from 'ssh2';

// // AWS Secrets Manager client
// const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });

// const EC2_IP = '34.205.19.248'; // Your EC2 Public IP
// const SECRET_NAME = 'your-secret-name'; // The name of the secret you stored

// // SSH client
// const sshClient = new Client();

// // Helper function to get the private key from Secrets Manager
// const getPrivateKeyFromSecretsManager = async () => {
//   try {
//     const command = new GetSecretValueCommand({
//       SecretId: SECRET_NAME,
//     });
//     const secret = await secretsManagerClient.send(command);
//     // If the secret is in plain text (not JSON), return it directly
//     return secret.SecretString;
//   } catch (error) {
//     console.error('Failed to retrieve private key from Secrets Manager:', error);
//     throw new Error('Could not retrieve private key');
//   }
// };

// // Connect to EC2 using SSH
// const connectToEC2 = (privateKey) => {
//   return new Promise((resolve, reject) => {
//     sshClient.on('ready', () => {
//       console.log('SSH connection established');
//       sshClient.exec('uptime', (err, stream) => {
//         if (err) return reject(err);

//         stream.on('close', (code, signal) => {
//           console.log(`Stream closed with code: ${code}`);
//           sshClient.end();
//           resolve(code);
//         }).on('data', (data) => {
//           console.log('STDOUT:', data.toString());
//         }).stderr.on('data', (data) => {
//           console.error('STDERR:', data.toString());
//         });
//       });
//     }).on('error', (err) => {
//       console.error('SSH connection failed', err);
//       reject(err);
//     }).connect({
//       host: EC2_IP,
//       port: 22,
//       username: 'ec2-user', // or 'ubuntu' based on your AMI
//       privateKey: privateKey, // Private key retrieved from Secrets Manager
//     });
//   });
// };

// // Main Lambda handler
// export const handler = async (event) => {
//   try {
//     console.log('Fetching private key from Secrets Manager...');
//     const privateKey = await getPrivateKeyFromSecretsManager();
    
//     console.log('Connecting to EC2...');
//     await connectToEC2(privateKey);

//     return {
//       statusCode: 200,
//       body: JSON.stringify({ message: 'Successfully connected to EC2 instance' }),
//     };
//   } catch (error) {
//     console.error('Error connecting to EC2:', error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: 'EC2 instance is not reachable' }),
//     };
//   }
// };
