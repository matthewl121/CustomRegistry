import { jest } from '@jest/globals';
import { packageCostHandler } from '../../lambda/costPackage/index.mjs';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { Readable } from 'stream';

// Mock S3 client
const s3Mock = mockClient(S3Client);

// Helper to create a readable stream from a string
const createReadableStream = (content) => {
  return Readable.from(Buffer.from(content));
};

// Sample package.json content
const samplePackageJson = {
  dependencies: {
    "express": "^4.17.1",
    "lodash": "^4.17.21"
  },
  devDependencies: {
    "jest": "^27.0.6"
  }
};

describe('Cost Package Handler - Integration Tests', () => {
  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
  });

  test('should calculate costs with dependencies for tar.gz package', async () => {
    // Mock S3 HEAD response
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576, // 1MB
      Metadata: { uploadvia: 'url' }
    });

    // Mock S3 GET response with tar.gz content
    s3Mock.on(GetObjectCommand).resolves({
      Body: {
        // Mocked response that would typically contain tar.gz data
        toString: () => JSON.stringify(samplePackageJson)
      }
    });

    const response = await packageCostHandler({
      id: "test-package--1.0.0",
      dependency: "true"
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body["test-package--1.0.0"]).toBeDefined();
    expect(body["test-package--1.0.0"].standaloneCost).toBeDefined();
    expect(body["test-package--1.0.0"].totalCost).toBeDefined();
  });

  test('should calculate costs with dependencies for ZIP package', async () => {
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 2097152, // 2MB
      Metadata: { uploadvia: 'content' }
    });

    s3Mock.on(GetObjectCommand).resolves({
      Body: {
        // Mocked response that would typically contain ZIP data
        toString: () => JSON.stringify(samplePackageJson)
      }
    });

    const response = await packageCostHandler({
      id: "test-zip-package--1.0.0",
      dependency: "true"
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body["test-zip-package--1.0.0"]).toBeDefined();
    expect(body["test-zip-package--1.0.0"].standaloneCost).toBeDefined();
    expect(body["test-zip-package--1.0.0"].totalCost).toBeDefined();
  });

  test('should calculate standalone cost without dependencies', async () => {
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576, // 1MB
      Metadata: { uploadvia: 'url' }
    });

    const response = await packageCostHandler({
      id: "test-package--1.0.0",
      dependency: "false"
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body["test-package--1.0.0"]).toBeDefined();
    expect(body["test-package--1.0.0"].totalCost).toBeDefined();
    expect(typeof body["test-package--1.0.0"].totalCost).toBe('number');
  });

  test('should handle package not found in S3', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));

    const response = await packageCostHandler({
      id: "non-existent-package--1.0.0",
      dependency: "true"
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Package does not exist.");
  });
});

describe('Cost Package Handler - Error Cases', () => {
  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
  });

  test('should handle invalid package ID', async () => {
    const response = await packageCostHandler({
      id: "../invalid/package/id",
      dependency: "true"
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("There is missing field(s) in the PackageID");
  });

  test('should handle missing package ID', async () => {
    const response = await packageCostHandler({
      dependency: "true"
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("There is missing field(s) in the PackageID");
  });

  test('should handle S3 service errors', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('Internal Server Error'));

    const response = await packageCostHandler({
      id: "test-package--1.0.0",
      dependency: "true"
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Package does not exist.");
  });

  test('should handle malformed package.json', async () => {
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576,
      Metadata: { uploadvia: 'url' }
    });

    s3Mock.on(GetObjectCommand).resolves({
      Body: {
        toString: () => "invalid json content"
      }
    });

    const response = await packageCostHandler({
      id: "test-package--1.0.0",
      dependency: "true"
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body["test-package--1.0.0"]).toBeDefined();
  });
});