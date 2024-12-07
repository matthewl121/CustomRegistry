import { jest } from '@jest/globals';
import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';
import { S3Client } from "@aws-sdk/client-s3";

// Mock child process and fs
const mockExecPromise = jest.fn();
jest.mock('child_process', () => ({
    exec: () => mockExecPromise
}));

jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: (fn) => (...args) => mockExecPromise(...args)
}));

describe('Rate Package Handler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  test('/package/{id}/rate | GET | Valid input', async () => {
    // Mock successful package existence check and metrics computation
    mockS3Send
      .mockResolvedValueOnce({})  // HEAD
      .mockResolvedValueOnce({    // GET
        Metadata: {
          uploadvia: 'npm',
          name: 'test-package',
          version: '1.0.0'
        }
      });
    mockExecPromise.mockResolvedValueOnce({
      stdout: JSON.stringify({
        BusFactor: 0.8,
        BusFactorLatency: 0.7,
        Correctness: 0.9,
        CorrectnessLatency: 0.8,
        RampUp: 0.6,
        RampUpLatency: 0.5,
        ResponsiveMaintainer: 0.7,
        ResponsiveMaintainerLatency: 0.6,
        LicenseScore: 0.9,
        LicenseScoreLatency: 0.8,
        GoodPinningPractice: 0.7,
        GoodPinningPracticeLatency: 0.6,
        PullRequest: 0.8,
        PullRequestLatency: 0.7,
        NetScore: 0.8,
        NetScoreLatency: 0.7
      }),
      stderr: ''
    });

    const event = {
      pathParameters: { id: "test-package@1.0.0" }
    };

    const response = await ratePackageHandler(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    });

    const body = JSON.parse(response.body);
    // Validate that all metrics are numbers
    Object.keys(body).forEach(key => {
      expect(typeof body[key]).toBe('number');
    });

    // Optionally validate range or specific value expectations
    expect(body.LicenseScoreLatency).toBeGreaterThanOrEqual(0.0);
    expect(body.GoodPinningPractice).toBeGreaterThanOrEqual(0.0);

    // Verify return codes
    expect(response.statusCode).toBe(200);

    // Print the response for validation
    console.log("Returned status code:", response.statusCode);
    console.log("Returned metrics:", body);
  });

  test('/package/{id}/rate | GET | Invalid input (400)', async () => {
    const event = {
      pathParameters: { id: null }  // Missing PackageID
    };

    const response = await ratePackageHandler(event);

    expect(response.statusCode).toBe(400);
    console.log("Returned status code:", response.statusCode);
  });

  test('/package/{id}/rate | GET | Package not found (404)', async () => {
    const event = {
      pathParameters: { id: "non-existent-package@1.0.0" }
    };

    const response = await ratePackageHandler(event);

    expect(response.statusCode).toBe(404);
    console.log("Returned status code:", response.statusCode);
  });
});



// import { jest } from '@jest/globals';
// import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';
// import { S3Client } from "@aws-sdk/client-s3";

// // Mock child process and fs
// const mockExecPromise = jest.fn();
// jest.mock('child_process', () => ({
//     exec: () => mockExecPromise
// }));

// jest.mock('util', () => ({
//     ...jest.requireActual('util'),
//     promisify: (fn) => (...args) => mockExecPromise(...args)
// }));

// describe('Rate Package Handler', () => {
//   let mockS3Send;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockS3Send = jest.fn();
//     S3Client.prototype.send = mockS3Send;
//   });

//   test('/package/{id}/rate | GET | Valid input', async () => {
//     // Mock successful package existence check and metrics computation
//     mockS3Send
//       .mockResolvedValueOnce({})  // HEAD
//       .mockResolvedValueOnce({    // GET
//         Metadata: {
//           uploadvia: 'npm',
//           name: 'test-package',
//           version: '1.0.0'
//         }
//       });
//     mockExecPromise.mockResolvedValueOnce({
//       stdout: JSON.stringify({
//         BusFactor: 0.8,
//         BusFactorLatency: 0.7,
//         Correctness: 0.9,
//         CorrectnessLatency: 0.8,
//         RampUp: 0.6,
//         RampUpLatency: 0.5,
//         ResponsiveMaintainer: 0.7,
//         ResponsiveMaintainerLatency: 0.6,
//         LicenseScore: 0.9,
//         LicenseScoreLatency: 0.8,
//         GoodPinningPractice: 0.7,
//         GoodPinningPracticeLatency: 0.6,
//         PullRequest: 0.8,
//         PullRequestLatency: 0.7,
//         NetScore: 0.8,
//         NetScoreLatency: 0.7
//       }),
//       stderr: ''
//     });

