import { jest } from '@jest/globals';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { resetRegistryHandler } from '../../lambda/resetRegistry/index.mjs';
import { Readable } from 'stream';

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  GetObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

describe('resetRegistryHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  const createMockStream = (data) => Readable.from([Buffer.from(data)]);

  test('successfully resets the registry', async () => {
    // Mock behavior for S3 commands
    mockS3Send
      .mockResolvedValueOnce({ Metadata: { resetStatus: 'success' } }) // Mock metadata response
      .mockResolvedValueOnce({}); // Mock success for reset logic

    const event = { queryStringParameters: { registryId: 'test-registry-id' } };

    const result = await resetRegistryHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');

    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.message).toBe('Registry reset successfully');
    expect(parsedBody.registryId).toBe('test-registry-id');

    // Ensure correct S3 commands were called
    expect(mockS3Send).toHaveBeenCalledTimes(2);
    const [headCall, resetCall] = mockS3Send.mock.calls;
    expect(headCall[0]).toBeInstanceOf(HeadObjectCommand);
    expect(resetCall[0]).toBeInstanceOf(GetObjectCommand);
    
    [headCall[0].input, resetCall[0].input].forEach((params) => {
      expect(params).toEqual({
        Bucket: 'acmeregistrys3',
        Key: 'test-registry-id',
      });
    });
  });

  test('returns 404 when registry does not exist', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('Object not found'));

    const event = { queryStringParameters: { registryId: 'non-existent-registry' } };

    const result = await resetRegistryHandler(event);

    expect(result.statusCode).toBe(404);
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.message).toBe('Registry not found');
    expect(mockS3Send).toHaveBeenCalledTimes(1);
  });

  test('returns 400 when reset fails', async () => {
    const errorMessage = 'Reset operation failed';
    mockS3Send
      .mockResolvedValueOnce({ Metadata: { resetStatus: 'success' } }) // Mock metadata response
      .mockRejectedValueOnce(new Error(errorMessage)); // Simulate failure during reset

    const event = { queryStringParameters: { registryId: 'failed-registry' } };

    const result = await resetRegistryHandler(event);

    expect(result.statusCode).toBe(400);
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.message).toBe(`Error resetting registry: ${errorMessage}`);
    expect(mockS3Send).toHaveBeenCalledTimes(2);
  });

  test('handles missing query parameters gracefully', async () => {
    const event = { queryStringParameters: null }; // No query parameters

    const result = await resetRegistryHandler(event);

    expect(result.statusCode).toBe(400);
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.message).toBe('Missing or invalid registryId parameter');
    expect(mockS3Send).not.toHaveBeenCalled();
  });

  test('handles invalid responses gracefully', async () => {
    mockS3Send
      .mockResolvedValueOnce({ Metadata: null }) // Mock invalid metadata response
      .mockResolvedValueOnce({}); // Mock success for reset logic

    const event = { queryStringParameters: { registryId: 'test-registry-id' } };

    const result = await resetRegistryHandler(event);

    expect(result.statusCode).toBe(200); // Should still succeed
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.message).toBe('Registry reset successfully');
    expect(parsedBody.registryId).toBe('test-registry-id');
  });
});
