import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"; 
import { Client } from 'ssh2'; 

const BUCKET_NAME = "acmeregistrys3";
const DEFAULT_SCORE = "-1";

// EC2 SSH Constants
const EC2_IP = '34.205.19.248'; 
const secretName = 'my-ec2-private-key'; 

const s3Client = new S3Client({ region: "us-east-1" });
const secretsManager = new SecretsManagerClient({ region: 'us-east-1' });

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

const connectToEC2 = async (privateKey) => {
    const sshClient = new Client();
    return new Promise((resolve, reject) => {
        sshClient.on('ready', () => {
            console.log('SSH connection established');
            sshClient.exec('pwd', (err, stream) => {
                if (err) reject(err);
                stream
                    .on('close', (code, signal) => {
                        console.log(`Stream closed with code: ${code}`);
                        sshClient.end();
                        resolve();
                    })
                    .on('data', (data) => {
                        console.log('Current working directory:', data.toString());
                    })
                    .stderr.on('data', (data) => {
                        console.error('STDERR:', data.toString());
                    });
            });
        }).on('error', (err) => {
            console.error('SSH connection failed', err);
            reject(err);
        }).connect({
            host: EC2_IP,
            port: 22,
            username: 'ec2-user',
            privateKey: privateKey, 
        });
    });
};

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
});

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const packageId = event.pathParameters?.id;
        if (!packageId) {
            return createResponse(400, { error: 'Package ID is required' });
        }

        const response = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: packageId
        }));

        let metadata = response.Metadata || {};

        if (!metadata.score) {
            metadata.score = DEFAULT_SCORE;
            metadata.lastUpdated = new Date().toISOString();
        }

        const secretValue = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretName }));
        const privateKey = secretValue.SecretString;

        await connectToEC2(privateKey);

        return createResponse(200, {
            packageId,
            metadata
        });

    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { 
            error: `Internal server error: ${error.message}`,
            requestId: event.requestContext?.requestId
        });
    }
};
