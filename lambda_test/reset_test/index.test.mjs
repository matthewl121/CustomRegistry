import { jest } from '@jest/globals';
import { S3Client, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { resetRegistryHandler } from '../../lambda/resetRegistry/index.mjs';

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  GetObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
}));

describe('resetRegistryHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  const mockPackages = [
    { Key: 'package1.zip' },
    { Key: 'package2.zip' },
    { Key: 'package3.zip' },
  ];

  const setupMockS3WithPackages = () => {
    // Mock ListObjectsV2Command to return the packages
    mockS3Send.mockImplementation((command) => {
      if (command instanceof ListObjectsV2Command) {
        return Promise.resolve({ Contents: mockPackages });
      }
      if (command instanceof DeleteObjectCommand) {
        return Promise.resolve({}); // Mock successful deletion
      }
      throw new Error(`Unhandled command: ${command}`);
    });
  };

  test('successfully resets the registry by deleting all packages', async () => {
    setupMockS3WithPackages();

    const result = await resetRegistryHandler();

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('All objects have been successfully deleted from bucket acmeregistrys3');

    // Verify that ListObjectsV2Command was called to retrieve the list of packages
    expect(mockS3Send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
    
    // Verify that DeleteObjectCommand was called for each package
    mockPackages.forEach((pkg) => {
      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { Bucket: 'acmeregistrys3', Key: pkg.Key },
        })
      );
    });

    // Verify that the total number of delete calls matches the number of packages
    const deleteCalls = mockS3Send.mock.calls.filter(
      ([command]) => command instanceof DeleteObjectCommand
    );
    expect(deleteCalls).toHaveLength(mockPackages.length);
  });

  test('successfully resets the empty registry', async () => {

    const result = await resetRegistryHandler();

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('Bucket is already empty.');

    // Verify that ListObjectsV2Command was called to retrieve the list of packages
    expect(mockS3Send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
    
    // Verify that DeleteObjectCommand was called for each package
    mockPackages.forEach((pkg) => {
      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { Bucket: 'acmeregistrys3', Key: pkg.Key },
        })
      );
    });

    // Verify that the total number of delete calls matches the number of packages
    const deleteCalls = mockS3Send.mock.calls.filter(
      ([command]) => command instanceof DeleteObjectCommand
    );
    expect(deleteCalls).toHaveLength(mockPackages.length);
  });
});
