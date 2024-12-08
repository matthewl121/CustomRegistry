/**
* @fileoverview Test suite for Package Regex Search Lambda Handler
* @description Tests the functionality of searching packages by regex pattern in S3,
*              including error handling and edge cases for malformed data.
* 
* @test-coverage
* - Successful regex package searches
* - Malformed package key handling
* - Missing regex parameter handling
* - No matching packages handling
* - S3 error handling
*/

import { getPackageByRegexHandler } from '../../lambda/getPackageByRegex/index.mjs';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

describe('getPackageByRegexHandler', () => {
 // Initialize S3 mock client
 const s3Mock = mockClient(S3Client);

 // Reset mock before each test
 beforeEach(() => {
   s3Mock.reset();
 });

 // Helper function to validate CORS headers
 const validateHeaders = (headers) => {
   expect(headers).toEqual({
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type',
     'Content-Type': 'application/json'
   });
 };

 // Test successful package retrieval with regex matching
 test('successfully retrieves matching packages', async () => {
   // Mock S3 response with sample package keys
   s3Mock.on(ListObjectsV2Command).resolves({
     Contents: [
       { Key: 'underscore--1.2.3' },
       { Key: 'lodash--2.1.0' },
       { Key: 'react--1.2.0' }
     ]
   });

   const event = {
     RegEx: ".*"  // Match all packages
   };

   const result = await getPackageByRegexHandler(event);

   // Verify response status and headers
   expect(result.statusCode).toBe(200);
   validateHeaders(result.headers);

   // Verify parsed packages in response body
   const body = JSON.parse(result.body);
   expect(body).toEqual([
     {
       Version: "1.2.3",
       Name: "underscore",
       ID: "underscore--1.2.3"
     },
     {
       Version: "2.1.0",
       Name: "lodash",
       ID: "lodash--2.1.0"
     },
     {
       Version: "1.2.0",
       Name: "react",
       ID: "react--1.2.0"
     }
   ]);
 });

 // Test handling of malformed package keys in S3
 test('handles malformed keys in S3', async () => {
   // Mock S3 response with mix of valid and invalid keys
   s3Mock.on(ListObjectsV2Command).resolves({
     Contents: [
       { Key: 'validpackage--1.0.0' },
       { Key: 'malformed-key' },
       { Key: 'multiple--parts--present' }
     ]
   });

   const event = {
     RegEx: ".*"
   };

   const result = await getPackageByRegexHandler(event);
   expect(result.statusCode).toBe(200);
   validateHeaders(result.headers);

   // Verify valid package parsing
   const body = JSON.parse(result.body);
   expect(body).toContainEqual({
     Version: "1.0.0",
     Name: "validpackage",
     ID: "validpackage--1.0.0"
   });

   // Verify malformed package handling
   const malformedEntries = body.filter(entry => 
     entry.Version === "Unknown" && entry.Name === "Unknown"
   );
   expect(malformedEntries).toHaveLength(2);
   expect(malformedEntries[0]).toHaveProperty('Note', 'Unexpected key format');
 });

 // Test missing regex parameter error handling
 test('returns 400 when regex pattern is missing', async () => {
   const event = {};

   const result = await getPackageByRegexHandler(event);

   // Verify error response
   expect(result.statusCode).toBe(400);
   validateHeaders(result.headers);
   
   const body = JSON.parse(result.body);
   expect(body).toEqual({
     message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
   });
 });

 // Test no matching packages scenario
 test('returns 404 when no packages match the regex', async () => {
   // Mock S3 response with non-matching packages
   s3Mock.on(ListObjectsV2Command).resolves({
     Contents: [
       { Key: 'package1--1.0.0' },
       { Key: 'package2--2.0.0' }
     ]
   });

   const event = {
     RegEx: "^nonexistent$"
   };

   const result = await getPackageByRegexHandler(event);

   // Verify not found response
   expect(result.statusCode).toBe(404);
   validateHeaders(result.headers);
   
   const body = JSON.parse(result.body);
   expect(body).toEqual({
     message: "No package found under this regex."
   });
 });

 // Test S3 operation failure handling
 test('returns 400 when S3 operation fails', async () => {
   // Mock S3 operation failure
   s3Mock.on(ListObjectsV2Command).rejects(new Error('S3 Error'));

   const event = {
     RegEx: "valid"
   };

   const result = await getPackageByRegexHandler(event);

   // Verify error response
   expect(result.statusCode).toBe(400);
   validateHeaders(result.headers);
   
   const body = JSON.parse(result.body);
   expect(body).toEqual({
     message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid"
   });
 });
});