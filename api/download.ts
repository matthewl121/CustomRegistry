import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

async function downloadFile(bucketName: string, key: string, downloadPath: string) {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    
    try {
        const data = await s3.getObject(params).promise();
        const filePath = path.join(downloadPath, key);
        fs.writeFileSync(filePath, data.Body as Buffer);
        console.log(`File downloaded successfully. File path: ${filePath}`);
    } catch (error) {
        console.error(`Error downloading file: ${error}`);
    }
}