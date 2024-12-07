import { jest } from '@jest/globals';
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { updatePackageHandler } from '../../lambda/update/index.mjs';

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn()
}));

describe('updatePackageHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  test('/package/{id} | POST | Update with new patch version', async () => {
    // Mock the old package metadata
    mockS3Send
      .mockResolvedValueOnce({
        Metadata: {
          name: 'test-package',
          version: '1.0.0',
          uploadvia: 'content'
        }
      }); // HEAD request

    // Mock the new package content
    const newPackageVersion = '1.0.1';
    const newPackageContent = Buffer.from('new package content');

    // Mock the update process
    mockS3Send
      .mockResolvedValueOnce({}); // PutObjectCommand

    const event = {
      metadata: {
        Name: 'test-package',
        Version: newPackageVersion,
        ID: 'test-package--1.0.0'
      },
      data: {
        Content: newPackageContent.toString('base64')
      }
    };

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ message: 'Version is updated.' });
  });

  test('/package/{id} | POST | Update with invalid patch version', async () => {
    // Mock the old package metadata
    mockS3Send
      .mockResolvedValueOnce({
        Metadata: {
          name: 'test-package',
          version: '1.0.0',
          uploadvia: 'content'
        }
      }); // HEAD request

    // Mock the new package content
    const newPackageVersion = '1.0.0';
    const newPackageContent = Buffer.from('new package content');

    const event = {
      metadata: {
        Name: 'test-package',
        Version: newPackageVersion,
        ID: 'test-package--1.0.0'
      },
      data: {
        Content: newPackageContent.toString('base64')
      }
    };

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
  });

  test('/package/{id} | POST | Update with non-existent package', async () => {
    mockS3Send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } }); // HeadObjectCommand

    const event = {
      metadata: {
        Name: 'non-existent-package',
        Version: '1.0.0',
        ID: 'non-existent-package--1.0.0'
      },
      data: {
        Content: Buffer.from('new package content').toString('base64')
      }
    };

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: 'Package does not exist.' });
  });
});
// import { jest } from '@jest/globals';
// import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
// import { updatePackageHandler } from '../../lambda/update/index.mjs';

// jest.mock("@aws-sdk/client-s3", () => ({
//   S3Client: jest.fn(() => ({
//     send: jest.fn()
//   })),
//   PutObjectCommand: jest.fn(),
//   HeadObjectCommand: jest.fn(),
//   ListObjectsV2Command: jest.fn(),
//   DeleteObjectsCommand: jest.fn()
// }));

// describe('updatePackageHandler', () => {
//   let mockS3Send;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockS3Send = jest.fn();
//     S3Client.prototype.send = mockS3Send;
//   });

//   test('/package/{id} | POST | Update with new patch version', async () => {
//     // Mock the old package metadata
//     mockS3Send
//       .mockResolvedValueOnce({
//         Metadata: {
//           name: 'test-package',
//           version: '1.0.0',
//           uploadvia: 'content'
//         }
//       }); // HEAD request

//     // Mock the new package content
//     const newPackageVersion = '1.0.1';
//     const newPackageContent = Buffer.from('new package content');

//     // Mock the update process
//     mockS3Send
//       .mockResolvedValueOnce({}); // PutObjectCommand

//     const event = {
//       metadata: {
//         Name: 'test-package',
//         Version: newPackageVersion,
//         ID: 'test-package--1.0.0'
//       },
//       data: {
//         Content: newPackageContent.toString('base64'),
//         debloat: 'true'
//       }
//     };

//     const result = await updatePackageHandler(event);

//     expect(result.statusCode).toBe(200);
//     expect(mockS3Send).toHaveBeenCalledTimes(2);
//     expect(mockS3Send).toHaveBeenCalledWith(
//       expect.objectContaining({
//         input: expect.objectContaining({
//           Bucket: 'acmeregistrys3',
//           Key: 'test-package--1.0.1',
//           Body: newPackageContent,
//           ContentType: 'application/zip',
//           Metadata: expect.objectContaining({
//             name: 'test-package',
//             id: 'test-package--1.0.1',
//             version: '1.0.1',
//             uploadvia: 'content'
//           })
//         })
//       })
//     );
//   });

