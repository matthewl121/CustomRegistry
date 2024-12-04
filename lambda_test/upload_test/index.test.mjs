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


});