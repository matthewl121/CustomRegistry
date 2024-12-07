import { getPackageByRegexHandler } from '../../lambda/getPackageByRegex/index.mjs';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

describe('getPackageByRegexHandler', () => {
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    s3Mock.reset();
  });

  const validateHeaders = (headers) => {
    expect(headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    });
  };

  test('successfully retrieves matching packages', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [
        { Key: 'underscore--1.2.3' },
        { Key: 'lodash--2.1.0' },
        { Key: 'react--1.2.0' }
      ]
    });

    const event = {
      RegEx: ".*"
    };

    const result = await getPackageByRegexHandler(event);

    expect(result.statusCode).toBe(200);
    validateHeaders(result.headers);

    const body = JSON.parse(result.body);
    expect(body).toEqual([
      {
        Version: "1.2.3",
        Name: "underscore",
        ID: "underscore--1.2.3"
      },
      {
        Version: "2.1.0",
        Name: "lodash",
        ID: "lodash--2.1.0"
      },
      {
        Version: "1.2.0",
        Name: "react",
        ID: "react--1.2.0"
      }
    ]);
  });

  test('handles malformed keys in S3', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [
        { Key: 'validpackage--1.0.0' },
        { Key: 'malformed-key' },
        { Key: 'multiple--parts--present' }
      ]
    });

    const event = {
      RegEx: ".*"
    };

    const result = await getPackageByRegexHandler(event);
    expect(result.statusCode).toBe(200);
    validateHeaders(result.headers);

    const body = JSON.parse(result.body);
    expect(body).toContainEqual({
      Version: "1.0.0",
      Name: "validpackage",
      ID: "validpackage--1.0.0"
    });

    const malformedEntries = body.filter(entry => 
      entry.Version === "Unknown" && entry.Name === "Unknown"
    );
    expect(malformedEntries).toHaveLength(2);
    expect(malformedEntries[0]).toHaveProperty('Note', 'Unexpected key format');
  });

  test('returns 400 when regex pattern is missing', async () => {
    const event = {};

    const result = await getPackageByRegexHandler(event);

    expect(result.statusCode).toBe(400);
    validateHeaders(result.headers);
    
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
    });
  });

  test('returns 404 when no packages match the regex', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [
        { Key: 'package1--1.0.0' },
        { Key: 'package2--2.0.0' }
      ]
    });

    const event = {
      RegEx: "^nonexistent$"
    };

    const result = await getPackageByRegexHandler(event);

    expect(result.statusCode).toBe(404);
    validateHeaders(result.headers);
    
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: "No package found under this regex."
    });
  });

  test('returns 400 when S3 operation fails', async () => {
    s3Mock.on(ListObjectsV2Command).rejects(new Error('S3 Error'));

    const event = {
      RegEx: "valid"
    };

    const result = await getPackageByRegexHandler(event);

    expect(result.statusCode).toBe(400);
    validateHeaders(result.headers);
    
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
    });
  });
});
// import { jest } from '@jest/globals';
// import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
// import { getPackageByRegexHandler } from '../../lambda/getPackageByRegex/index.mjs'; // Update with actual file name

// // Mock console.error to prevent error output in tests
// const originalConsoleError = console.error;
// beforeAll(() => {
//   console.error = jest.fn();
// });

// afterAll(() => {
//   console.error = originalConsoleError;
// });

// // Mock the AWS SDK
// jest.mock("@aws-sdk/client-s3", () => ({
//   S3Client: jest.fn(() => ({
//     send: jest.fn()
//   })),
//   ListObjectsV2Command: jest.fn()
// }));

// describe('getPackageByRegexHandler', () => {
//   let mockS3Send;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockS3Send = jest.fn();
//     S3Client.prototype.send = mockS3Send;
//     console.error.mockClear();
//   });

//   test('successfully matches packages with regex pattern', async () => {
//     const mockKeys = [
//       { Key: 'test-package--1.0.0' },
//       { Key: 'test-lib--2.0.0' },
//       { Key: 'other-package--1.1.0' }
//     ];