//     const event = {
//       pathParameters: { id: "test-package@1.0.0" }
//     };

//     const response = await ratePackageHandler(event);

//     expect(response.statusCode).toBe(200);
//     expect(response.headers).toEqual({
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type',
//       'Content-Type': 'application/json'
//     });

//     const body = JSON.parse(response.body);
//     // Validate that all metrics are numbers
//     Object.keys(body).forEach(key => {
//       expect(typeof body[key]).toBe('number');
//     });

//     // Optionally validate range or specific value expectations
//     expect(body.LicenseScoreLatency).toBeGreaterThanOrEqual(0.0);
//     expect(body.GoodPinningPractice).toBeGreaterThanOrEqual(0.0);
//     // Add more specific range validations as needed
//   });
// });


// import { jest } from '@jest/globals';
// import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';
// import { S3Client } from "@aws-sdk/client-s3";

// // Store test results for API requirements
// const apiRequirements = {
//   'Success - 200': false,
//   '400 - Missing PackageID': false,
//   '404 - Package Not Found': false,
//   '500 - Rating System Error': false
// };

// // Print API requirements status after all tests
// afterAll(() => {
//   console.log('\n=== API Requirements Status ===');
//   console.log('/package/{id}/rate | GET');
//   Object.entries(apiRequirements).forEach(([requirement, passed]) => {
//     console.log(`${passed ? '✓' : '✗'} ${requirement}`);
//   });
//   console.log('============================\n');
// });

// // Mock AWS SDK
// jest.mock('@aws-sdk/client-s3');

// // Mock child_process
// const mockExecPromise = jest.fn();
// jest.mock('child_process', () => ({
//     exec: () => mockExecPromise
// }));

// jest.mock('util', () => ({
//     ...jest.requireActual('util'),
//     promisify: (fn) => (...args) => mockExecPromise(...args)
// }));

// // Mock fs promises
// jest.mock('fs/promises', () => ({
//     mkdir: jest.fn().mockResolvedValue(undefined),
//     unlink: jest.fn().mockResolvedValue(undefined),
//     writeFile: jest.fn().mockResolvedValue(undefined)
// }));

// describe('Rate Package Handler', () => {
//     let mockS3Send;

//     beforeEach(() => {
//         jest.clearAllMocks();
//         mockS3Send = jest.fn();
//         S3Client.prototype.send = mockS3Send;
//     });

//     test('200: Successfully rates package with all metrics', async () => {
//         // Mock successful package existence check
//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: {
//                     uploadvia: 'npm',
//                     name: 'test-package',
//                     version: '1.0.0'
//                 }
//             });

//         // Mock successful metrics computation
//         mockExecPromise.mockResolvedValueOnce({
//             stdout: JSON.stringify({
//                 BusFactor: 0.1,
//                 BusFactorLatency: 0.1,
//                 Correctness: 0.1,
//                 CorrectnessLatency: 0.1,
//                 RampUp: 0.1,
//                 RampUpLatency: 0.1,
//                 ResponsiveMaintainer: 0.1,
//                 ResponsiveMaintainerLatency: 0.1,
//                 LicenseScore: 0.1,
//                 LicenseScoreLatency: 0.1,
//                 GoodPinningPractice: 0.1,
//                 GoodPinningPracticeLatency: 0.1,
//                 PullRequest: 0.1,
//                 PullRequestLatency: 0.1,
//                 NetScore: 0.1,
//                 NetScoreLatency: 0.1
//             }),
//             stderr: ''
//         });

//         const event = {
//             pathParameters: { id: "test-package@1.0.0" }
//         };

//         const response = await ratePackageHandler(event);
        
//         expect(response.statusCode).toBe(200);
//         expect(response.headers).toEqual({
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type',
//             'Content-Type': 'application/json'
//         });

//         const body = JSON.parse(response.body);
        
