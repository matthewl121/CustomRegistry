/**
* @fileoverview Test Suite for POST /packages API Lambda Handler
* @description Tests the functionality of searching and filtering packages,
*              including success cases, error handling, and validation checks.
* @test-coverage
* - Successful package queries (200)
* - Invalid input handling (400)  
* - Package limit exceeded (413)
* - S3 error handling
* - Version range filtering
* 
* @notes
* - Tests verify API requirements compliance
* - Includes automated requirement tracking
* - Handles edge cases and errors
*/

import { jest } from '@jest/globals';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { postPackagesHandler } from '../../lambda/postPackages/index.mjs';

// Track API requirement coverage
const apiRequirements = {
 'Valid input (200)': false,
 'Invalid input (400)': false,
 'Too many packages (413)': false
};

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Mock console methods before tests
beforeAll(() => {
 console.error = jest.fn();
 console.log = jest.fn();
});

// Restore console methods and print results after tests
afterAll(() => {
 console.error = originalConsoleError;
 console.log = originalConsoleLog;
 
 // Print API requirements status
 console.log('\n=== API Requirements Status ===');
 console.log('/packages | POST');
 Object.entries(apiRequirements).forEach(([requirement, passed]) => {
   console.log(`${passed ? '✓' : '✗'} ${requirement}`);
 });
 console.log('============================\n');
});

// Mock AWS S3 client
jest.mock("@aws-sdk/client-s3", () => ({
 S3Client: jest.fn(() => ({
   send: jest.fn()
 })),
 ListObjectsV2Command: jest.fn()
}));

describe('postPackagesHandler', () => {
 let mockS3Send;

 // Reset mocks before each test
 beforeEach(() => {
   jest.clearAllMocks();
   mockS3Send = jest.fn();
   S3Client.prototype.send = mockS3Send;
   console.error.mockClear();
   console.log.mockClear();
 });

 // Test successful package query with exact matches
 test('200: valid input with exact package matches', async () => {
   // Mock S3 response
   mockS3Send.mockResolvedValueOnce({
     Contents: [
       { Key: 'underscore--1.2.3' },
       { Key: 'lodash--2.1.0' }
     ]
   });

   const event = {
     queries: [
       { Name: 'underscore', Version: '1.2.3' },
       { Name: 'lodash', Version: '2.1.0' }
     ]
   };

   const result = await postPackagesHandler(event);

   // Verify response format
   expect(result.statusCode).toBe(200);
   expect(result.headers['Content-Type']).toBe('application/json');
   
   // Verify response content
   const body = JSON.parse(result.body);
   expect(body).toEqual([
     { Version: '1.2.3', Name: 'underscore', ID: 'underscore--1.2.3' },
     { Version: '2.1.0', Name: 'lodash', ID: 'lodash--2.1.0' }
   ]);

   apiRequirements['Valid input (200)'] = true;
 });

 // Test invalid input handling
 test('400: invalid input missing required fields', async () => {
   const event = {
     queries: [
       { Version: '1.0.0' }, // Missing Name
       { Name: '' }  // Empty Name
     ]
   };

   const result = await postPackagesHandler(event);

   // Verify error response
   expect(result.statusCode).toBe(400);
   expect(result.headers['Content-Type']).toBe('application/json');
   
   const body = JSON.parse(result.body);
   expect(body).toEqual({
     message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.'
   });

   apiRequirements['Invalid input (400)'] = true;
 });

 // Test package limit exceeded handling
 test('413: too many packages returned for wildcard query', async () => {
   // Generate mock data exceeding limit
   const mockContents = Array.from({ length: 31 }, (_, i) => ({
     Key: `package${i}--1.0.0`
   }));

   mockS3Send.mockResolvedValueOnce({ Contents: mockContents });

   const event = {
     queries: [{ Name: '*' }]
   };

   const result = await postPackagesHandler(event);

   // Verify error response
   expect(result.statusCode).toBe(413);
   expect(result.headers['Content-Type']).toBe('application/json');
   
   const body = JSON.parse(result.body);
   expect(body).toEqual({
     message: 'Too many packages returned.'
   });

   apiRequirements['Too many packages (413)'] = true;
 });

 // Test S3 error handling
 test('handles S3 errors gracefully', async () => {
   mockS3Send.mockRejectedValueOnce(new Error('S3 Error'));

   const event = {
     queries: [
       { Name: 'package1', Version: '1.0.0' }
     ]
   };

   const result = await postPackagesHandler(event);

   // Verify error handling
   expect(result.statusCode).toBe(400);
   expect(result.headers['Content-Type']).toBe('application/json');
   
   const body = JSON.parse(result.body);
   expect(body).toEqual({
     message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.'
   });
 });

 // Test version range handling
 test('handles version ranges correctly', async () => {
   // Mock packages with different versions
   const mockContents = [
     { Key: 'package1--1.2.3' },
     { Key: 'package1--1.2.9' },
     { Key: 'package1--1.3.0' }
   ];

   mockS3Send.mockResolvedValueOnce({ Contents: mockContents });

   const event = {
     queries: [
       { Name: 'package1', Version: '1.2.3-1.3.0' }
     ]
   };

   const result = await postPackagesHandler(event);

   // Verify version range filtering
   expect(result.statusCode).toBe(200);
   expect(result.headers['Content-Type']).toBe('application/json');

   const body = JSON.parse(result.body);
   expect(body.length).toBe(3);
 });
});