import { Readable } from 'stream';
import { x } from 'tar';
import { gunzipSync } from 'zlib';
// Mock data structure
const mockS3Storage = {
    // Example mock packages - you can extend this
    'package-a--1.0.0': {
        sizeBytes: 1024 * 1024, // 1MB
        content: Buffer.from('mock-tar-gz-content'),
        packageJson: {
            dependencies: {
                'package-b': '2.0.0',
                'package-c': '1.5.0'
            }
        }
    },
    'package-b--2.0.0': {
        sizeBytes: 512 * 1024, // 0.5MB
        content: Buffer.from('mock-tar-gz-content'),
        packageJson: {
            dependencies: {
                'package-d': '1.0.0'
            }
        }
    }
};
// Mock S3 client
class MockS3Client {
    async send(command) {
        if (command.constructor.name === 'HeadObjectCommand') {
            return this.handleHeadObject(command.input);
        }
        else if (command.constructor.name === 'GetObjectCommand') {
            return this.handleGetObject(command.input);
        }
        throw new Error(`Unknown command: ${command.constructor.name}`);
    }
    handleHeadObject({ Bucket, Key }) {
        const package = mockS3Storage[Key];
        if (!package) {
            throw new Error('NotFound');
        }
        return {
            ContentLength: package.sizeBytes
        };
    }
    handleGetObject({ Bucket, Key }) {
        const package = mockS3Storage[Key];
        if (!package) {
            throw new Error('NotFound');
        }
        return {
            Body: Readable.from(package.content)
        };
    }
}
// Mock tar.gz extraction
const mockExtractDependencies = async (s3Response) => {
    // Get the package key from the mock response
    const packageKey = Object.keys(mockS3Storage).find(key => mockS3Storage[key].content === await streamToBuffer(s3Response.Body));
    if (!packageKey || !mockS3Storage[packageKey].packageJson) {
        return [];
    }
    const { dependencies = {}, devDependencies = {} } = mockS3Storage[packageKey].packageJson;
    const allDependencies = { ...dependencies, ...devDependencies };
    return Object.entries(allDependencies).map(([name, version]) => ({
        name,
        version: cleanVersion(version)
    }));
};
// Helper functions (unchanged)
const cleanVersion = (version) => {
    return version.replace(/^[\^~><=]+/, '');
};
const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};
// Main processing function
const processPackage = async (packageId, bucketName, processedPackages) => {
    if (processedPackages[packageId]) {
        return processedPackages[packageId].totalCost;
    }
    let standaloneCost = 0.0;
    let totalCost = 0.0;
    let dependencies = [];
    try {
        const s3 = new MockS3Client();
        // Get package size
        const headResponse = await s3.send({
            constructor: { name: 'HeadObjectCommand' },
            input: { Bucket: bucketName, Key: packageId }
        });
        const sizeBytes = headResponse.ContentLength;
        const sizeMB = Math.round((sizeBytes / (1024 * 1024)) * 100) / 100;
        standaloneCost = Math.round(sizeMB * 10) / 10;
        totalCost = standaloneCost;
        // Get dependencies
        const getObjectResponse = await s3.send({
            constructor: { name: 'GetObjectCommand' },
            input: { Bucket: bucketName, Key: packageId }
        });
        dependencies = await mockExtractDependencies(getObjectResponse);
    }
    catch (error) {
        console.warn(`Package ${packageId} not found. Using estimated size.`);
        const estimatedSizeMB = Math.round((500 * 1024 / (1024 * 1024)) * 100) / 100;
        standaloneCost = Math.round(estimatedSizeMB * 10) / 10;
        totalCost = standaloneCost;
        dependencies = [];
    }
    processedPackages[packageId] = {
        standaloneCost,
        totalCost
    };
    for (const dep of dependencies) {
        const depKey = `${dep.name}--${dep.version}`;
        const depTotalCost = await processPackage(depKey, bucketName, processedPackages);
        totalCost += depTotalCost;
    }
    processedPackages[packageId].totalCost = Math.round(totalCost * 10) / 10;
    return processedPackages[packageId].totalCost;
};
export const packageCostHandler = async (event) => {
    const bucketName = "acmeregistrys3";
    const packageId = event.id;
    const dependencyFlag = event.dependency === "true";
    if (!packageId) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        };
    }
    const isValidPackageId = (id) => {
        const regex = /^[a-zA-Z0-9_\-\.]+$/;
        return regex.test(id);
    };
    if (!isValidPackageId(packageId)) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        };
    }
    const processedPackages = {};
    try {
        await processPackage(packageId, bucketName, processedPackages);
        if (!dependencyFlag) {
            const standaloneCost = processedPackages[packageId].standaloneCost;
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ [packageId]: { "totalCost": standaloneCost } }),
            };
        }
        const responseBody = {};
        for (const [pkgId, costs] of Object.entries(processedPackages)) {
            responseBody[pkgId] = {
                "standaloneCost": costs.standaloneCost,
                "totalCost": costs.totalCost
            };
        }
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(responseBody),
        };
    }
    catch (error) {
        console.error("/package/{id}/cost: Error processing request:", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        };
    }
};
// Example test
const testPackageCost = async () => {
    // Test case 1: Package with dependencies
    const result1 = await packageCostHandler({
        id: 'package-a--1.0.0',
        dependency: 'true'
    });
    console.log('Test case 1 result:', JSON.parse(result1.body));
    // Test case 2: Package without dependencies
    const result2 = await packageCostHandler({
        id: 'non-existent-package',
        dependency: 'false'
    });
    console.log('Test case 2 result:', JSON.parse(result2.body));
};
// Uncomment to run tests
// testPackageCost();
// import { jest } from '@jest/globals';
// import { packageCostHandler } from '../../lambda/costPackage/index.mjs';
// import { S3Client } from "@aws-sdk/client-s3";
// // Set longer timeout for all tests
// jest.setTimeout(30000);
// describe('Cost Package Handler - Integration Tests', () => {
//     test('should calculate costs with dependencies for cloudinary package', async () => {
//         const response = await packageCostHandler({
//             id: "cloudinary_npm--2.5.1",
//             dependency: "true"
//         });
//         expect(response.statusCode).toBe(200);
//         const body = JSON.parse(response.body);
//         console.log('Cloudinary with dependencies response:', JSON.stringify(body, null, 2));
//         expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
//         expect(body["cloudinary_npm--2.5.1"].standaloneCost).toBeDefined();
//         expect(body["cloudinary_npm--2.5.1"].totalCost).toBeDefined();
//     });
//     test('should calculate standalone cost for cloudinary package', async () => {
//         const response = await packageCostHandler({
//             id: "cloudinary_npm--2.5.1",
//             dependency: "false"
//         });
//         expect(response.statusCode).toBe(200);
//         const body = JSON.parse(response.body);
//         console.log('Cloudinary standalone response:', JSON.stringify(body, null, 2));
//         expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
//         expect(body["cloudinary_npm--2.5.1"].totalCost).toBeDefined();
//     });
//     test('should handle non-existent package', async () => {
//         const response = await packageCostHandler({
//             id: "non-existent-package--1.0.0",
//             dependency: "true"
//         });
//         expect(response.statusCode).toBe(200);
//         const body = JSON.parse(response.body);
//         expect(body["non-existent-package--1.0.0"].totalCost).toBe(0.5);
//     });
// });
// describe('Cost Package Handler - Common Tests', () => {
//     test('should handle invalid package ID', async () => {
//         const response = await packageCostHandler({
//             id: "../invalid/package/id",
//             dependency: "true"
//         });
//         expect(response.statusCode).toBe(400);
//     });
//     test('should handle missing package ID', async () => {
//         const response = await packageCostHandler({
//             dependency: "true"
//         });
//         expect(response.statusCode).toBe(400);
//     });
//     test('should handle missing dependency flag', async () => {
//         const response = await packageCostHandler({
//             id: "cloudinary_npm--2.5.1"
//         });
//         expect(response.statusCode).toBe(200);
//         const body = JSON.parse(response.body);
//         expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
//     });
// });
//# sourceMappingURL=index.test.mjs.map