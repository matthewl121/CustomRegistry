import { jest } from '@jest/globals';
import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { updatePackageHandler } from '../../lambda/update/index.mjs';

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectsCommand: jest.fn()
}));

// Mock console.error to prevent error output in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('updatePackageHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
    console.error.mockClear();
  });

  test('successfully updates package with content', async () => {
    const event = {
      data: {
        Content: Buffer.from('test-content').toString('base64'),
        debloat: "false"
      },
      metadata: {
        Name: 'test-package',
        Version: '1.2.3',
        ID: 'test-package--1.1.3'
      }
    };

    mockS3Send.mockResolvedValueOnce({
      Metadata: {
        name: 'test-package',
        version: '1.1.3',
        uploadvia: 'content'
      }
    });

    mockS3Send.mockResolvedValueOnce({});

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  });

  test('returns 404 when old package does not exist', async () => {
    const event = {
      data: {
        Content: Buffer.from('test-content').toString('base64'),
        debloat: "false"
      },
      metadata: {
        Name: 'test-package',
        Version: '1.2.3',
        ID: 'test-package--1.1.3'
      }
    };

    mockS3Send.mockRejectedValueOnce(new Error('Object does not exist'));

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(404);
    expect(console.error).toHaveBeenCalledWith('/package/{id} POST: Object does not exist.');
  });

  test('handles debloat flag correctly', async () => {
    const event = {
      data: {
        Content: Buffer.from('test-content').toString('base64'),
        debloat: "true"
      },
      metadata: {
        Name: 'test-package',
        Version: '1.2.3',
        ID: 'test-package--1.1.3'
      }
    };

    mockS3Send.mockResolvedValueOnce({
      Metadata: {
        name: 'test-package',
        version: '1.1.3',
        uploadvia: 'content'
      }
    });

    mockS3Send.mockResolvedValueOnce({
      Contents: [
        { Key: 'test-package--1.1.0' },
        { Key: 'test-package--1.1.3' }
      ]
    });

    mockS3Send.mockResolvedValueOnce({});
    mockS3Send.mockResolvedValueOnce({});

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(200);
    expect(mockS3Send).toHaveBeenCalledTimes(4);
  });

  test('rejects update with invalid version', async () => {
    const event = {
      data: {
        Content: Buffer.from('test-content').toString('base64'),
        debloat: "false"
      },
      metadata: {
        Name: 'test-package',
        Version: '1.1.2',
        ID: 'test-package--1.1.3'
      }
    };

    mockS3Send.mockResolvedValueOnce({
      Metadata: {
        name: 'test-package',
        version: '1.1.3',
        uploadvia: 'content'
      }
    });

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(400);
    expect(console.error).toHaveBeenCalledWith(
      '/package/{id} POST: New patch version is not greater than or equal to the old patch version.'
    );
  });

  test('rejects update with mismatched upload method', async () => {
    const event = {
      data: {
        URL: 'https://github.com/user/repo',
        debloat: "false"
      },
      metadata: {
        Name: 'test-package',
        Version: '1.2.3',
        ID: 'test-package--1.1.3'
      }
    };

    mockS3Send.mockResolvedValueOnce({
      Metadata: {
        name: 'test-package',
        version: '1.1.3',
        uploadvia: 'content'
      }
    });

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(400);
    expect(console.error).toHaveBeenCalledWith(
      "/package/{id} POST: 'Trying to update via invalid/wrong/opposite method'."
    );
  });
});