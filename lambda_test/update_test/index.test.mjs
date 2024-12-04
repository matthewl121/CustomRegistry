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

// Mock all console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

describe('updatePackageHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    console.info.mockClear();
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

    const mockPutResponse = { ETag: '"mock-etag"' };
    mockS3Send.mockResolvedValueOnce(mockPutResponse);

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    expect(console.log).toHaveBeenCalledWith(
      "/package/{id} POST: Package updated successfully:",
      mockPutResponse
    );
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
    expect(console.error).toHaveBeenCalledTimes(1);
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

    mockS3Send.mockResolvedValueOnce({}); // Delete response
    mockS3Send.mockResolvedValueOnce({ ETag: '"mock-etag"' }); // Put response

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(200);
    expect(mockS3Send).toHaveBeenCalledTimes(4);

    expect(console.log).toHaveBeenCalledWith(
      '/package/{id} POST: Deleted 2 existing versions of package "test-package".'
    );
    expect(console.log).toHaveBeenCalledWith(
      '/package/{id} POST: Package updated successfully:',
      expect.any(Object)
    );
  });

  test('handles empty package list during debloat', async () => {
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

    mockS3Send.mockResolvedValueOnce({ Contents: [] }); // Empty package list
    mockS3Send.mockResolvedValueOnce({ ETag: '"mock-etag"' }); // Put response

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(200);
    expect(console.log).toHaveBeenCalledWith(
      '/package/{id} POST: No existing versions found for package "test-package".'
    );
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
    expect(console.error).toHaveBeenCalledTimes(1);
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
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  test('handles missing Content or URL', async () => {
    const event = {
      data: {
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
      '/package/{id} POST: Either Content or URL must be provided.'
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  test('handles error during debloat', async () => {
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

    mockS3Send.mockRejectedValueOnce(new Error('Debloat operation failed'));

    const result = await updatePackageHandler(event);

    expect(result.statusCode).toBe(400);
    expect(console.error).toHaveBeenCalledWith(
      '/package/{id} POST: Error during debloat: Debloat operation failed'
    );
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});