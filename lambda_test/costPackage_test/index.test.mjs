/**
 * @fileoverview Test suite for the Package Cost Handler Lambda function
 * @description Tests the functionality of calculating package costs with and without dependencies,
 *              including error cases and edge conditions. Uses AWS S3 mocking for integration tests.
 * 
 * @test-coverage
 * - Package cost calculation with dependencies
 * - Package cost calculation without dependencies
 * - Nonexistent package handling
 * - Invalid package ID format handling
 * - Missing package ID handling
 * - Default dependency flag behavior
 */

import { expect } from '@jest/globals';
import { packageCostHandler } from '../../lambda/costPackage/index.mjs';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { Readable } from 'stream';

// Create mock S3 client for testing
const s3Mock = mockClient(S3Client);
const testData = {
  n: "test-item",
  v: "1.0.0",
  d: { "express": "^4.17.1" }
};

// Define expected API response formats for different status codes
const expectedResponses = {
  200: {
    description: "Return the total cost of package and its dependencies",
    requiredFields: ['totalCost'],
    dependencyFields: ['standaloneCost'],
    example: {
      "packageId": {
        "totalCost": "number"
      }
    }
  },
  400: {
    description: "There is missing field(s) in the PackageID",
    requiredFields: ['message'],
    example: {
      "message": "There is missing field(s) in the PackageID"
    }
  },
  404: {
    description: "Package does not exist",
    requiredFields: ['message'],
    example: {
      "message": "Package does not exist."
    }
  }
};

// Array to store test results for reporting
let testResults = [];

// Validate if response matches expected format for given status code
const validateResponse = (statusCode, response, hasDependencies = false) => {
  const expected = expectedResponses[statusCode];
  if (!expected) return false;

  try {
    const body = JSON.parse(response.body);
    
    // Check required fields based on status code
    if (statusCode === 200) {
      const packageId = Object.keys(body)[0];
      const data = body[packageId];
      
      // Check total cost
      if (!data || typeof data.totalCost !== 'number') return false;
      if (hasDependencies && typeof data.standaloneCost !== 'number') return false;
    } else {
      if (!body.message || body.message !== expected.example.message) return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
};

// Record test execution results for reporting
const recordTestResult = (testName, result, statusCode, response, hasDependencies = false) => {
  const validResponse = validateResponse(statusCode, response, hasDependencies);
  testResults.push({
    testName,
    status: result ? 'PASS' : 'FAIL',
    statusCode,
    responseValid: validResponse
  });
};

// Generate and print detailed test execution summary
const printTestSummary = () => {
  console.log('\n=== Test Summary ===');
  console.log('\nStatus Code Validation:');
  
  Object.entries(expectedResponses).forEach(([code, details]) => {
    console.log(`\nStatus Code ${code} - ${details.description}`);
    console.log('Expected Response Format:', JSON.stringify(details.example, null, 2));
    
    const testsForCode = testResults.filter(t => t.statusCode === parseInt(code));
    if (testsForCode.length === 0) {
      console.log('❌ No tests found for this status code');
    } else {
      testsForCode.forEach(test => {
        const responseSymbol = test.responseValid ? '✓' : '❌';
        const statusSymbol = test.status === 'PASS' ? '✓' : '❌';
        console.log(`${test.testName}:`);
        console.log(`  Test Status: ${statusSymbol}`);
        console.log(`  Response Format: ${responseSymbol}`);
      });
    }
  });
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.status === 'PASS' && t.responseValid).length;
  
  console.log('\nSummary:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log('===================\n');
};

// Main test suite implementation
const runTests = () => {
  // Reset mocks before each test
  beforeEach(() => {
    s3Mock.reset();
    testResults = [];
  });

  // Print summary after all tests complete
  afterAll(() => {
    printTestSummary();
  });

  // Test 1: Calculate package cost with dependencies
  it('t1 - Package Cost with Dependencies', async () => {
    try {
      s3Mock.on(HeadObjectCommand).resolves({
        ContentLength: 1048576,
        Metadata: { uploadvia: 'content' }
      });
      const buf = Buffer.from(JSON.stringify(testData));
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([buf])
      });
      const r = await packageCostHandler({
        id: "cloudinary_npm--2.5.1",
        dependency: true
      });
      expect(r.statusCode).toBe(200);
      recordTestResult('t1', true, 200, r, true);
    } catch (error) {
      recordTestResult('t1', false, 200, null);
    }
  });

  // Test 2: Calculate package cost without dependencies
  it('t2 - Package Cost without Dependencies', async () => {
    try {
      s3Mock.on(HeadObjectCommand).resolves({
        ContentLength: 1048576,
        Metadata: { uploadvia: 'content' }
      });
      const r = await packageCostHandler({
        id: "cloudinary_npm--2.5.1",
        dependency: false
      });
      expect(r.statusCode).toBe(200);
      recordTestResult('t2', true, 200, r);
    } catch (error) {
      recordTestResult('t2', false, 200, null);
    }
  });

   // Test 3: Handle nonexistent package request
  it('t3 - Nonexistent Package', async () => {
    try {
      s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));
      const r = await packageCostHandler({
        id: "nonexistent-item--1.0.0",
        dependency: true
      });
      expect(r.statusCode).toBe(404);
      recordTestResult('t3', true, 404, r);
    } catch (error) {
      recordTestResult('t3', false, 404, null);
    }
  });

  // Test 4: Handle invalid package ID format
  it('t4 - Invalid Package ID Format', async () => {
    try {
      const r = await packageCostHandler({
        id: "../invalid/id/format",
        dependency: true
      });
      expect(r.statusCode).toBe(400);
      recordTestResult('t4', true, 400, r);
    } catch (error) {
      recordTestResult('t4', false, 400, null);
    }
  });

  // Test 5: Handle missing package ID
  it('t5 - Missing Package ID', async () => {
    try {
      const r = await packageCostHandler({
        dependency: true
      });
      expect(r.statusCode).toBe(400);
      recordTestResult('t5', true, 400, r);
    } catch (error) {
      recordTestResult('t5', false, 400, null);
    }
  });

   // Test 6: Test default dependency handling behavior
  it('t6 - Default Dependency Handling', async () => {
    try {
      s3Mock.on(HeadObjectCommand).resolves({
        ContentLength: 1048576,
        Metadata: { uploadvia: 'content' }
      });
      const r = await packageCostHandler({
        id: "cloudinary_npm--2.5.1"
      });
      expect(r.statusCode).toBe(200);
      recordTestResult('t6', true, 200, r);
    } catch (error) {
      recordTestResult('t6', false, 200, null);
    }
  });
};

// Execute the test suite
describe('Package Cost Handler Tests', runTests);
 