//     mockS3Send.mockResolvedValueOnce({
//       Contents: mockKeys,
//       IsTruncated: false
//     });

//     const event = {
//       RegEx: 'test-.*'
//     };

//     const result = await getPackageByRegexHandler(event);

//     expect(result.statusCode).toBe(200);
//     expect(result.headers['Content-Type']).toBe('application/json');

//     const parsedBody = JSON.parse(result.body);
//     expect(parsedBody).toHaveLength(2);
//     expect(parsedBody).toEqual(expect.arrayContaining([
//       { Name: 'test-package', Version: '1.0.0', ID: 'test-package--1.0.0' },
//       { Name: 'test-lib', Version: '2.0.0', ID: 'test-lib--2.0.0' }
//     ]));
//     expect(console.error).not.toHaveBeenCalled();
//   });

//   test('handles paginated results from S3', async () => {
//     const firstPage = {
//       Contents: [{ Key: 'test-package1--1.0.0' }],
//       IsTruncated: true,
//       NextContinuationToken: 'token123'
//     };

//     const secondPage = {
//       Contents: [{ Key: 'test-package2--2.0.0' }],
//       IsTruncated: false
//     };

//     mockS3Send
//       .mockResolvedValueOnce(firstPage)
//       .mockResolvedValueOnce(secondPage);

//     const event = {
//       RegEx: 'test-.*'
//     };

//     const result = await getPackageByRegexHandler(event);
    
//     expect(result.statusCode).toBe(200);
//     const parsedBody = JSON.parse(result.body);
//     expect(parsedBody).toHaveLength(2);
//     expect(parsedBody).toEqual(expect.arrayContaining([
//       { Name: 'test-package1', Version: '1.0.0', ID: 'test-package1--1.0.0' },
//       { Name: 'test-package2', Version: '2.0.0', ID: 'test-package2--2.0.0' }
//     ]));
//   });

//   test('returns 400 when regex pattern is missing', async () => {
//     const event = {};

//     const result = await getPackageByRegexHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body)).toEqual({
//       message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
//     });
//     expect(console.error).toHaveBeenCalled();
//   });

//   test('returns 400 for invalid regex pattern', async () => {
//     const event = {
//       RegEx: '['  // Invalid regex pattern
//     };

//     const result = await getPackageByRegexHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body)).toEqual({
//       message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
//     });
//     expect(console.error).toHaveBeenCalled();
//   });

//   test('returns 400 for regex with excessive quantifiers', async () => {
//     const event = {
//       RegEx: 'test{1,2000}'  // Quantifier exceeds limit
//     };

//     const result = await getPackageByRegexHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body)).toEqual({
//       message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
//     });
//     expect(console.error).toHaveBeenCalled();
//   });

//   test('returns 404 when no packages match regex', async () => {
//     mockS3Send.mockResolvedValueOnce({
//       Contents: [
//         { Key: 'package1--1.0.0' },
//         { Key: 'package2--2.0.0' }
//       ],
//       IsTruncated: false
//     });

//     const event = {
//       RegEx: 'nonexistent-.*'
//     };

//     const result = await getPackageByRegexHandler(event);

//     expect(result.statusCode).toBe(404);
//     expect(JSON.parse(result.body)).toEqual({
//       message: "No package found under this regex."
//     });
//     expect(console.error).toHaveBeenCalled();
//   });

//   test('handles malformed package keys gracefully', async () => {
//     mockS3Send.mockResolvedValueOnce({
//       Contents: [
//         { Key: 'test-package--1.0.0' },
//         { Key: 'malformed-key' },  // Missing version separator
//         { Key: 'test-package2--2.0.0' }
//       ],
//       IsTruncated: false
//     });

//     const event = {
//       RegEx: 'test-.*'
//     };

//     const result = await getPackageByRegexHandler(event);
    
