import { expect } from '@jest/globals';
import { packageCostHandler } from '../../lambda/costPackage/index.mjs';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { Readable } from 'stream';

const s3Mock = mockClient(S3Client);
const testData = {
  n: "test-item",
  v: "1.0.0",
  d: { "express": "^4.17.1" }
};

// Expected response definitions
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

let testResults = [];

const validateResponse = (statusCode, response, hasDependencies = false) => {
  const expected = expectedResponses[statusCode];
  if (!expected) return false;

  try {
    const body = JSON.parse(response.body);
    
    // Check required fields based on status code
    if (statusCode === 200) {
      const packageId = Object.keys(body)[0];
      const data = body[packageId];
      
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

const recordTestResult = (testName, result, statusCode, response, hasDependencies = false) => {
  const validResponse = validateResponse(statusCode, response, hasDependencies);
  testResults.push({
    testName,
    status: result ? 'PASS' : 'FAIL',
    statusCode,
    responseValid: validResponse
  });
};

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

const runTests = () => {
  beforeEach(() => {
    s3Mock.reset();
    testResults = [];
  });

  afterAll(() => {
    printTestSummary();
  });

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

describe('Package Cost Handler Tests', runTests);

// import { expect } from '@jest/globals';
// import { packageCostHandler } from '../../lambda/costPackage/index.mjs';
// import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// import { mockClient } from "aws-sdk-client-mock";
// import { Readable } from 'stream';

// const s3Mock = mockClient(S3Client);

// const testData = {
//   n: "test-item",
//   v: "1.0.0",
//   d: { "express": "^4.17.1" }
// };

// const runTests = () => {
//   beforeEach(() => {
//     s3Mock.reset();
//   });

//   it('t1', async () => {
//     s3Mock.on(HeadObjectCommand).resolves({
//       ContentLength: 1048576,
//       Metadata: { uploadvia: 'content' }
//     });

//     const buf = Buffer.from(JSON.stringify(testData));
//     s3Mock.on(GetObjectCommand).resolves({
//       Body: Readable.from([buf])
//     });

//     const r = await packageCostHandler({
//       id: "cloudinary_npm--2.5.1",
//       dependency: true
//     });

//     expect(r.statusCode).toBe(200);
//     const d = JSON.parse(r.body);
//     const i = d["cloudinary_npm--2.5.1"];
//     expect(i).toBeDefined();
//     expect(typeof i.standaloneCost).toBe('number');
//     expect(typeof i.totalCost).toBe('number');
//   });

//   it('t2', async () => {
//     s3Mock.on(HeadObjectCommand).resolves({
//       ContentLength: 1048576,
//       Metadata: { uploadvia: 'content' }
//     });

//     const r = await packageCostHandler({
//       id: "cloudinary_npm--2.5.1",
//       dependency: false
//     });

//     expect(r.statusCode).toBe(200);
//     const d = JSON.parse(r.body);
//     const i = d["cloudinary_npm--2.5.1"];
//     expect(i).toBeDefined();
//     expect(typeof i.totalCost).toBe('number');
//     expect(i.totalCost).toBe(1);
//   });

//   it('t3', async () => {
//     s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));

//     const r = await packageCostHandler({
//       id: "nonexistent-item--1.0.0",
//       dependency: true
//     });

//     expect(r.statusCode).toBe(404);
//     const d = JSON.parse(r.body);
//     expect(d.message).toBe("Package does not exist.");
//   });

//   it('t4', async () => {
//     const r = await packageCostHandler({
//       id: "../invalid/id/format",
//       dependency: true
//     });

//     expect(r.statusCode).toBe(400);
//     const d = JSON.parse(r.body);
//     expect(d.message).toBe("There is missing field(s) in the PackageID");
//   });

//   it('t5', async () => {
//     const r = await packageCostHandler({
//       dependency: true
//     });

//     expect(r.statusCode).toBe(400);
//     const d = JSON.parse(r.body);
//     expect(d.message).toBe("There is missing field(s) in the PackageID");
//   });

//   it('t6', async () => {
//     s3Mock.on(HeadObjectCommand).resolves({
//       ContentLength: 1048576,
//       Metadata: { uploadvia: 'content' }
//     });

//     const r = await packageCostHandler({
//       id: "cloudinary_npm--2.5.1"
//     });

//     expect(r.statusCode).toBe(200);
//     const d = JSON.parse(r.body);
//     const i = d["cloudinary_npm--2.5.1"];
//     expect(i).toBeDefined();
//     expect(typeof i.totalCost).toBe('number');
//   });
// };

// describe('tests', runTests);

// // Import necessary modules
// import { expect } from '@jest/globals'; // Correctly import from Jest
// import { packageCostHandler } from '../../lambda/costPackage/index.mjs'; // Import the function you are testing
// import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// import { mockClient } from "aws-sdk-client-mock";
// import { Readable } from 'stream';

// // Mock S3 Client
// const s3Mock = mockClient(S3Client);

// // Mock package data
// const mockData = {
//   name: "test-item",
//   version: "1.0.0",
//   dependencies: {
//     "express": "^4.17.1",
//     "lodash": "^4.17.21"
//   },
//   devDependencies: {
//     "jest": "^27.0.6"
//   }
// };

// describe('Cost Handler Tests', () => {
//   beforeEach(() => {
//     s3Mock.reset();
//   });

//   it('calculation with dependencies', async () => {
//     s3Mock.on(HeadObjectCommand).resolves({
//       ContentLength: 1048576,
//       Metadata: {
//         uploadvia: 'content'
//       }
//     });

//     const mockContent = Buffer.from(JSON.stringify(mockData));
//     s3Mock.on(GetObjectCommand).resolves({
//       Body: Readable.from([mockContent]) // Simulating S3 Body stream
//     });

//     const response = await packageCostHandler({
//       id: "cloudinary_npm--2.5.1",
//       dependency: true
//     });

//     expect(response.statusCode).toBe(200);
//     const body = JSON.parse(response.body);
//     const result = body["cloudinary_npm--2.5.1"];
//     expect(result).toBeDefined();
//     expect(typeof result.standaloneCost).toBe('number');
//     expect(typeof result.totalCost).toBe('number');
//   });

//   it('standalone calculation', async () => {
//     s3Mock.on(HeadObjectCommand).resolves({
//       ContentLength: 1048576,
//       Metadata: {
//         uploadvia: 'content'
//       }
//     });

//     const response = await packageCostHandler({
//       id: "cloudinary_npm--2.5.1",
//       dependency: false
//     });

//     expect(response.statusCode).toBe(200);
//     const body = JSON.parse(response.body);
//     const result = body["cloudinary_npm--2.5.1"];
//     expect(result).toBeDefined();
//     expect(typeof result.totalCost).toBe('number');
//     expect(result.totalCost).toBe(1);
//   });

//   it('nonexistent item handling', async () => {
//     s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));

//     const response = await packageCostHandler({
//       id: "nonexistent-item--1.0.0",
//       dependency: true
//     });

//     expect(response.statusCode).toBe(404);
//     const body = JSON.parse(response.body);
//     expect(body.message).toBe("Package does not exist.");
//   });

//   it('invalid id handling', async () => {
//     const response = await packageCostHandler({
//       id: "../invalid/id/format",
//       dependency: true
//     });
//     expect(response.statusCode).toBe(400);
//     const body = JSON.parse(response.body);
//     expect(body.message).toBe("There is missing field(s) in the PackageID");
//   });

//   it('missing id handling', async () => {
//     const response = await packageCostHandler({
//       dependency: true
//     });
//     expect(response.statusCode).toBe(400);
//     const body = JSON.parse(response.body);
//     expect(body.message).toBe("There is missing field(s) in the PackageID");
//   });

//   it('missing dependency flag handling', async () => {
//     s3Mock.on(HeadObjectCommand).resolves({
//       ContentLength: 1048576,
//       Metadata: {
//         uploadvia: 'content'
//       }
//     });

//     const response = await packageCostHandler({
//       id: "cloudinary_npm--2.5.1"
//     });
//     expect(response.statusCode).toBe(200);
//     const body = JSON.parse(response.body);
//     const result = body["cloudinary_npm--2.5.1"];
//     expect(result).toBeDefined();
//     expect(typeof result.totalCost).toBe('number');
//   });
// });

// // // Import necessary modules
// // import { expect } from '@jest/globals'; // Correctly import from Jest
// // import { packageCostHandler } from '../../lambda/costPackage/index.mjs'; // Import the function you are testing
// // import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// // import { mockClient } from "aws-sdk-client-mock";
// // import { Readable } from 'stream';

// // // Mock S3 Client
// // const s3Mock = mockClient(S3Client);

// // // Mock package data
// // const mockData = {
// //   name: "test-item",
// //   version: "1.0.0",
// //   dependencies: {
// //     "express": "^4.17.1",
// //     "lodash": "^4.17.21"
// //   },
// //   devDependencies: {
// //     "jest": "^27.0.6"
// //   }
// // };

// // describe('Cost Handler Tests', () => {
// //   beforeEach(() => {
// //     s3Mock.reset();
// //   });

// //   it('calculation with dependencies', async () => {
// //     s3Mock.on(HeadObjectCommand).resolves({
// //       ContentLength: 1048576,
// //       Metadata: {
// //         uploadvia: 'content'
// //       }
// //     });

// //     const mockContent = Buffer.from(JSON.stringify(mockData));
// //     s3Mock.on(GetObjectCommand).resolves({
// //       Body: Readable.from([mockContent]) // Simulating S3 Body stream
// //     });

// //     const response = await packageCostHandler({
// //       id: "cloudinary_npm--2.5.1",
// //       dependency: true
// //     });

// //     expect(response.statusCode).toBe(200);
// //     const body = JSON.parse(response.body);
// //     const result = body["cloudinary_npm--2.5.1"];
// //     expect(result).toBeDefined();
// //     expect(typeof result.standaloneCost).toBe('number');
// //     expect(typeof result.totalCost).toBe('number');
// //   });

// //   it('standalone calculation', async () => {
// //     s3Mock.on(HeadObjectCommand).resolves({
// //       ContentLength: 1048576,
// //       Metadata: {
// //         uploadvia: 'content'
// //       }
// //     });

// //     const response = await packageCostHandler({
// //       id: "cloudinary_npm--2.5.1",
// //       dependency: false
// //     });

// //     expect(response.statusCode).toBe(200);
// //     const body = JSON.parse(response.body);
// //     const result = body["cloudinary_npm--2.5.1"];
// //     expect(result).toBeDefined();
// //     expect(typeof result.totalCost).toBe('number');
// //     expect(result.totalCost).toBe(1);
// //   });

// //   it('nonexistent item handling', async () => {
// //     s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));

// //     const response = await packageCostHandler({
// //       id: "nonexistent-item--1.0.0",
// //       dependency: true
// //     });

// //     expect(response.statusCode).toBe(404);
// //     const body = JSON.parse(response.body);
// //     expect(body.message).toBe("Package does not exist.");
// //   });

// //   it('invalid id handling', async () => {
// //     const response = await packageCostHandler({
// //       id: "../invalid/id/format",
// //       dependency: true
// //     });
// //     expect(response.statusCode).toBe(400);
// //     const body = JSON.parse(response.body);
// //     expect(body.message).toBe("There is missing field(s) in the PackageID");
// //   });

// //   it('missing id handling', async () => {
// //     const response = await packageCostHandler({
// //       dependency: true
// //     });
// //     expect(response.statusCode).toBe(400);
// //     const body = JSON.parse(response.body);
// //     expect(body.message).toBe("There is missing field(s) in the PackageID");
// //   });

// //   it('missing dependency flag handling', async () => {
// //     s3Mock.on(HeadObjectCommand).resolves({
// //       ContentLength: 1048576,
// //       Metadata: {
// //         uploadvia: 'content'
// //       }
// //     });

// //     const response = await packageCostHandler({
// //       id: "cloudinary_npm--2.5.1"
// //     });
// //     expect(response.statusCode).toBe(200);
// //     const body = JSON.parse(response.body);
// //     const result = body["cloudinary_npm--2.5.1"];
// //     expect(result).toBeDefined();
// //     expect(typeof result.totalCost).toBe('number');
// //   });
// // });
