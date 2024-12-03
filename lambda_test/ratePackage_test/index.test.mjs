import { jest } from '@jest/globals';
import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';
import { S3Client } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import { gzipSync } from 'zlib';

// Set longer timeout for all tests
jest.setTimeout(60000);

// Mock AWS SDK for mocked tests
jest.mock('@aws-sdk/client-s3');

// Mock child_process and fs
const mockExecPromise = jest.fn();
jest.mock('child_process', () => ({
    exec: () => mockExecPromise
}));

jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: (fn) => (...args) => mockExecPromise(...args)
}));

const mockMkdir = jest.fn();
const mockUnlink = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('fs/promises', () => ({
    mkdir: (...args) => mockMkdir(...args),
    unlink: (...args) => mockUnlink(...args),
    writeFile: (...args) => mockWriteFile(...args)
}));

// Helper function for checking metrics
const expectMetricsFields = (body) => {
    expect(body.NetScore).toBeDefined();
    expect(body.RampUp).toBeDefined();
    expect(body.Correctness).toBeDefined();
    expect(body.BusFactor).toBeDefined();
    expect(body.ResponsiveMaintainer).toBeDefined();
    expect(body.LicenseScore).toBeDefined();
    expect(body.GoodPinningPractice).toBeDefined();
    expect(body.PullRequest).toBeDefined();
};