//     expect(result.statusCode).toBe(200);
//     const parsedBody = JSON.parse(result.body);
//     expect(parsedBody).toEqual(expect.arrayContaining([
//       { Name: 'test-package', Version: '1.0.0', ID: 'test-package--1.0.0' },
//       { Name: 'test-package2', Version: '2.0.0', ID: 'test-package2--2.0.0' }
//     ]));
//     expect(parsedBody).not.toContainEqual(
//       expect.objectContaining({ ID: 'malformed-key' })
//     );
//   });

//   test('handles S3 errors gracefully', async () => {
//     mockS3Send.mockRejectedValueOnce(new Error('S3 Error'));

//     const event = {
//       RegEx: 'test-.*'
//     };

//     const result = await getPackageByRegexHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body)).toEqual({
//       message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
//     });
//     expect(console.error).toHaveBeenCalled();
//   });
// });

// // import { getPackageByRegexHandler } from '../../lambda/getPackageByRegex/index.mjs';
// // import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
// // import { mockClient } from 'aws-sdk-client-mock';


// // describe('getPackageByRegexHandler', () => {
// //   const s3Mock = mockClient(S3Client);

// //   beforeEach(() => {
// //     s3Mock.reset();
// //   });

// //   test('successfully retrieves matching packages', async () => {
// //     // Arrange: Mock S3Client response
// //     s3Mock.on(ListObjectsV2Command).resolves({
// //       Contents: [
// //         { Key: 'ValidPackage--1.0.0' },
// //         { Key: 'ValidPackagePoop--2.1.3' },
// //       ],
// //       IsTruncated: false,
// //     });

// //     const event = {
// //         RegEx: "Valid"
// //     };

// //     // Act: Call the handler
// //     const result = await getPackageByRegexHandler(event);

// //     // Assert: Check response
// //     expect(result.statusCode).toBe(200);
// //     const body = JSON.parse(result.body);
// //     expect(body).toEqual([
// //       {
// //         Version: '1.0.0',
// //         Name: 'ValidPackage',
// //         ID: 'ValidPackage--1.0.0',
// //       },
// //       {
// //         Version: '2.1.3',
// //         Name: 'ValidPackagePoop',
// //         ID: 'ValidPackagePoop--2.1.3',
// //       },
// //     ]);
// //   });

// //   test('returns 404 when no packages match the regex', async () => {
// //     // Arrange: Mock S3Client response with no matching keys
// //     s3Mock.on(ListObjectsV2Command).resolves({
// //       Contents: [
// //         { Key: 'NonMatchingPackage--0.0.1' },
// //       ],
// //       IsTruncated: false,
// //     });

// //     const event = {
// //         RegEx: 'Valid',
// //     };

// //     // Act: Call the handler
// //     const result = await getPackageByRegexHandler(event);

// //     // Assert: Check response
// //     expect(result.statusCode).toBe(404);
// //   });

// //   test('returns 400 when RegEx is missing', async () => {
// //     // Arrange: Event without regex parameter
// //     const event = { };

// //     // Act: Call the handler
// //     const result = await getPackageByRegexHandler(event);

// //     // Assert: Check response
// //     expect(result.statusCode).toBe(400);
// //   });

// //   test('returns 400 when RegEx is invalid', async () => {
// //     // Arrange: Event with invalid regex pattern
// //     const event = {
// //         RegEx: 'invalid-regex(',
// //     };

// //     // Act: Call the handler
// //     const result = await getPackageByRegexHandler(event);

// //     // Assert: Check response
// //     expect(result.statusCode).toBe(400);
// //   });

// //   test('handles S3 listing errors gracefully', async () => {
// //     // Arrange: Mock S3Client to throw an error
// //     const mockError = new Error('S3 access denied');
// //     s3Mock.on(ListObjectsV2Command).rejects(mockError);

// //     const event = {
// //         RegEx: '^ValidPackage--\\d+\\.\\d+\\.\\d+$',
// //     };

// //     // Act: Call the handler
// //     const result = await getPackageByRegexHandler(event);

// //     // Assert: Check response
// //     expect(result.statusCode).toBe(400);
// //   });
// // });
