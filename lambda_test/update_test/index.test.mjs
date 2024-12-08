/**
* @fileoverview Test Suite for Package Update Lambda Handler
* @description Tests the functionality of updating existing packages in the registry,
*              including version validation, error handling, and non-existent package scenarios.
* 
* @test-coverage
* - Successful patch version updates
* - Invalid version validation
* - Non-existent package handling
* - Package metadata validation
* 
* @api-endpoint POST /package/{id}
* @request-format
* {
*   metadata: {
*     Name: string,
*     Version: string,
*     ID: string
*   },
*   data: {
*     Content: string (base64)
*   }
* }
*/

import { jest } from '@jest/globals';
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { updatePackageHandler } from '../../lambda/update/index.mjs';

// Mock AWS S3 client and commands
jest.mock("@aws-sdk/client-s3", () => ({
 S3Client: jest.fn(() => ({
   send: jest.fn()
 })),
 PutObjectCommand: jest.fn(),
 HeadObjectCommand: jest.fn()
}));

describe('updatePackageHandler', () => {
 let mockS3Send;

 // Reset mocks before each test
 beforeEach(() => {
   jest.clearAllMocks();
   mockS3Send = jest.fn();
   S3Client.prototype.send = mockS3Send;
 });

 // Test successful patch version update
 test('/package/{id} | POST | Update with new patch version', async () => {
   // Mock existing package metadata
   mockS3Send.mockResolvedValueOnce({
     Metadata: {
       name: 'test-package',
       version: '1.0.0',
       uploadvia: 'content'
     }
   }); 

   // Setup test data
   const newPackageVersion = '1.0.1';
   const newPackageContent = Buffer.from('new package content');
   
   // Mock successful update
   mockS3Send.mockResolvedValueOnce({});

   // Create test event
   const event = {
     metadata: {
       Name: 'test-package',
       Version: newPackageVersion,
       ID: 'test-package--1.0.0'
     },
     data: {
       Content: newPackageContent.toString('base64')
     }
   };

   const result = await updatePackageHandler(event);
   expect(result.statusCode).toBe(200);
 });

 // Test invalid patch version update
 test('/package/{id} | POST | Update with invalid patch version', async () => {
   // Mock existing package with invalid version
   mockS3Send.mockResolvedValueOnce({
     Metadata: {
       name: 'test-package',
       version: '0',
       uploadvia: 'content'
     }
   });

   // Setup test data with invalid version
   const newPackageVersion = '1.0.0';
   const newPackageContent = Buffer.from('new package content');

   const event = {
     metadata: {
       Name: 'test-package',
       Version: newPackageVersion,
       ID: 'test-package--1.0.0'
     },
     data: {
       Content: newPackageContent.toString('base64')
     }
   };

   const result = await updatePackageHandler(event);
   expect(result.statusCode).toBe(400);
 });

 // Test non-existent package update
 test('/package/{id} | POST | Update with non-existent package', async () => {
   // Mock 404 response for non-existent package
   mockS3Send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } });

   const event = {
     metadata: {
       Name: 'non-existent-package',
       Version: '1.0.0',
       ID: 'non-existent-package--1.0.0'
     },
     data: {
       Content: Buffer.from('new package content').toString('base64')
     }
   };

   const result = await updatePackageHandler(event);
   expect(result.statusCode).toBe(404);
 });
});