describe('Rate Package Handler - Mocked Tests', () => {
    let mockS3Send;

    beforeEach(() => {
        jest.clearAllMocks();
        mockS3Send = jest.fn();
        S3Client.prototype.send = mockS3Send;

        // Default success responses
        mockMkdir.mockResolvedValue(undefined);
        mockUnlink.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined);

        mockExecPromise.mockResolvedValue({
            stdout: JSON.stringify({
                NetScore: 0.5,
                RampUp: 0.5,
                Correctness: 0.5,
                BusFactor: 0.5,
                ResponsiveMaintainer: 0.5,
                LicenseScore: 1.0,
                GoodPinningPractice: 0.5,
                PullRequest: 0.7
            }),
            stderr: ''
        });
    });

    test('should handle NPM package successfully', async () => {
        mockS3Send
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Metadata: {
                    uploadvia: 'npm',
                    name: 'lodash',
                    version: '4.17.21'
                }
            });

        const response = await ratePackageHandler({
            pathParameters: { id: "lodash@4.17.21" }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expectMetricsFields(body);
    });

    test('should handle gzipped content package successfully', async () => {
        const packageJson = {
            name: "cloudinary",
            version: "2.5.1",
            repository: {
                url: "https://github.com/cloudinary/cloudinary_npm"
            }
        };
        
        const gzippedBuffer = gzipSync(Buffer.from(JSON.stringify(packageJson)));
        const mockStream = Readable.from(gzippedBuffer);

        mockS3Send
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Metadata: {
                    uploadvia: 'content'
                },
                Body: mockStream
            });

        const response = await ratePackageHandler({
            pathParameters: { id: "cloudinary_npm--2.5.1" }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expectMetricsFields(body);
    });

    test('should handle non-existent package', async () => {
        mockS3Send.mockRejectedValueOnce({
            name: 'NotFound',
            $metadata: { httpStatusCode: 404 }
        });

        const response = await ratePackageHandler({
            pathParameters: { id: "non-existent-package@1.0.0" }
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error).toContain('not found');
    });

    test('should handle missing package ID', async () => {
        const response = await ratePackageHandler({
            pathParameters: {}
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toBe('Package ID is required');
    });
});

describe('Rate Package Handler - Integration Tests', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.dontMock('@aws-sdk/client-s3');
    });

    test('should rate real cloudinary package successfully', async () => {
        const response = await ratePackageHandler({
            pathParameters: { id: "cloudinary_npm--2.5.1" }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        console.log('Real cloudinary package response:', JSON.stringify(body, null, 2));
        expectMetricsFields(body);
    }, 60000);

    test('should rate real npm package successfully', async () => {
        const response = await ratePackageHandler({
            pathParameters: { id: "lodash@4.17.21" }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        console.log('Real npm package response:', JSON.stringify(body, null, 2));
        expectMetricsFields(body);
    }, 60000);

    test('should handle real non-existent package', async () => {
        const response = await ratePackageHandler({
            pathParameters: { id: "non-existent-package--99.99.99" }
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error).toContain('not found');
    });
});

// import { jest } from '@jest/globals';
// import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';
// import { S3Client } from "@aws-sdk/client-s3";
// import { Readable } from 'stream';
// import AdmZip from 'adm-zip';

// // Mock AWS SDK
// jest.mock('@aws-sdk/client-s3');

// // Mock child_process and fs
// const mockExecPromise = jest.fn();
// jest.mock('child_process', () => ({
//     exec: () => mockExecPromise
// }));

// jest.mock('util', () => ({
//     ...jest.requireActual('util'),
//     promisify: (fn) => (...args) => mockExecPromise(...args)
// }));

// const mockMkdir = jest.fn();
// const mockUnlink = jest.fn();
// const mockWriteFile = jest.fn();

// jest.mock('fs/promises', () => ({
//     mkdir: (...args) => mockMkdir(...args),
//     unlink: (...args) => mockUnlink(...args),
//     writeFile: (...args) => mockWriteFile(...args)
// }));

// describe('Rate Package Handler', () => {
//     let mockS3Send;

//     beforeEach(() => {
//         jest.clearAllMocks();
//         mockS3Send = jest.fn();
//         S3Client.prototype.send = mockS3Send;

//         // Default success responses for fs operations
//         mockMkdir.mockResolvedValue(undefined);
//         mockUnlink.mockResolvedValue(undefined);
//         mockWriteFile.mockResolvedValue(undefined);

//         // Default success response for exec
//         mockExecPromise.mockResolvedValue({
//             stdout: JSON.stringify({
//                 NetScore: 0.5,
//                 NetScoreLatency: 0.2,
//                 RampUp: 0.5,
//                 RampUpLatency: 0.1,
//                 Correctness: 0.5,
//                 CorrectnessLatency: 0.3,
//                 BusFactor: 0.5,
//                 BusFactorLatency: 0.4,
//                 ResponsiveMaintainer: 0.5,
//                 ResponsiveMaintainerLatency: 0.5,
//                 LicenseScore: 1.0,
//                 LicenseScoreLatency: 0.1,
//                 GoodPinningPractice: 0.5,
//                 GoodPinningPracticeLatency: 0.6,
//                 PullRequest: 0.7,
//                 PullRequestLatency: 0.2
//             }),
//             stderr: ''
//         });
//     });

//     test('should handle NPM package successfully', async () => {
//         mockS3Send.mockResolvedValueOnce({});  // HEAD
//         mockS3Send.mockResolvedValueOnce({     // GET
//             Metadata: {
//                 uploadvia: 'npm',
//                 name: 'lodash',
//                 version: '4.17.21',
//                 score: '8.5'
//             }
//         });
//         mockS3Send.mockResolvedValueOnce({});  // PUT

//         const event = {
//             pathParameters: {
//                 id: "lodash@4.17.21"
//             }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         // Check if the metric values are defined
//         expect(body.NetScore).toBeDefined();
//         expect(body.NetScoreLatency).toBeDefined();
//         expect(body.RampUp).toBeDefined();
//         expect(body.RampUpLatency).toBeDefined();
//         expect(body.Correctness).toBeDefined();
//         expect(body.CorrectnessLatency).toBeDefined();
//         expect(body.BusFactor).toBeDefined();
//         expect(body.BusFactorLatency).toBeDefined();
//         expect(body.ResponsiveMaintainer).toBeDefined();
//         expect(body.ResponsiveMaintainerLatency).toBeDefined();
//         expect(body.LicenseScore).toBeDefined();
//         expect(body.LicenseScoreLatency).toBeDefined();
//         expect(body.GoodPinningPractice).toBeDefined();
//         expect(body.GoodPinningPracticeLatency).toBeDefined();
//         expect(body.PullRequest).toBeDefined();
//         expect(body.PullRequestLatency).toBeDefined();
//     });

//     test('should handle GitHub package successfully', async () => {
//         mockS3Send.mockResolvedValueOnce({});  // HEAD
//         mockS3Send.mockResolvedValueOnce({     // GET
//             Metadata: {
//                 uploadvia: 'github',
//                 url: 'https://github.com/cloudinary/cloudinary_npm',
//                 score: '8.5'
//             }
//         });
//         mockS3Send.mockResolvedValueOnce({});  // PUT

//         const event = {
//             pathParameters: {
//                 id: "cloudinary-npm-2.5.1"
//             }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         // Check if the metric values are defined
//         expect(body.NetScore).toBeDefined();
//         expect(body.NetScoreLatency).toBeDefined();
//         expect(body.RampUp).toBeDefined();
//         expect(body.RampUpLatency).toBeDefined();
//         expect(body.Correctness).toBeDefined();
//         expect(body.CorrectnessLatency).toBeDefined();
//         expect(body.BusFactor).toBeDefined();
//         expect(body.BusFactorLatency).toBeDefined();
//         expect(body.ResponsiveMaintainer).toBeDefined();
//         expect(body.ResponsiveMaintainerLatency).toBeDefined();
//         expect(body.LicenseScore).toBeDefined();
//         expect(body.LicenseScoreLatency).toBeDefined();
//         expect(body.GoodPinningPractice).toBeDefined();
//         expect(body.GoodPinningPracticeLatency).toBeDefined();
//         expect(body.PullRequest).toBeDefined();
//         expect(body.PullRequestLatency).toBeDefined();
//     });

//     test('should handle zip file content package successfully', async () => {
//         // Create a mock zip file with package.json
//         const zip = new AdmZip();
//         const packageJson = {
//             name: "cloudinary",
//             version: "2.5.1",
//             homepage: "https://github.com/cloudinary/cloudinary_npm",
//             repository: {
//                 type: "git",
//                 url: "git+https://github.com/cloudinary/cloudinary_npm.git"
//             }
//         };
//         zip.addFile("package.json", Buffer.from(JSON.stringify(packageJson)));
//         const zipBuffer = zip.toBuffer();

//         // Create a mock readable stream from the zip buffer
//         const mockStream = new Readable();
//         mockStream.push(zipBuffer);
//         mockStream.push(null);

//         mockS3Send.mockResolvedValueOnce({});  // HEAD
//         mockS3Send.mockResolvedValueOnce({     // GET
//             Metadata: {
//                 uploadvia: 'content',
//                 score: '-1'
//             },
//             Body: mockStream
//         });
//         mockS3Send.mockResolvedValueOnce({});  // PUT

//         const event = {
//             pathParameters: {
//                 id: "cloudinary_npm--2.5.1"
//             }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         // Check if the metric values are defined
//         expect(body.NetScore).toBeDefined();
//         expect(body.NetScoreLatency).toBeDefined();
//         expect(body.RampUp).toBeDefined();
//         expect(body.RampUpLatency).toBeDefined();
//         expect(body.Correctness).toBeDefined();
//         expect(body.CorrectnessLatency).toBeDefined();
//         expect(body.BusFactor).toBeDefined();
//         expect(body.BusFactorLatency).toBeDefined();
//         expect(body.ResponsiveMaintainer).toBeDefined();
//         expect(body.ResponsiveMaintainerLatency).toBeDefined();
//         expect(body.LicenseScore).toBeDefined();
//         expect(body.LicenseScoreLatency).toBeDefined();
//         expect(body.GoodPinningPractice).toBeDefined();
//         expect(body.GoodPinningPracticeLatency).toBeDefined();
//         expect(body.PullRequest).toBeDefined();
//         expect(body.PullRequestLatency).toBeDefined();
//     });

//     test('should handle invalid URL in zip content', async () => {
//         // Create a zip file with invalid URL
//         const zip = new AdmZip();
//         const packageJson = {
//             name: "test-package",
//             repository: {
//                 url: "https://invalid-url.com/repo"
//             }
//         };
//         zip.addFile("package.json", Buffer.from(JSON.stringify(packageJson)));
//         const zipBuffer = zip.toBuffer();

//         const mockStream = new Readable();
//         mockStream.push(zipBuffer);
//         mockStream.push(null);

//         mockS3Send.mockResolvedValueOnce({});  // HEAD
//         mockS3Send.mockResolvedValueOnce({     // GET
//             Metadata: {
//                 uploadvia: 'content',
//                 score: '8.5'
//             },
//             Body: mockStream
//         });
//         mockS3Send.mockResolvedValueOnce({});  // PUT

//         const event = {
//             pathParameters: {
//                 id: "test-package.zip"
//             }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();  // Ensure parsed result is returned
//     });

//     test('should return 404 for non-existent package', async () => {
//         mockS3Send.mockRejectedValueOnce({
//             name: 'NotFound',
//             $metadata: { httpStatusCode: 404 }
//         });

//         const event = {
//             pathParameters: {
//                 id: "non-existent-package@1.0.0"
//             }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(404);
//         expect(body.error).toContain('not found');
//     });

//     test('should handle missing package ID', async () => {
//         const event = {
//             pathParameters: {}
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(400);
//         expect(body.error).toBe('Package ID is required');
//     });
// });
