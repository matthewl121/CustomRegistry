import { jest } from '@jest/globals';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { uploadPackageHandler } from '../../lambda/upload/index.mjs';
import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';

// Mock S3 Client and Commands
const mockS3Send = jest.fn();
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: mockS3Send
  })),
  PutObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectCommand: jest.fn()
}));

// Mock the ratePackageHandler
jest.mock('../../lambda/ratePackage/index.mjs', () => ({
  ratePackageHandler: jest.fn()
}));

describe('uploadPackageHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock defaults
    ratePackageHandler.mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ NetScore: 0.8 })
    });
  });

  test('successfully uploads a package using Content', async () => {
    const testContent = 'Sample file content';
    const mockEvent = {
      Content: Buffer.from(testContent).toString('base64'),
      Name: 'test-package'
    };

    // Mock S3 responses
    mockS3Send
      .mockResolvedValueOnce({ Contents: [] }) // listAllKeys response
      .mockResolvedValueOnce({}); // putObject response

    const result = await uploadPackageHandler(mockEvent);

    // Verify S3 put operation
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'acmeregistrys3',
      Key: 'test-package--1.0.0',
      Body: expect.any(Buffer),
      ContentType: 'application/zip',
      Metadata: {
        name: 'test-package',
        id: 'test-package--1.0.0',
        version: '1.0.0',
        uploadvia: 'content'
      }
    });

    // Verify response
    expect(result).toEqual({
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: expect.any(String)
    });

    const responseBody = JSON.parse(result.body);
    expect(responseBody).toEqual({
      metadata: {
        Name: 'test-package',
        ID: 'test-package--1.0.0',
        Version: '1.0.0'
      },
      data: {
        Content: expect.any(String)
      }
    });
  });

  test('returns an error if package fails rating check', async () => {
    const mockEvent = {
      Content: Buffer.from('Sample content').toString('base64'),
      Name: 'test-package'
    };

    // Mock S3 responses
    mockS3Send
      .mockResolvedValueOnce({ Contents: [] }) // listAllKeys response
      .mockResolvedValueOnce({}) // putObject response
      .mockResolvedValueOnce({}); // deleteObject response

    // Mock low rating score
    ratePackageHandler.mockResolvedValueOnce({
      statusCode: 200,
      body: JSON.stringify({ NetScore: 0.2 })
    });

    const result = await uploadPackageHandler(mockEvent);

    expect(result).toEqual({
      statusCode: 424,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Package is not uploaded due to the disqualified rating."
      })
    });
  });

  test('returns an error if package already exists', async () => {
    const mockEvent = {
      Content: Buffer.from('Sample content').toString('base64'),
      Name: 'test-package'
    };

    // Mock existing package
    mockS3Send.mockResolvedValueOnce({
      Contents: [{ Key: 'test-package--1.0.0' }]
    });

    const result = await uploadPackageHandler(mockEvent);

    expect(result).toEqual({
      statusCode: 409,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Package exists already."
      })
    });
  });

  test('returns an error for invalid input', async () => {
    const mockEvent = {};

    const result = await uploadPackageHandler(mockEvent);

    expect(result).toEqual({
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        message: "There is missing field(s) in the PackageData or it is formed improperly (e.g. Content and URL ar both set)"
      })
    });
  });

  test('returns an error if S3 upload fails', async () => {
    const mockEvent = {
      Content: Buffer.from('Sample content').toString('base64'),
      Name: 'test-package'
    };

    // Mock responses
    mockS3Send
      .mockResolvedValueOnce({ Contents: [] }) // listAllKeys response
      .mockRejectedValueOnce(new Error('S3 upload failed')); // putObject failure

    const result = await uploadPackageHandler(mockEvent);

    expect(result).toEqual({
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify('/package: Error uploading package: S3 upload failed')
    });
  });
});
// import { jest } from '@jest/globals';
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { uploadPackageHandler } from '../../lambda/upload/index.mjs';
// import { Readable } from 'stream';

// // Mock the AWS SDK
// jest.mock("@aws-sdk/client-s3", () => ({
//   S3Client: jest.fn(() => ({
//     send: jest.fn()
//   })),
//   PutObjectCommand: jest.fn()
// }));

// describe('uploadPackageHandler', () => {
//   let mockS3Send;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockS3Send = jest.fn();
//     S3Client.prototype.send = mockS3Send;
//   });

//   const createMockStream = (data) => Readable.from([Buffer.from(data)]);

//   test('successfully uploads a package to S3', async () => {
//     const mockEvent = {
//       body: JSON.stringify({
//         packageName: 'test-package',
//         version: '1.0.0',
//         fileContent: 'Sample file content'
//       })
//     };

//     const mockContext = {};

//     mockS3Send.mockResolvedValueOnce({
//       ETag: '"mock-etag-value"'
//     });

//     const result = await uploadPackageHandler(mockEvent, mockContext);

//     expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
//     expect(PutObjectCommand).toHaveBeenCalledWith({
//       Bucket: 'acmeregistrys3', 
//       Key: 'test-package/1.0.0',
//       Body: expect.any(Readable),
//       ContentType: 'application/octet-stream'
//     });

//     expect(result).toEqual({
//       statusCode: 200,
//       body: JSON.stringify({
//         message: 'Package uploaded successfully',
//         ETag: '"mock-etag-value"'
//       })
//     });
//   });

//   test('returns an error if S3 upload fails', async () => {
//     const mockEvent = {
//       body: JSON.stringify({
//         packageName: 'test-package',
//         version: '1.0.0',
//         fileContent: 'Sample file content'
//       })
//     };

//     const mockContext = {};

//     mockS3Send.mockRejectedValueOnce(new Error('S3 upload failed'));

//     const result = await uploadPackageHandler(mockEvent, mockContext);

//     expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));

//     expect(result).toEqual({
//       statusCode: 500,
//       body: JSON.stringify({
//         error: 'Failed to upload package'
//       })
//     });
//   });

//   test('returns an error for invalid input', async () => {
//     const mockEvent = {
//       body: JSON.stringify({})
//     };

//     const mockContext = {};

//     const result = await uploadPackageHandler(mockEvent, mockContext);

//     expect(mockS3Send).not.toHaveBeenCalled();

//     expect(statusCode).toEqual(400);
//   });
// });
