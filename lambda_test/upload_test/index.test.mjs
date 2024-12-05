import { jest } from '@jest/globals';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { uploadPackageHandler } from '../../lambda/upload/index.mjs';
import { Readable } from 'stream';

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn()
}));

describe('uploadPackageHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  const createMockStream = (data) => Readable.from([Buffer.from(data)]);

  test('successfully uploads a package to S3', async () => {
    const mockEvent = {
      body: JSON.stringify({
        packageName: 'test-package',
        version: '1.0.0',
        fileContent: 'Sample file content'
      })
    };

    const mockContext = {};

    mockS3Send.mockResolvedValueOnce({
      ETag: '"mock-etag-value"'
    });

    const result = await uploadPackageHandler(mockEvent, mockContext);

    expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'acmeregistrys3', 
      Key: 'test-package/1.0.0',
      Body: expect.any(Readable),
      ContentType: 'application/octet-stream'
    });

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Package uploaded successfully',
        ETag: '"mock-etag-value"'
      })
    });
  });

  test('returns an error if S3 upload fails', async () => {
    const mockEvent = {
      body: JSON.stringify({
        packageName: 'test-package',
        version: '1.0.0',
        fileContent: 'Sample file content'
      })
    };

    const mockContext = {};

    mockS3Send.mockRejectedValueOnce(new Error('S3 upload failed'));

    const result = await uploadPackageHandler(mockEvent, mockContext);

    expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to upload package'
      })
    });
  });

  test('returns an error for invalid input', async () => {
    const mockEvent = {
      body: JSON.stringify({})
    };

    const mockContext = {};

    const result = await uploadPackageHandler(mockEvent, mockContext);

    expect(mockS3Send).not.toHaveBeenCalled();

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid input'
      })
    });
  });
});
