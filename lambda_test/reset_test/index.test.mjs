/**
* @fileoverview Test Suite for Registry Reset Lambda Handler
* @description Tests the functionality of resetting (deleting all packages from) the package registry,
*              including success cases, error handling, and empty registry scenarios.
* 
* @test-coverage
* - Successful registry reset
* - Empty registry handling
* - Delete operation failures
* - S3 error handling
*/

import { jest } from '@jest/globals';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { resetRegistryHandler } from '../../lambda/resetRegistry/index.mjs';

// Mock AWS S3 client
jest.mock("@aws-sdk/client-s3", () => ({
 S3Client: jest.fn(() => ({
   send: jest.fn()
 })),
 ListObjectsV2Command: jest.fn(),
 DeleteObjectsCommand: jest.fn()
}));

describe('resetRegistryHandler', () => {
 let mockS3Send;

 // Reset mocks before each test
 beforeEach(() => {
   jest.clearAllMocks();
   mockS3Send = jest.fn();
   S3Client.prototype.send = mockS3Send;
 });

 // Sample mock data for testing
 const mockPackages = [
   { Key: 'package1.zip' },
   { Key: 'package2.zip' },
   { Key: 'package3.zip' }
 ];

 // Test successful registry reset
 test('/reset | DELETE | Successful', async () => {
   // Mock S3 list and delete operations
   mockS3Send.mockImplementation((command) => {
     if (command instanceof ListObjectsV2Command) {
       return Promise.resolve({
         Contents: mockPackages,
         IsTruncated: false
       });
     }
     if (command instanceof DeleteObjectsCommand) {
       return Promise.resolve({
         Deleted: mockPackages.map(pkg => ({ Key: pkg.Key })),
         Errors: []
       });
     }
   });

   const result = await resetRegistryHandler();

   // Verify successful response
   expect(result.statusCode).toBe(200);

   // Verify S3 operations were called correctly
   const listCalls = mockS3Send.mock.calls.filter(
     ([command]) => command instanceof ListObjectsV2Command
   );
   const deleteCalls = mockS3Send.mock.calls.filter(
     ([command]) => command instanceof DeleteObjectsCommand
   );

   expect(listCalls).toHaveLength(1);
   expect(deleteCalls).toHaveLength(1);

   // Verify delete command parameters
   expect(deleteCalls[0][0].input).toEqual({
     Bucket: 'acmeregistrys3',
     Delete: {
       Objects: mockPackages,
       Quiet: false
     }
   });
 });

 // Test unsuccessful registry reset
 test('/reset | DELETE | Unsuccessful', async () => {
   // Mock S3 operations with errors
   mockS3Send.mockImplementation((command) => {
     if (command instanceof ListObjectsV2Command) {
       return Promise.resolve({
         Contents: mockPackages,
         IsTruncated: false
       });
     }
     if (command instanceof DeleteObjectsCommand) {
       return Promise.resolve({
         Deleted: [],
         Errors: [{ Key: 'package1.zip', Message: 'Access Denied' }]
       });
     }
   });

   const result = await resetRegistryHandler();

   // Verify error response
   expect(result.statusCode).toBe(500);

   // Verify S3 operations were attempted
   const listCalls = mockS3Send.mock.calls.filter(
     ([command]) => command instanceof ListObjectsV2Command
   );
   const deleteCalls = mockS3Send.mock.calls.filter(
     ([command]) => command instanceof DeleteObjectsCommand
   );

   expect(listCalls).toHaveLength(1);
   expect(deleteCalls).toHaveLength(1);

   // Verify delete command parameters
   expect(deleteCalls[0][0].input).toEqual({
     Bucket: 'acmeregistrys3',
     Delete: {
       Objects: mockPackages,
       Quiet: false
     }
   });
 });

 // Test empty registry handling
 test('successfully handles empty registry', async () => {
   mockS3Send.mockImplementation((command) => {
     if (command instanceof ListObjectsV2Command) {
       return Promise.resolve({
         Contents: [],
         IsTruncated: false
       });
     }
   });

   const result = await resetRegistryHandler();

   expect(result.statusCode).toBe(200);
   expect(mockS3Send).toHaveBeenCalledTimes(1);
 });

 // Print test summary
 afterAll(() => {
   console.log('\n==== Test Records ====');
   console.log('/reset | DELETE | Successful');
   console.log('/reset | DELETE | Unsuccessful');
   console.log('====================\n');
 });
});