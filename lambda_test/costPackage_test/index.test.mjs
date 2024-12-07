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

const runTests = () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it('t1', async () => {
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
    const d = JSON.parse(r.body);
    const i = d["cloudinary_npm--2.5.1"];
    expect(i).toBeDefined();
    expect(typeof i.standaloneCost).toBe('number');
    expect(typeof i.totalCost).toBe('number');
  });

  it('t2', async () => {
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576,
      Metadata: { uploadvia: 'content' }
    });

    const r = await packageCostHandler({
      id: "cloudinary_npm--2.5.1",
      dependency: false
    });

    expect(r.statusCode).toBe(200);
    const d = JSON.parse(r.body);
    const i = d["cloudinary_npm--2.5.1"];
    expect(i).toBeDefined();
    expect(typeof i.totalCost).toBe('number');
    expect(i.totalCost).toBe(1);
  });

  it('t3', async () => {
    s3Mock.on(HeadObjectCommand).rejects(new Error('NoSuchKey'));

    const r = await packageCostHandler({
      id: "nonexistent-item--1.0.0",
      dependency: true
    });

    expect(r.statusCode).toBe(404);
    const d = JSON.parse(r.body);
    expect(d.message).toBe("Package does not exist.");
  });

  it('t4', async () => {
    const r = await packageCostHandler({
      id: "../invalid/id/format",
      dependency: true
    });

    expect(r.statusCode).toBe(400);
    const d = JSON.parse(r.body);
    expect(d.message).toBe("There is missing field(s) in the PackageID");
  });

  it('t5', async () => {
    const r = await packageCostHandler({
      dependency: true
    });

    expect(r.statusCode).toBe(400);
    const d = JSON.parse(r.body);
    expect(d.message).toBe("There is missing field(s) in the PackageID");
  });

  it('t6', async () => {
    s3Mock.on(HeadObjectCommand).resolves({
      ContentLength: 1048576,
      Metadata: { uploadvia: 'content' }
    });

    const r = await packageCostHandler({
      id: "cloudinary_npm--2.5.1"
    });

    expect(r.statusCode).toBe(200);
    const d = JSON.parse(r.body);
    const i = d["cloudinary_npm--2.5.1"];
    expect(i).toBeDefined();
    expect(typeof i.totalCost).toBe('number');
  });
};

describe('tests', runTests);

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
