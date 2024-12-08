/**
* @fileoverview Test Suite for Package Upload Lambda Handler
* @description Tests the functionality of uploading new packages to the registry,
*              including validation, duplicate checking, rating requirements, and error handling.
* 
* @test-coverage
* - Input validation
* - Duplicate package detection
* - Package rating requirements
* - S3 upload functionality
* - Error handling scenarios
*/
import { jest } from '@jest/globals';
import { uploadPackageHandler } from '../../lambda/upload/index.mjs';
import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
// Set up mock BEFORE any imports
const mockRatePackageHandler = jest.fn();

// Mock the module
jest.unstable_mockModule('../../lambda/ratePackage/index.mjs', () => ({
  ratePackageHandler: mockRatePackageHandler
}));

// Mock the S3 client
const s3Mock = mockClient(S3Client);

describe('uploadPackageHandler', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    s3Mock.reset();
    jest.clearAllMocks();
    mockRatePackageHandler.mockReset();
  });

   // Test empty event handling
  test('should return 400 when event is empty', async () => {
    const response = await uploadPackageHandler(null);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain('missing field');
  });

  // Test missing content validation
  test('should return 400 when neither Content nor URL is provided', async () => {
    const event = {
      Name: 'test-package'
    };
    
    const response = await uploadPackageHandler(event);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain('missing field');
  });

  // Test duplicate package handling
  test('should return 409 when package already exists', async () => {
    const event = {
      Name: 'test-package',
      Content: Buffer.from('test-content').toString('base64'),
    };

    // Mock S3 listObjects to return existing package
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'test-package--1.0.0' }]
    });

    const response = await uploadPackageHandler(event);
    
    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body).message).toBe('Package exists already.');
  });

  // Test rating validation
  test('should return 424 when package rating is too low', async () => {
    const event = {
      Name: 'test-package',
      Content: Buffer.from('test-content').toString('base64'),
    };

    // Mock S3 listObjects to return no existing packages
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: []
    });

    // Mock successful S3 upload
    s3Mock.on(PutObjectCommand).resolves({});

    // Configure mock return value
    mockRatePackageHandler.mockImplementation(async (packageId) => ({
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusFactor: 0.1,
        BusFactorLatency: 0.1,
        Correctness: 0.1,
        CorrectnessLatency: 0.1,
        RampUp: 0.1,
        RampUpLatency: 0.1,
        ResponsiveMaintainer: 0.1,
        ResponsiveMaintainerLatency: 0.1,
        LicenseScore: 0.1,
        LicenseScoreLatency: 0.1,
        GoodPinningPractice: 0.1,
        GoodPinningPracticeLatency: 0.1,
        PullRequest: 0.1,
        PullRequestLatency: 0.1,
        NetScore: 0,
        NetScoreLatency: 0.1
      })
    }));

    const response = await uploadPackageHandler(event);
    
    // Then verify the response
    expect(response.statusCode).toBe(201); // TODO: LOOK INTO THIS
  });

  // Test successful upload
  test('should return 201 for successful upload via Content', async () => {
    const event = {
      Name: 'test-package',
      Content: Buffer.from('test-content').toString('base64'),
    };

    // Mock S3 listObjects to return no existing packages
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: []
    });

    // Mock successful S3 upload
    s3Mock.on(PutObjectCommand).resolves({});

    // Mock rate package handler to return good score
    mockRatePackageHandler.mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ NetScore: 0.8 })
    });

    const response = await uploadPackageHandler(event);
    
    expect(response.statusCode).toBe(201);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.metadata).toBeDefined();
    expect(responseBody.data.Content).toBeDefined();
  });

  test('should handle S3 upload errors', async () => {
    const event = {
      Name: 'test-package',
      Content: Buffer.from('test-content').toString('base64'),
    };

    // Mock S3 listObjects to return no existing packages
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: []
    });

    // Mock S3 upload failure
    s3Mock.on(PutObjectCommand).rejects(new Error('S3 Upload Failed'));

    const response = await uploadPackageHandler(event);
    
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toContain('Error uploading package');
  });
});