//   test('/package/{id} | POST | Update with invalid patch version', async () => {
//     // Mock the old package metadata
//     mockS3Send
//       .mockResolvedValueOnce({
//         Metadata: {
//           name: 'test-package',
//           version: '1.0.0',
//           uploadvia: 'content'
//         }
//       }); // HEAD request

//     // Mock the new package content
//     const newPackageVersion = '1.0.0';
//     const newPackageContent = Buffer.from('new package content');

//     const event = {
//       metadata: {
//         Name: 'test-package',
//         Version: newPackageVersion,
//         ID: 'test-package--1.0.0'
//       },
//       data: {
//         Content: newPackageContent.toString('base64'),
//         debloat: 'true'
//       }
//     };

//     const result = await updatePackageHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body).message).toBe("There is missing field(s) in the PackageID or it is formed improperly, or is invalid.");
//   });

//   test('/package/{id} | POST | Update with existing package', async () => {
//     // Mock the old package metadata
//     mockS3Send
//       .mockResolvedValueOnce({
//         Metadata: {
//           name: 'test-package',
//           version: '1.0.0',
//           uploadvia: 'content'
//         }
//       }); // HEAD request

//     // Mock the new package content
//     const newPackageVersion = '1.0.1';
//     const newPackageContent = Buffer.from('new package content');

//     // Mock the update process
//     mockS3Send
//       .mockResolvedValueOnce({}); // PutObjectCommand

//     const event = {
//       metadata: {
//         Name: 'test-package',
//         Version: newPackageVersion,
//         ID: 'test-package--1.0.0'
//       },
//       data: {
//         Content: newPackageContent.toString('base64'),
//         debloat: 'false'
//       }
//     };

//     const result = await updatePackageHandler(event);

//     expect(result.statusCode).toBe(200);
//     expect(mockS3Send).toHaveBeenCalledTimes(2);
//     expect(mockS3Send).toHaveBeenCalledWith(
//       expect.objectContaining({
//         input: expect.objectContaining({
//           Bucket: 'acmeregistrys3',
//           Key: 'test-package--1.0.1',
//           Body: newPackageContent,
//           ContentType: 'application/zip',
//           Metadata: expect.objectContaining({
//             name: 'test-package',
//             id: 'test-package--1.0.1',
//             version: '1.0.1',
//             uploadvia: 'content'
//           })
//         })
//       })
//     );
//   });

//   test('/package/{id} | POST | Update with non-existent package', async () => {
//     mockS3Send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } }); // HeadObjectCommand

//     const event = {
//       metadata: {
//         Name: 'non-existent-package',
//         Version: '1.0.0',
//         ID: 'non-existent-package--1.0.0'
//       },
//       data: {
//         Content: Buffer.from('new package content').toString('base64'),
//         debloat: 'true'
//       }
//     };

//     const result = await updatePackageHandler(event);

//     expect(result.statusCode).toBe(404);
//     expect(JSON.parse(result.body).message).toBe("Package does not exist.");
//   });

//   test('/package/{id} | POST | Update with invalid upload method', async () => {
//     // Mock the old package metadata
//     mockS3Send
//       .mockResolvedValueOnce({
//         Metadata: {
//           name: 'test-package',
//           version: '1.0.0',
//           uploadvia: 'npm'
//         }
//       }); // HEAD request

//     const event = {
//       metadata: {
//         Name: 'test-package',
//         Version: '1.0.1',
//         ID: 'test-package--1.0.0'
//       },
//       data: {
//         Content: Buffer.from('new package content').toString('base64'),
//         debloat: 'true'
//       }
//     };

//     const result = await updatePackageHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body).message).toBe("There is missing field(s) in the PackageID or it is formed improperly, or is invalid.");
//   });

//   test('/package/{id} | POST | Update with missing fields', async () => {
//     const event = {
//       metadata: {
//         Name: 'test-package',
//         Version: '1.0.1'
//       },
//       data: {
//         debloat: 'true'
//       }
//     };

//     const result = await updatePackageHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body).message).toBe("There is missing field(s) in the PackageID or it is formed improperly, or is invalid.");
//   });
// });