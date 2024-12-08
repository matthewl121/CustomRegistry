/**
* @fileoverview Test Suite for Package Rating Lambda Handler
* @description Tests the functionality of rating packages from different sources (NPM, GitHub, zip),
*              including success cases, error handling, and various input types.
* 
* @test-coverage
* - NPM package rating
* - GitHub package rating  
* - Zip file package rating
* - Invalid URL handling
* - Missing package handling
* - Error responses
*/

import { jest } from '@jest/globals';
import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';
import { S3Client } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import AdmZip from 'adm-zip';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

// Mock child_process execution
const mockExecPromise = jest.fn();
jest.mock('child_process', () => ({
   exec: () => mockExecPromise
}));

// Mock util.promisify
jest.mock('util', () => ({
   ...jest.requireActual('util'),
   promisify: (fn) => (...args) => mockExecPromise(...args)
}));

// Mock file system operations
const mockMkdir = jest.fn();
const mockUnlink = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('fs/promises', () => ({
   mkdir: (...args) => mockMkdir(...args),
   unlink: (...args) => mockUnlink(...args),
   writeFile: (...args) => mockWriteFile(...args)
}));

describe('Rate Package Handler', () => {
   let mockS3Send;

   // Reset all mocks before each test
   beforeEach(() => {
       jest.clearAllMocks();
       mockS3Send = jest.fn();
       S3Client.prototype.send = mockS3Send;

       // Set default success responses for file operations
       mockMkdir.mockResolvedValue(undefined);
       mockUnlink.mockResolvedValue(undefined);
       mockWriteFile.mockResolvedValue(undefined);

       // Set default metrics response
       mockExecPromise.mockResolvedValue({
           stdout: JSON.stringify({
               NetScore: 0.5,
               NetScoreLatency: 0.2,
               RampUp: 0.5,
               RampUpLatency: 0.1,
               Correctness: 0.5,
               CorrectnessLatency: 0.3,
               BusFactor: 0.5,
               BusFactorLatency: 0.4,
               ResponsiveMaintainer: 0.5,
               ResponsiveMaintainerLatency: 0.5,
               LicenseScore: 1.0,
               LicenseScoreLatency: 0.1,
               GoodPinningPractice: 0.5,
               GoodPinningPracticeLatency: 0.6,
               PullRequest: 0.7,
               PullRequestLatency: 0.2
           }),
           stderr: ''
       });
   });

   // Test NPM package rating
   test('successfully retrieves matching packages', async () => {
       // Mock S3 responses for NPM package
       mockS3Send
           .mockResolvedValueOnce({})  // HEAD request
           .mockResolvedValueOnce({    // GET request
               Metadata: {
                   uploadvia: 'npm',
                   name: 'lodash',
                   version: '4.17.21',
                   score: '8.5'
               }
           })
           .mockResolvedValueOnce({}); // PUT request

       const result = await ratePackageHandler({
           pathParameters: { id: "lodash@4.17.21" }
       });

       expect(result.statusCode).toBe(200);
   });

   // Test GitHub package rating
   test('handles GitHub package successfully', async () => {
       // Mock S3 responses for GitHub package
       mockS3Send
           .mockResolvedValueOnce({})  // HEAD request
           .mockResolvedValueOnce({    // GET request
               Metadata: {
                   uploadvia: 'github',
                   url: 'https://github.com/cloudinary/cloudinary_npm',
                   score: '8.5'
               }
           })
           .mockResolvedValueOnce({}); // PUT request

       const result = await ratePackageHandler({
           pathParameters: { id: "cloudinary-npm-2.5.1" }
       });

       expect(result.statusCode).toBe(200);
   });

   // Test zip file content handling
   test('handles zip file content package successfully', async () => {
       // Create mock package.json in zip
       const zip = new AdmZip();
       zip.addFile("package.json", Buffer.from(JSON.stringify({
           name: "cloudinary",
           version: "2.5.1",
           homepage: "https://github.com/cloudinary/cloudinary_npm",
           repository: { type: "git", url: "git+https://github.com/cloudinary/cloudinary_npm.git" }
       })));
       
       // Create mock stream with zip content
       const zipBuffer = zip.toBuffer();
       const mockStream = new Readable();
       mockStream.push(zipBuffer);
       mockStream.push(null);

       // Mock S3 responses
       mockS3Send
           .mockResolvedValueOnce({})  
           .mockResolvedValueOnce({    
               Metadata: { uploadvia: 'content', score: '-1' },
               Body: mockStream
           })
           .mockResolvedValueOnce({}); 

       const result = await ratePackageHandler({
           pathParameters: { id: "cloudinary_npm--2.5.1" }
       });

       expect(result.statusCode).toBe(200);
   });

   // Test invalid URL handling
   test('handles invalid URL in zip content', async () => {
       // Create mock package.json with invalid URL
       const zip = new AdmZip();
       zip.addFile("package.json", Buffer.from(JSON.stringify({
           name: "test-package",
           repository: { url: "https://invalid-url.com/repo" }
       })));
       const mockStream = new Readable();
       mockStream.push(zip.toBuffer());
       mockStream.push(null);

       // Mock S3 responses
       mockS3Send
           .mockResolvedValueOnce({})
           .mockResolvedValueOnce({
               Metadata: { uploadvia: 'content', score: '8.5' },
               Body: mockStream
           })
           .mockResolvedValueOnce({});

       const result = await ratePackageHandler({
           pathParameters: { id: "test-package.zip" }
       });

       expect(result.statusCode).toBe(200);
   });

   // Test 404 handling
   test('returns 404 for non-existent package', async () => {
       mockS3Send.mockRejectedValueOnce({
           name: 'NotFound',
           $metadata: { httpStatusCode: 404 }
       });

       const result = await ratePackageHandler({
           pathParameters: { id: "non-existent-package@1.0.0" }
       });

       expect(result.statusCode).toBe(404);
   });

   // Test missing package ID handling
   test('handles missing package ID', async () => {
       const result = await ratePackageHandler({
           pathParameters: {}
       });

       expect(result.statusCode).toBe(400);
   });

   // Log test summary
   const summary = `
   Summary of Tests:
   - 'handles NPM package successfully' → statusCode: 200
   - 'handles GitHub package successfully' → statusCode: 200
   - 'handles zip file content package successfully' → statusCode: 200
   - 'handles invalid URL in zip content' → statusCode: 200
   - 'returns 404 for non-existent package' → statusCode: 404
   - 'handles missing package ID' → statusCode: 400
   `;

   console.log(summary);
});