//         // Verify all required metrics are present with correct types
//         const requiredMetrics = [
//             'BusFactor', 'BusFactorLatency',
//             'Correctness', 'CorrectnessLatency',
//             'RampUp', 'RampUpLatency',
//             'ResponsiveMaintainer', 'ResponsiveMaintainerLatency',
//             'LicenseScore', 'LicenseScoreLatency',
//             'GoodPinningPractice', 'GoodPinningPracticeLatency',
//             'PullRequest', 'PullRequestLatency',
//             'NetScore', 'NetScoreLatency'
//         ];

//         requiredMetrics.forEach(metric => {
//             expect(body).toHaveProperty(metric);
//             expect(typeof body[metric]).toBe('number');
//         });

//         apiRequirements['Success - 200'] = true;
//     });

//     test('400: Returns error for missing package ID', async () => {
//         const event = { pathParameters: {} };

//         const response = await ratePackageHandler(event);
        
//         expect(response.statusCode).toBe(400);
//         expect(response.headers).toEqual({
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type',
//             'Content-Type': 'application/json'
//         });

//         const body = JSON.parse(response.body);
//         expect(body.message).toBe('There is missing field(s) in the PackageID');

//         apiRequirements['400 - Missing PackageID'] = true;
//     });

//     test('404: Returns error when package does not exist', async () => {
//         mockS3Send.mockRejectedValueOnce({ 
//             name: 'NotFound', 
//             $metadata: { httpStatusCode: 404 } 
//         });

//         const event = { 
//             pathParameters: { id: "non-existent-package@1.0.0" } 
//         };

//         const response = await ratePackageHandler(event);
        
//         expect(response.statusCode).toBe(404);
//         expect(response.headers).toEqual({
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type',
//             'Content-Type': 'application/json'
//         });

//         const body = JSON.parse(response.body);
//         expect(body.message).toBe('Package does not exist.');

//         apiRequirements['404 - Package Not Found'] = true;
//     });

//     test('500: Returns error when metrics computation fails', async () => {
//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: {
//                     uploadvia: 'npm',
//                     name: 'error-package'
//                 }
//             });

//         mockExecPromise.mockRejectedValueOnce(new Error('Metrics computation failed'));

//         const event = {
//             pathParameters: { id: "error-package@1.0.0" }
//         };

//         const response = await ratePackageHandler(event);
        
//         expect(response.statusCode).toBe(500);
//         expect(response.headers).toEqual({
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type',
//             'Content-Type': 'application/json'
//         });

//         const body = JSON.parse(response.body);
//         expect(body.message).toBe('The package rating system choked on at least one of the metrics.');

//         apiRequirements['500 - Rating System Error'] = true;
//     });
// });


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

//         // Mock default behavior for file system operations
//         mockMkdir.mockResolvedValue(undefined);
//         mockUnlink.mockResolvedValue(undefined);
//         mockWriteFile.mockResolvedValue(undefined);

