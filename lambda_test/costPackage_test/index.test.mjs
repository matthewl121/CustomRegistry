import { jest } from '@jest/globals';
import { packageCostHandler } from '../../lambda/costPackage/index.mjs';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { Readable } from 'stream';

// Mock S3 client
const s3Mock = mockClient(S3Client);

// Create a mock gzipped buffer with proper signature
const createMockGzipBuffer = () => {
  // Create buffer with GZIP magic number (1f 8b)
  const buffer = Buffer.alloc(3);
  buffer[0] = 0x1f;
  buffer[1] = 0x8b;
  buffer[2] = 0x08; // DEFLATE compression method
  return buffer;
};

describe('Cost Package Handler - Integration Tests', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  test('should calculate costs with dependencies for cloudinary package', async () => {
    // Mock HEAD request with proper metadata
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576, // 1MB
      Metadata: {
        uploadvia: 'url'
      }
    });

    // Mock GET request with proper gzipped content
    const mockBuffer = createMockGzipBuffer();
    s3Mock.on(GetObjectCommand).resolves({
      Body: Readable.from(mockBuffer)
    });

    const response = await packageCostHandler({
      id: "cloudinary_npm--2.5.1",
      dependency: true
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
    expect(typeof body["cloudinary_npm--2.5.1"].standaloneCost).toBe('number');
    expect(typeof body["cloudinary_npm--2.5.1"].totalCost).toBe('number');
  });

  test('should calculate standalone cost for cloudinary package', async () => {
    // Mock HEAD request
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576, // 1MB
      Metadata: {
        uploadvia: 'url'
      }
    });

    const response = await packageCostHandler({
      id: "cloudinary_npm--2.5.1",
      dependency: false
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
    expect(typeof body["cloudinary_npm--2.5.1"].totalCost).toBe('number');
  });

  test('should handle non-existent package', async () => {
    // Mock HEAD request to fail
    s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));

    const response = await packageCostHandler({
      id: "non-existent-package--1.0.0",
      dependency: true
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Package does not exist.");
  });
});

describe('Cost Package Handler - Common Tests', () => {
  test('should handle invalid package ID', async () => {
    const response = await packageCostHandler({
      id: "../invalid/package/id",
      dependency: true
    });
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("There is missing field(s) in the PackageID");
  });

  test('should handle missing package ID', async () => {
    const response = await packageCostHandler({
      dependency: true
    });
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("There is missing field(s) in the PackageID");
  });

  test('should handle missing dependency flag', async () => {
    // Mock HEAD request
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576, // 1MB
      Metadata: {
        uploadvia: 'url'
      }
    });

    const response = await packageCostHandler({
      id: "cloudinary_npm--2.5.1"
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
    expect(typeof body["cloudinary_npm--2.5.1"].totalCost).toBe('number');
  });
});