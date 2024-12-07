import { jest } from '@jest/globals';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { uploadPackageHandler } from "../../lambda/upload/index.mjs";
import { ratePackageHandler } from "../../lambda/ratePackage/index.mjs";

// Mocking the required AWS SDK components
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
}));

jest.mock("../../lambda/ratePackage/index.mjs");

describe("uploadPackageHandler", () => {
  let sendMock;

  beforeEach(() => {
    // Setup the mock for S3Client send method
    sendMock = jest.fn();
    S3Client.mockImplementation(() => ({
      send: sendMock,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should upload a package and return a successful response", async () => {
    // Mock the send method for different commands
    sendMock.mockImplementation((command) => {
      if (command instanceof PutObjectCommand) {
        return { ETag: '"mock-etag"' }; // Simulate a successful upload
      }
      if (command instanceof ListObjectsV2Command) {
        return { Contents: [] }; // Simulate no existing objects
      }
      return {};
    });

    // Mock ratePackageHandler
    ratePackageHandler.mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ NetScore: 0.5 }), // Simulate a good rating
    });

    const mockEvent = {
      Content: Buffer.from("mock-content").toString("base64"),
      Name: "mock-package",
    };

    const response = await uploadPackageHandler(mockEvent);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).metadata.Name).toBe("mock-package");
    expect(sendMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  it("should delete existing versions if debloat is true", async () => {
    // Mock the send method for different commands
    sendMock.mockImplementation((command) => {
      if (command instanceof ListObjectsV2Command) {
        return {
          Contents: [{ Key: "mock-package--1.0.0" }],
          IsTruncated: false,
        };
      }
      if (command instanceof DeleteObjectsCommand) {
        return {}; // Simulate successful deletion
      }
      if (command instanceof PutObjectCommand) {
        return { ETag: '"mock-etag"' }; // Simulate successful upload
      }
      return {};
    });

    // Mock ratePackageHandler
    ratePackageHandler.mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ NetScore: 0.8 }), // Simulate a good rating
    });

    const mockEvent = {
      Content: Buffer.from("mock-content").toString("base64"),
      Name: "mock-package",
      debloat: "true",
    };

    const response = await uploadPackageHandler(mockEvent);

    expect(response.statusCode).toBe(201);
    expect(sendMock).toHaveBeenCalledWith(expect.any(DeleteObjectsCommand));
    expect(sendMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  it("should return a conflict error if the package already exists", async () => {
    sendMock.mockImplementation((command) => {
      if (command instanceof ListObjectsV2Command) {
        return { Contents: [{ Key: "mock-package--1.0.0" }] }; // Simulate existing object
      }
      return {};
    });

    const mockEvent = {
      Content: Buffer.from("mock-content").toString("base64"),
      Name: "mock-package",
    };

    const response = await uploadPackageHandler(mockEvent);

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body).message).toBe("Package exists already.");
  });

  it("should return an error if the package rating is disqualified", async () => {
    // Mock S3 send responses
    sendMock.mockImplementation((command) => {
      if (command instanceof ListObjectsV2Command) {
        return { Contents: [] }; // Simulate no existing objects
      }
      if (command instanceof PutObjectCommand) {
        return { ETag: '"mock-etag"' }; // Simulate successful upload
      }
      if (command instanceof DeleteObjectsCommand) {
        return {}; // Simulate successful deletion
      }
      return {};
    });

    // Mock ratePackageHandler
    ratePackageHandler.mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ NetScore: 0.1 }), // Simulate a low score
    });

    const mockEvent = {
      Content: Buffer.from("mock-content").toString("base64"),
      Name: "mock-package",
    };

    const response = await uploadPackageHandler(mockEvent);

    expect(response.statusCode).toBe(424);
    expect(JSON.parse(response.body).message).toBe(
      "Package is not uploaded due to the disqualified rating."
    );
  });
});


// import { jest } from '@jest/globals';
// import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
// import { uploadPackageHandler } from "../../lambda/upload/index.mjs";
// import { ratePackageHandler } from "../../lambda/ratePackage/index.mjs";

// jest.mock("@aws-sdk/client-s3");
// jest.mock("../../lambda/ratePackage/index.mjs");

// describe("uploadPackageHandler", () => {
//   let sendMock;