//         // Mock default behavior for exec
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
//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: {
//                     uploadvia: 'npm',
//                     name: 'lodash',
//                     version: '4.17.21',
//                     score: '8.5'
//                 }
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = {
//             pathParameters: { id: "lodash@4.17.21" }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//         expect(body.NetScoreLatency).toBeDefined();
//     });

//     test('should handle GitHub package successfully', async () => {
//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: {
//                     uploadvia: 'github',
//                     url: 'https://github.com/cloudinary/cloudinary_npm',
//                     score: '8.5'
//                 }
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = {
//             pathParameters: { id: "cloudinary-npm-2.5.1" }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//         expect(body.NetScoreLatency).toBeDefined();
//     }, 60000);  // Increased timeout to 60 seconds

//     test('should handle zip file content package successfully', async () => {
//         const zip = new AdmZip();
//         zip.addFile("package.json", Buffer.from(JSON.stringify({
//             name: "cloudinary",
//             version: "2.5.1",
//             homepage: "https://github.com/cloudinary/cloudinary_npm",
//             repository: { type: "git", url: "git+https://github.com/cloudinary/cloudinary_npm.git" }
//         })));
//         const zipBuffer = zip.toBuffer();
//         const mockStream = new Readable();
//         mockStream.push(zipBuffer);
//         mockStream.push(null);

//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: { uploadvia: 'content', score: '-1' },
//                 Body: mockStream
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = {
//             pathParameters: { id: "cloudinary_npm--2.5.1" }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//     });

//     test('should handle invalid URL in zip content', async () => {
//         const zip = new AdmZip();
//         zip.addFile("package.json", Buffer.from(JSON.stringify({
//             name: "test-package",
//             repository: { url: "https://invalid-url.com/repo" }
//         })));
//         const zipBuffer = zip.toBuffer();
//         const mockStream = new Readable();
//         mockStream.push(zipBuffer);
//         mockStream.push(null);

//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: { uploadvia: 'content', score: '8.5' },
//                 Body: mockStream
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = { pathParameters: { id: "test-package.zip" } };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//     });

//     test('should return 404 for non-existent package', async () => {
//         mockS3Send.mockRejectedValueOnce({ name: 'NotFound', $metadata: { httpStatusCode: 404 } });

//         const event = { pathParameters: { id: "non-existent-package@1.0.0" } };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(404);
//         expect(body.error).toContain('not found');
//     });

//     test('should handle missing package ID', async () => {
//         const event = { pathParameters: {} };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(400);
//         expect(body.error).toBe('Package ID is required');
//     });
// });




// // ratePackageHandler.test.mjs
// import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// import { ratePackageHandler } from ""../../lambda/ratePackage/index.mjs";
// import { createResponse } from "../utils/createResponse.mjs";
// import { gunzipSync } from "zlib";
// import fs from "fs/promises";
// import { exec } from "child_process";
// import { promisify } from "util";

// // Mocking
// jest.mock("@aws-sdk/client-s3");
// jest.mock("zlib", () => ({
//   ...jest.requireActual("zlib"),
//   gunzipSync: jest.fn()
// }));
// jest.mock("fs/promises");
// jest.mock("child_process");
// jest.mock("util", () => ({
//   ...jest.requireActual("util"),
//   promisify: jest.fn()
// }));

// describe("ratePackageHandler", () => {
//   const BUCKET_NAME = "acmeregistrys3";
//   let mockS3Client, mockExecAsync;

//   beforeEach(() => {
//     mockS3Client = jest.fn();
//     S3Client.mockImplementation(() => ({
//       send: mockS3Client
//     }));

//     mockExecAsync = jest.fn();
//     promisify.mockReturnValue(mockExecAsync);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it("should return 400 if package ID is missing", async () => {
//     const event = { pathParameters: {} };
//     const response = await ratePackageHandler(event);

//     expect(response).toEqual(createResponse(400, { error: "Package ID is required" }));
//   });

//   it("should return 404 if the package does not exist", async () => {
//     const event = { pathParameters: { id: "lodash@4.17.21" } };
//     mockS3Client.mockRejectedValueOnce({ name: "NotFound" });

//     const response = await ratePackageHandler(event);

//     expect(mockS3Client).toHaveBeenCalledWith(
//       expect.objectContaining({ Bucket: BUCKET_NAME, Key: "lodash@4.17.21" })
//     );
//     expect(response).toEqual(
//       createResponse(404, { error: "Package lodash@4.17.21 not found", packageId: "lodash@4.17.21" })
//     );
//   });

//   it("should return the correct metadata and parsed results for an existing package", async () => {
//     const event = { pathParameters: { id: "lodash@4.17.21" } };
//     const s3Response = {
//       Metadata: { uploadvia: "content", score: "0.5" },
//       Body: Buffer.from("mock gzip content")
//     };
//     const parsedPackageJson = {
//       repository: { url: "https://github.com/lodash/lodash" }
//     };

//     // Mock AWS SDK calls
//     mockS3Client
//       .mockResolvedValueOnce() // HeadObjectCommand
//       .mockResolvedValueOnce(s3Response); // GetObjectCommand

//     // Mock zlib and exec
//     gunzipSync.mockReturnValueOnce(JSON.stringify(parsedPackageJson));
//     mockExecAsync.mockResolvedValueOnce({ stdout: "NetScore: 0.85\n", stderr: "" });

//     // Mock filesystem operations
//     fs.mkdir.mockResolvedValueOnce();
//     fs.writeFile.mockResolvedValueOnce();
//     fs.unlink.mockResolvedValueOnce();

//     const response = await ratePackageHandler(event);

//     expect(response).toEqual(
//       createResponse(200, {
//         BusFactor: 0,
//         BusFactorLatency: 0,
//         Correctness: 0,
//         CorrectnessLatency: 0,
//         RampUp: 0,
//         RampUpLatency: 0,
//         ResponsiveMaintainer: 0,
//         ResponsiveMaintainerLatency: 0,
//         LicenseScore: 0,
//         LicenseScoreLatency: 0,
//         GoodPinningPractice: 0,
//         GoodPinningPracticeLatency: 0,
//         PullRequest: 0,
//         PullRequestLatency: 0,
//         NetScore: 0.85,
//         NetScoreLatency: 0
//       })
//     );
//   });

//   it("should return 500 if an unexpected error occurs", async () => {
//     const event = { pathParameters: { id: "lodash@4.17.21" } };
//     mockS3Client.mockRejectedValueOnce(new Error("Unexpected error"));

//     const response = await ratePackageHandler(event);

//     expect(response).toEqual(
//       createResponse(500, { error: "Internal server error: Unexpected error", requestId: undefined })
//     );
//   });
// });


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

//         // Mock default behavior for file system operations
//         mockMkdir.mockResolvedValue(undefined);
//         mockUnlink.mockResolvedValue(undefined);
//         mockWriteFile.mockResolvedValue(undefined);

//         // Mock default behavior for exec
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
//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: {
//                     uploadvia: 'npm',
//                     name: 'lodash',
//                     version: '4.17.21',
//                     score: '8.5'
//                 }
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = {
//             pathParameters: { id: "lodash@4.17.21" }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//         expect(body.NetScoreLatency).toBeDefined();
//     });

//     test('should handle GitHub package successfully', async () => {
//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: {
//                     uploadvia: 'github',
//                     url: 'https://github.com/cloudinary/cloudinary_npm',
//                     score: '8.5'
//                 }
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = {
//             pathParameters: { id: "cloudinary-npm-2.5.1" }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//         expect(body.NetScoreLatency).toBeDefined();
//     });

//     test('should handle zip file content package successfully', async () => {
//         const zip = new AdmZip();
//         zip.addFile("package.json", Buffer.from(JSON.stringify({
//             name: "cloudinary",
//             version: "2.5.1",
//             homepage: "https://github.com/cloudinary/cloudinary_npm",
//             repository: { type: "git", url: "git+https://github.com/cloudinary/cloudinary_npm.git" }
//         })));
//         const zipBuffer = zip.toBuffer();
//         const mockStream = new Readable();
//         mockStream.push(zipBuffer);
//         mockStream.push(null);

//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: { uploadvia: 'content', score: '-1' },
//                 Body: mockStream
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = {
//             pathParameters: { id: "cloudinary_npm--2.5.1" }
//         };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//     });

//     test('should handle invalid URL in zip content', async () => {
//         const zip = new AdmZip();
//         zip.addFile("package.json", Buffer.from(JSON.stringify({
//             name: "test-package",
//             repository: { url: "https://invalid-url.com/repo" }
//         })));
//         const zipBuffer = zip.toBuffer();
//         const mockStream = new Readable();
//         mockStream.push(zipBuffer);
//         mockStream.push(null);

//         mockS3Send
//             .mockResolvedValueOnce({})  // HEAD
//             .mockResolvedValueOnce({    // GET
//                 Metadata: { uploadvia: 'content', score: '8.5' },
//                 Body: mockStream
//             })
//             .mockResolvedValueOnce({}); // PUT

//         const event = { pathParameters: { id: "test-package.zip" } };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(200);
//         expect(body.NetScore).toBeDefined();
//     });

//     test('should return 404 for non-existent package', async () => {
//         mockS3Send.mockRejectedValueOnce({ name: 'NotFound', $metadata: { httpStatusCode: 404 } });

//         const event = { pathParameters: { id: "non-existent-package@1.0.0" } };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(404);
//         expect(body.error).toContain('not found');
//     });

//     test('should handle missing package ID', async () => {
//         const event = { pathParameters: {} };

//         const response = await ratePackageHandler(event);
//         const body = JSON.parse(response.body);

//         expect(response.statusCode).toBe(400);
//         expect(body.error).toBe('Package ID is required');
//     });
// });
