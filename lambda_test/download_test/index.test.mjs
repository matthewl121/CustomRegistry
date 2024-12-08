/**
 * @fileoverview Test suite for Package Download Lambda Handler
 * @description Tests the functionality of downloading packages from S3, including metadata
 *              handling, error cases, and large file downloads.
 * 
 * @requires @jest/globals
 * @requires @aws-sdk/client-s3
 * @requires stream
 * 
 * @version 1.0.0
 * @date December 8, 2024
 * 
 * @test-coverage
 * - Successful package downloads with metadata
 * - Error handling (404, 400)
 * - Metadata field capitalization
 * - Empty metadata handling
 * - Large file download handling
 * - CORS headers validation
 * 
 * @example
 * // Run tests
 * npm test download.test.js
 */

import { jest } from '@jest/globals';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { downloadPackageHandler } from '../../lambda/download/index.mjs';
import { Readable } from 'stream';

// Track API requirements coverage for reporting
const apiRequirements = {
  'Valid input (200)': false,
  'Invalid input (400)': false,
  'Package does not exist (404)': false
};

// Print API coverage report after all tests complete
afterAll(() => {
  console.log('\n=== API Requirements Status ===');
  console.log('/package/{id} | GET');
  Object.entries(apiRequirements).forEach(([requirement, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${requirement}`);
  });
  console.log('============================\n');
});

// Configure AWS S3 client mocking
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  GetObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn()
}));

describe('downloadPackageHandler', () => {
  // Mock S3 client send function for each test
  let mockS3Send;

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  // Helper function to create mock readable streams
  const createMockStream = (data) => Readable.from([Buffer.from(data)]);

  // Helper function to generate test metadata with defaults
  const generateMetadata = (overrides = {}) => {
    const defaults = {
      author: 'default-author',
      version: '1.0.0',
      description: 'default-description'
    };
    return { ...defaults, ...overrides };
  };

  // Helper function to verify CORS headers
  const verifyHeaders = (headers) => {
    const expectedHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    expect(headers).toMatchObject(expectedHeaders);
  };

  // Test successful package download and processing
  test('200: successfully downloads and processes a package', async () => {
    // Setup mock metadata and content
    const mockMetadata = generateMetadata({
      author: 'test-author',
      version: '2.0.0'
    });

    const mockFileContent = 'test-content'.repeat(10);
    
    // Configure S3 mock responses
    mockS3Send
      .mockResolvedValueOnce({ Metadata: mockMetadata })
      .mockResolvedValueOnce({ Body: createMockStream(mockFileContent) });

    // Execute handler
    const result = await downloadPackageHandler('test-package-id');

    // Verify response status and headers
    expect(result.statusCode).toBe(200);
    verifyHeaders(result.headers);
    expect(result.headers['Content-Type']).toBe('application/json');

    // Verify response body and metadata
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.metadata).toEqual({
      'Author': 'test-author',
      'Version': '2.0.0',
      'Description': 'default-description'
    });

    // Verify content encoding
    const expectedContent = Buffer.from(mockFileContent).toString('base64');
    expect(parsedBody.data.Content).toBe(expectedContent);

    // Verify S3 calls
    expect(mockS3Send).toHaveBeenCalledTimes(2);
    const [headCall, getCall] = mockS3Send.mock.calls;
    expect(headCall[0]).toBeInstanceOf(HeadObjectCommand);
    expect(getCall[0]).toBeInstanceOf(GetObjectCommand);
    
    // Verify S3 parameters
    [headCall[0].input, getCall[0].input].forEach(params => {
      expect(params).toEqual({
        Bucket: 'acmeregistrys3',
        Key: 'test-package-id'
      });
    });

    apiRequirements['Valid input (200)'] = true;
  });

  // Test handling of nonexistent packages
  test('404: returns error when package does not exist', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('Object not found'));

    const result = await downloadPackageHandler('non-existent-package');
    
    expect(result.statusCode).toBe(404);
    verifyHeaders(result.headers);
    expect(mockS3Send).toHaveBeenCalledTimes(1);

    apiRequirements['Package does not exist (404)'] = true;
  });

  // Test handling of download failures
  test('400: returns error when download fails', async () => {
    const errorMessage = 'Download failed';
    mockS3Send
      .mockResolvedValueOnce({ Metadata: generateMetadata() })
      .mockRejectedValueOnce(new Error(errorMessage));

    const result = await downloadPackageHandler('failed-package');

    expect(result.statusCode).toBe(400);
    verifyHeaders(result.headers);
    
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.message).toBe("There is missing field(s) in the PackageID or it is formed improperly, or is invalid.");

    apiRequirements['Invalid input (400)'] = true;
  });

  // Test metadata field capitalization
  test('properly capitalizes metadata fields', async () => {
    const testCases = [
      { input: { author: 'test', VERSION: '1.0', Description: 'test' } },
      { input: { AUTHOR: 'test', version: '1.0', description: 'test' } },
      { input: { Author: 'test', Version: '1.0', DESCRIPTION: 'test' } }
    ];

    for (const testCase of testCases) {
      mockS3Send
        .mockResolvedValueOnce({ Metadata: testCase.input })
        .mockResolvedValueOnce({ Body: createMockStream('test') });

      const result = await downloadPackageHandler('test-package');
      const parsedBody = JSON.parse(result.body);

      // Verify proper capitalization
      Object.keys(parsedBody.metadata).forEach(key => {
        expect(key).toMatch(/^[A-Z][a-z]+$/);
      });

      expect(Object.keys(parsedBody.metadata)).toEqual(
        expect.arrayContaining(['Author', 'Version', 'Description'])
      );
    }
  });

  // Test handling of empty metadata
  test('handles empty and missing metadata gracefully', async () => {
    const testCases = [
      { Metadata: {} },
      { Metadata: null },
      {}
    ];

    for (const metadata of testCases) {
      mockS3Send
        .mockResolvedValueOnce(metadata)
        .mockResolvedValueOnce({ Body: createMockStream('test') });

      const result = await downloadPackageHandler('empty-package');
      expect(result.statusCode).toBe(200);
      
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.metadata).toBeDefined();
      expect(Object.keys(parsedBody.metadata).length).toBe(0);
    }
  });

  // Test handling of large file downloads
  test('handles large file downloads efficiently', async () => {
    const largeContent = 'x'.repeat(1024 * 1024); // 1MB of data
    
    mockS3Send
      .mockResolvedValueOnce({ Metadata: generateMetadata() })
      .mockResolvedValueOnce({ Body: createMockStream(largeContent) });

    const result = await downloadPackageHandler('large-file');
    expect(result.statusCode).toBe(200);
    
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.data.Content.length).toBe(Buffer.from(largeContent).toString('base64').length);
  });
});