//   beforeEach(() => {
//     // Mock S3Client send method
//     sendMock = jest.fn();
//     S3Client.mockImplementation(() => ({
//       send: sendMock,
//     }));
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it("should upload a package and return a successful response", async () => {
//     // Mock S3 send responses
//     sendMock.mockImplementation((command) => {
//       if (command instanceof PutObjectCommand) {
//         return { ETag: '"mock-etag"' }; // Simulate a successful upload
//       }
//       if (command instanceof ListObjectsV2Command) {
//         return { Contents: [] }; // Simulate no existing objects
//       }
//       return {};
//     });

//     // Mock ratePackageHandler
//     ratePackageHandler.mockResolvedValue({
//       statusCode: 200,
//       body: JSON.stringify({ NetScore: 0.5 }), // Simulate a good rating
//     });

//     const mockEvent = {
//       Content: Buffer.from("mock-content").toString("base64"),
//       Name: "mock-package",
//     };

//     const response = await uploadPackageHandler(mockEvent);

//     expect(response.statusCode).toBe(201);
//     expect(JSON.parse(response.body).metadata.Name).toBe("mock-package");
//     expect(sendMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
//   });

//   it("should delete existing versions if debloat is true", async () => {
//     // Mock S3 send responses
//     sendMock.mockImplementation((command) => {
//       if (command instanceof ListObjectsV2Command) {
//         return {
//           Contents: [{ Key: "mock-package--1.0.0" }],
//           IsTruncated: false,
//         };
//       }
//       if (command instanceof DeleteObjectsCommand) {
//         return {}; // Simulate successful deletion
//       }
//       if (command instanceof PutObjectCommand) {
//         return { ETag: '"mock-etag"' }; // Simulate successful upload
//       }
//       return {};
//     });

//     // Mock ratePackageHandler
//     ratePackageHandler.mockResolvedValue({
//       statusCode: 200,
//       body: JSON.stringify({ NetScore: 0.8 }), // Simulate a good rating
//     });

//     const mockEvent = {
//       Content: Buffer.from("mock-content").toString("base64"),
//       Name: "mock-package",
//       debloat: "true",
//     };

//     const response = await uploadPackageHandler(mockEvent);

//     expect(response.statusCode).toBe(201);
//     expect(sendMock).toHaveBeenCalledWith(expect.any(DeleteObjectsCommand));
//     expect(sendMock).toHaveBeenCalledWith(expect.any(PutObjectCommand));
//   });

//   it("should return a conflict error if the package already exists", async () => {
//     sendMock.mockImplementation((command) => {
//       if (command instanceof ListObjectsV2Command) {
//         return { Contents: [{ Key: "mock-package--1.0.0" }] }; // Simulate existing object
//       }
//       return {};
//     });

//     const mockEvent = {
//       Content: Buffer.from("mock-content").toString("base64"),
//       Name: "mock-package",
//     };

//     const response = await uploadPackageHandler(mockEvent);

//     expect(response.statusCode).toBe(409);
//     expect(JSON.parse(response.body).message).toBe("Package exists already.");
//   });

//   it("should return an error if the package rating is disqualified", async () => {
//     // Mock S3 send responses
//     sendMock.mockImplementation((command) => {
//       if (command instanceof ListObjectsV2Command) {
//         return { Contents: [] }; // Simulate no existing objects
//       }
//       if (command instanceof PutObjectCommand) {
//         return { ETag: '"mock-etag"' }; // Simulate successful upload
//       }
//       if (command instanceof DeleteObjectsCommand) {
//         return {}; // Simulate successful deletion
//       }
//       return {};
//     });

//     // Mock ratePackageHandler
//     ratePackageHandler.mockResolvedValue({
//       statusCode: 200,
//       body: JSON.stringify({ NetScore: 0.1 }), // Simulate a low score
//     });

//     const mockEvent = {
//       Content: Buffer.from("mock-content").toString("base64"),
//       Name: "mock-package",
//     };

//     const response = await uploadPackageHandler(mockEvent);

//     expect(response.statusCode).toBe(424);
//     expect(JSON.parse(response.body).message).toBe(
//       "Package is not uploaded due to the disqualified rating."
//     );
//   });
// });