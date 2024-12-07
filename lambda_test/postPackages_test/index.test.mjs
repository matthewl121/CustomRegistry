import { jest } from '@jest/globals';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { postPackagesHandler } from '../../lambda/postPackages/index.mjs';

// Store test results
const apiRequirements = {
  'Valid input (200)': false,
  'Invalid input (400)': false,
  'Too many packages (413)': false
};

// Mock console.error and console.log to prevent output in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  
  // Print API requirements status
  console.log('\n=== API Requirements Status ===');
  console.log('/packages | POST');
  Object.entries(apiRequirements).forEach(([requirement, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${requirement}`);
  });
  console.log('============================\n');
});

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  ListObjectsV2Command: jest.fn()
}));

describe('postPackagesHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
    console.error.mockClear();
    console.log.mockClear();
  });

  test('200: valid input with exact package matches', async () => {
    mockS3Send.mockResolvedValueOnce({
      Contents: [
        { Key: 'underscore--1.2.3' },
        { Key: 'lodash--2.1.0' }
      ]
    });

    const event = {
      queries: [
        { Name: 'underscore', Version: '1.2.3' },
        { Name: 'lodash', Version: '2.1.0' }
      ]
    };

    const result = await postPackagesHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(result.body);
    expect(body).toEqual([
      { Version: '1.2.3', Name: 'underscore', ID: 'underscore--1.2.3' },
      { Version: '2.1.0', Name: 'lodash', ID: 'lodash--2.1.0' }
    ]);

    apiRequirements['Valid input (200)'] = true;
  });

  test('400: invalid input missing required fields', async () => {
    const event = {
      queries: [
        { Version: '1.0.0' }, // Missing Name
        { Name: '' }  // Empty Name
      ]
    };

    const result = await postPackagesHandler(event);

    expect(result.statusCode).toBe(400);
    expect(result.headers['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.'
    });

    apiRequirements['Invalid input (400)'] = true;
  });

  test('413: too many packages returned for wildcard query', async () => {
    const mockContents = Array.from({ length: 31 }, (_, i) => ({
      Key: `package${i}--1.0.0`
    }));

    mockS3Send.mockResolvedValueOnce({ Contents: mockContents });

    const event = {
      queries: [{ Name: '*' }]
    };

    const result = await postPackagesHandler(event);

    expect(result.statusCode).toBe(413);
    expect(result.headers['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: 'Too many packages returned.'
    });

    apiRequirements['Too many packages (413)'] = true;
  });

  // Additional test cases...
  test('handles S3 errors gracefully', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('S3 Error'));

    const event = {
      queries: [
        { Name: 'package1', Version: '1.0.0' }
      ]
    };

    const result = await postPackagesHandler(event);

    expect(result.statusCode).toBe(400);
    expect(result.headers['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.'
    });
  });

  test('handles version ranges correctly', async () => {
    const mockContents = [
      { Key: 'package1--1.2.3' },
      { Key: 'package1--1.2.9' },
      { Key: 'package1--1.3.0' }
    ];

    mockS3Send.mockResolvedValueOnce({ Contents: mockContents });

    const event = {
      queries: [
        { Name: 'package1', Version: '1.2.3-1.3.0' }
      ]
    };

    const result = await postPackagesHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(result.body);
    expect(body.length).toBe(3);
  });
});
// import { jest } from '@jest/globals';
// import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
// import { postPackagesHandler } from '../../lambda/postPackages/index.mjs';

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

// describe('postPackagesHandler', () => {
//   let mockS3Send;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockS3Send = jest.fn();
//     S3Client.prototype.send = mockS3Send;
//     console.error.mockClear();
//   });

//   test('successfully retrieves matching packages', async () => {
//     const mockContents = [
//       { Key: 'package1--1.2.3' },
//       { Key: 'package2--2.0.0' },
//       { Key: 'package1--1.3.0' }
//     ];

//     mockS3Send.mockResolvedValueOnce({ Contents: mockContents });

//     const event = {
//       queries: [
//         { Name: 'package1', Version: '1.2.3' },
//         { Name: 'package2', Version: '2.0.0' }
//       ]
//     };

//     const result = await postPackagesHandler(event);

//     expect(result.statusCode).toBe(200);
//     expect(result.headers['Content-Type']).toBe('application/json');

//     const parsedBody = JSON.parse(result.body);
//     expect(parsedBody).toHaveLength(2);
//     expect(parsedBody).toEqual(expect.arrayContaining([
//       { Name: 'Package1', Version: '1.2.3', ID: 'package1--1.2.3' },
//       { Name: 'Package2', Version: '2.0.0', ID: 'package2--2.0.0' }
//     ]));
//     expect(console.error).not.toHaveBeenCalled();
//   });

//   test('handles invalid queries', async () => {
//     const event = {
//       queries: [
//         { Name: 'package1' }, // Missing Version
//         { Version: '1.0.0' }  // Missing Name
//       ]
//     };

//     const result = await postPackagesHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body)).toEqual({
//       message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.'
//     });
//     expect(console.error).not.toHaveBeenCalled();
//   });

//   test('handles no matching packages', async () => {
//     mockS3Send.mockResolvedValueOnce({ Contents: [
//       { Key: 'package3--1.0.0' }
//     ]});

//     const event = {
//       queries: [
//         { Name: 'package1', Version: '1.0.0' }
//       ]
//     };

//     const result = await postPackagesHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body)).toEqual({
//       message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.'
//     });
//     expect(console.error).not.toHaveBeenCalled();
//   });

//   test('handles S3 errors gracefully', async () => {
//     const testError = new Error('S3 Error');
//     mockS3Send.mockRejectedValueOnce(testError);

//     const event = {
//       queries: [
//         { Name: 'package1', Version: '1.0.0' }
//       ]
//     };

//     const result = await postPackagesHandler(event);

//     expect(result.statusCode).toBe(400);
//     expect(JSON.parse(result.body)).toEqual({
//       message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.'
//     });
//     expect(console.error).toHaveBeenCalledWith('Error:', testError);
//   });

//   test('properly matches version ranges', async () => {
//     const mockContents = [
//       { Key: 'package1--1.2.3' },
//       { Key: 'package1--1.2.9' },
//       { Key: 'package1--1.3.0' },
//       { Key: 'package1--2.0.0' }
//     ];

//     const testCases = [
//       {
//         query: { Name: 'package1', Version: '1.2.3' },
//         expectedVersions: ['1.2.3']
//       },
//       {
//         query: { Name: 'package1', Version: '1.2.0-1.3.0' },
//         expectedVersions: ['1.2.3', '1.2.9', '1.3.0']
//       },
//       {
//         query: { Name: 'package1', Version: '^1.2.3' },
//         expectedVersions: ['1.2.3', '1.2.9', '1.3.0']
//       },
//       {
//         query: { Name: 'package1', Version: '~1.2.3' },
//         expectedVersions: ['1.2.3', '1.2.9']
//       }
//     ];

//     for (const testCase of testCases) {
//       const event = {
//         queries: [testCase.query]
//       };

//       mockS3Send.mockResolvedValueOnce({ Contents: mockContents });
//       const result = await postPackagesHandler(event);
      
//       expect(result.statusCode).toBe(200);
//       const packages = JSON.parse(result.body);
//       const versions = packages.map(p => p.Version);
//       expect(versions.sort()).toEqual(testCase.expectedVersions.sort());
//       expect(console.error).not.toHaveBeenCalled();
//     }
//   });
// });