import { jest } from '@jest/globals';
import fs from 'fs';
import { S3Client } from "@aws-sdk/client-s3";
import { ratePackageHandler } from '../../lambda/ratePackage/index.mjs';

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  GetObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

// Mock the file system
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  // Create necessary test directories
  fs.mkdirSync('data', { recursive: true });
  
  // Mock console methods
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  
  // Clean up test directories
  fs.rmSync('data', { recursive: true, force: true });
});

describe('Rate Package Handler', () => {
  let mockS3Send;

  // Sample test data
  const mockValidNpmPackage = {
    Body: Buffer.from(JSON.stringify({
      repository: {
        url: 'https://github.com/username/repo'
      }
    }))
  };

  const mockValidMetrics = {
    URL: 'https://www.npmjs.com/package/lodash',
    NetScore: 0.5913091753722012,
    RampUp: 0.5,
    Correctness: 0.9820303383897316,
    BusFactor: 0.05404053109323459,
    ResponsiveMaintainer: 0.1,
    License: 1,
    DependencyPinning: 1,
    CodeReview: 0.9999348455612131
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
    
    // Reset console mocks
    console.log.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    console.info.mockClear();
    
    // Mock fs.existsSync to return true for data directory
    fs.existsSync.mockImplementation((path) => path === 'data');
  });

  test('should handle NPM package successfully', async () => {
    // Mock S3 responses
    mockS3Send
      .mockResolvedValueOnce({}) // HEAD request
      .mockResolvedValueOnce(mockValidNpmPackage) // GET request
      .mockResolvedValueOnce(mockValidMetrics); // Custom Registry response

    const event = {
      pathParameters: {
        id: 'lodash@4.17.21'
      }
    };

    const result = await ratePackageHandler(event);
    
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.URL).toBeDefined();
    expect(body.NetScore).toBeGreaterThan(0);
  }, 60000); // Increased timeout

  test('should handle GitHub package successfully', async () => {
    const mockGitHubPackage = {
      Body: Buffer.from(JSON.stringify({
        repository: {
          url: 'https://github.com/username/repo'
        }
      }))
    };

    mockS3Send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(mockGitHubPackage)
      .mockResolvedValueOnce(mockValidMetrics);

    const event = {
      pathParameters: {
        id: 'cloudinary-npm-2.5.1'
      }
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(200);
  }, 60000);

  test('should handle zip file content package successfully', async () => {
    const mockZipContent = Buffer.from('mock zip content');
    mockS3Send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Body: mockZipContent })
      .mockResolvedValueOnce(mockValidMetrics);

    const event = {
      pathParameters: {
        id: 'test-package.zip'
      }
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(200);
  }, 60000);

  test('should handle invalid URL in zip content', async () => {
    const mockInvalidZipContent = Buffer.from('invalid zip content');
    mockS3Send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Body: mockInvalidZipContent });

    const event = {
      pathParameters: {
        id: 'invalid-package.zip'
      }
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(400);
  });

  test('should handle gzip extraction failure gracefully', async () => {
    mockS3Send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Body: Buffer.from('invalid gzip content')
      });

    const event = {
      pathParameters: {
        id: 'test-package@1.0.0'
      }
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBeDefined();
  });

  test('should return 404 for non-existent package', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('NoSuchKey'));

    const event = {
      pathParameters: {
        id: 'non-existent-package@1.0.0'
      }
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(404);
  });

  test('should handle missing package ID', async () => {
    const event = {
      pathParameters: {}
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBeDefined();
  });

  test('should handle Custom Registry program failure', async () => {
    mockS3Send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(mockValidNpmPackage)
      .mockRejectedValueOnce(new Error('Custom Registry failed'));

    const event = {
      pathParameters: {
        id: 'failing-package@1.0.0'
      }
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBeDefined();
  });

  test('should handle malformed package metadata', async () => {
    const mockMalformedPackage = {
      Body: Buffer.from('not json content')
    };

    mockS3Send
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(mockMalformedPackage);

    const event = {
      pathParameters: {
        id: 'malformed-package@1.0.0'
      }
    };

    const result = await ratePackageHandler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBeDefined();
  });
});