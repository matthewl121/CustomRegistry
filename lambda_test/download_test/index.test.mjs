import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { downloadPackageHandler } from '../../lambda/download/index.mjs'; // Update with actual file name
import { mockClient } from "aws-sdk-client-mock";
import { Readable } from 'stream';

// Mock S3 client
const s3Mock = mockClient(S3Client);

describe('downloadPackageHandler', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    s3Mock.reset();
  });

  // Test helper function capitalizeFirstLetter
  test('capitalizeFirstLetter handles special case for ID', async () => {
    const metadata = { id: 'some-id' };
    const response = await downloadPackageHandler('test-package');
    const parsedBody = JSON.parse(response.body);
    expect(parsedBody.metadata).toHaveProperty('ID');
  });

  test('returns 400 when packageId is missing', async () => {
    const response = await downloadPackageHandler(null);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."
    });
  });

  test('returns 404 when package does not exist', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('Not Found'));
    
    const response = await downloadPackageHandler('non-existent-package');
    
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      message: "Package does not exist."
    });
  });

  test('successfully downloads package and returns formatted metadata', async () => {
    // Mock metadata
    const mockMetadata = {
      author: 'John Doe',
      version: '1.0.0',
      uploadvia: 'web', // Should be filtered out
      id: 'test-id'
    };

    // Mock file content
    const mockFileContent = 'test file content';
    const mockStream = Readable.from([Buffer.from(mockFileContent)]);

    // Setup S3 mock responses
    s3Mock.on(HeadObjectCommand).resolves({
      Metadata: mockMetadata
    });

    s3Mock.on(GetObjectCommand).resolves({
      Body: mockStream
    });

    const response = await downloadPackageHandler('test-package');
    const parsedBody = JSON.parse(response.body);

    // Verify response
    expect(response.statusCode).toBe(200);
    expect(parsedBody.metadata).toEqual({
      Author: 'John Doe',
      Version: '1.0.0',
      ID: 'test-id'
      // uploadvia should be filtered out
    });
    expect(parsedBody.data.Content).toBe(Buffer.from(mockFileContent).toString('base64'));
  });

  test('handles error during file download', async () => {
    // Mock successful head object check
    s3Mock.on(HeadObjectCommand).resolves({
      Metadata: { author: 'John Doe' }
    });

    // Mock failed get object
    s3Mock.on(GetObjectCommand).rejects(new Error('Download failed'));

    const response = await downloadPackageHandler('test-package');

    expect(response.statusCode).toBe(400); // As specified in the original code
    expect(JSON.parse(response.body)).toEqual({
      message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."
    });
  });

  test('formats metadata correctly', async () => {
    const mockMetadata = {
      author: 'john doe',
      VERSION: 'v1.0.0',
      ID: 'test-id',
      Description: 'TEST DESCRIPTION'
    };

    s3Mock.on(HeadObjectCommand).resolves({
      Metadata: mockMetadata
    });

    s3Mock.on(GetObjectCommand).resolves({
      Body: Readable.from([Buffer.from('test content')])
    });

    const response = await downloadPackageHandler('test-package');
    const parsedBody = JSON.parse(response.body);

    expect(parsedBody.metadata).toEqual({
      Author: 'john doe',
      Version: 'v1.0.0',
      ID: 'test-id',
      Description: 'TEST DESCRIPTION'
    });
  });
});
// import { jest } from '@jest/globals';
// import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// import { downloadPackageHandler } from '../../lambda/download/index.mjs';
// import { Readable } from 'stream';

// // Mock the AWS SDK
// jest.mock("@aws-sdk/client-s3", () => ({
//   S3Client: jest.fn(() => ({
//     send: jest.fn()
//   })),
//   GetObjectCommand: jest.fn(),
//   HeadObjectCommand: jest.fn()
// }));

// describe('downloadPackageHandler', () => {
//   let mockS3Send;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockS3Send = jest.fn();
//     S3Client.prototype.send = mockS3Send;
//   });

//   const createMockStream = (data) => Readable.from([Buffer.from(data)]);

//   const generateMetadata = (overrides = {}) => {
//     const defaults = {
//       author: 'default-author',
//       version: '1.0.0',
//       description: 'default-description'
//     };
//     return { ...defaults, ...overrides };
//   };

//   const verifyHeaders = (headers) => {
//     const expectedHeaders = {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type'
//     };
//     expect(headers).toMatchObject(expectedHeaders);
//   };

//   test('successfully downloads and processes a package', async () => {
//     const mockMetadata = generateMetadata({
//       author: 'test-author',
//       version: '2.0.0'
//     });

//     const mockFileContent = 'test-content'.repeat(10);
    
//     mockS3Send
//       .mockResolvedValueOnce({ Metadata: mockMetadata })
//       .mockResolvedValueOnce({ Body: createMockStream(mockFileContent) });

//     const result = await downloadPackageHandler('test-package-id');

//     expect(result.statusCode).toBe(200);
//     verifyHeaders(result.headers);
//     expect(result.headers['Content-Type']).toBe('application/json');

//     const parsedBody = JSON.parse(result.body);
    
//     expect(parsedBody.metadata).toEqual({
//       'Author': 'test-author',
//       'Version': '2.0.0',
//       'Description': 'default-description'
//     });

//     const expectedContent = Buffer.from(mockFileContent).toString('base64');
//     expect(parsedBody.data.Content).toBe(expectedContent);

//     expect(mockS3Send).toHaveBeenCalledTimes(2);
    
//     const [headCall, getCall] = mockS3Send.mock.calls;
//     expect(headCall[0]).toBeInstanceOf(HeadObjectCommand);
//     expect(getCall[0]).toBeInstanceOf(GetObjectCommand);
    
//     [headCall[0].input, getCall[0].input].forEach(params => {
//       expect(params).toEqual({
//         Bucket: 'acmeregistrys3',
//         Key: 'test-package-id'
//       });
//     });
//   });

//   test('returns 404 when package does not exist', async () => {
//     mockS3Send.mockRejectedValueOnce(new Error('Object not found'));

//     const result = await downloadPackageHandler('non-existent-package');
    
//     expect(result.statusCode).toBe(404);
//     verifyHeaders(result.headers);
//     expect(mockS3Send).toHaveBeenCalledTimes(1);
//   });

//   test('returns 400 when download fails', async () => {
//     const errorMessage = 'Download failed';
//     mockS3Send
//       .mockResolvedValueOnce({ Metadata: generateMetadata() })
//       .mockRejectedValueOnce(new Error(errorMessage));

//     const result = await downloadPackageHandler('failed-package');

//     expect(result.statusCode).toBe(400);
//     verifyHeaders(result.headers);
    
//     const parsedBody = JSON.parse(result.body);
//     expect(parsedBody.message).toBe("There is missing field(s) in the PackageID or it is formed improperly, or is invalid.");
//   });

//   test('properly capitalizes metadata fields', async () => {
//     const testCases = [
//       { input: { author: 'test', VERSION: '1.0', Description: 'test' } },
//       { input: { AUTHOR: 'test', version: '1.0', description: 'test' } },
//       { input: { Author: 'test', Version: '1.0', DESCRIPTION: 'test' } }
//     ];

//     for (const testCase of testCases) {
//       mockS3Send
//         .mockResolvedValueOnce({ Metadata: testCase.input })
//         .mockResolvedValueOnce({ Body: createMockStream('test') });

//       const result = await downloadPackageHandler('test-package');
//       const parsedBody = JSON.parse(result.body);

//       Object.keys(parsedBody.metadata).forEach(key => {
//         expect(key).toMatch(/^[A-Z][a-z]+$/);
//       });

//       expect(Object.keys(parsedBody.metadata)).toEqual(
//         expect.arrayContaining(['Author', 'Version', 'Description'])
//       );
//     }
//   });

//   test('handles empty and missing metadata gracefully', async () => {
//     const testCases = [
//       { Metadata: {} },
//       { Metadata: null },
//       {}
//     ];

//     for (const metadata of testCases) {
//       mockS3Send
//         .mockResolvedValueOnce(metadata)
//         .mockResolvedValueOnce({ Body: createMockStream('test') });

//       const result = await downloadPackageHandler('empty-package');
//       expect(result.statusCode).toBe(200);
      
//       const parsedBody = JSON.parse(result.body);
//       expect(parsedBody.metadata).toBeDefined();
//       expect(Object.keys(parsedBody.metadata).length).toBe(0);
//     }
//   });

//   test('handles large file downloads efficiently', async () => {
//     const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
    
//     mockS3Send
//       .mockResolvedValueOnce({ Metadata: generateMetadata() })
//       .mockResolvedValueOnce({ Body: createMockStream(largeContent) });

//     const result = await downloadPackageHandler('large-file');
//     expect(result.statusCode).toBe(200);
    
//     const parsedBody = JSON.parse(result.body);
//     expect(parsedBody.data.Content.length).toBe(Buffer.from(largeContent).toString('base64').length);
//   });
// });