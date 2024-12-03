import { jest } from '@jest/globals';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getPackagesHandler } from '../../lambda/get/index.mjs';

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  ListObjectsV2Command: jest.fn()
}));

describe('getPackagesHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  test('successfully retrieves matching packages', async () => {
    // Mock S3 response
    const mockContents = [
      { Key: 'package1--1.2.3' },
      { Key: 'package2--2.0.0' },
      { Key: 'package1--1.3.0' }
    ];

    mockS3Send.mockResolvedValueOnce({ Contents: mockContents });

    const event = {
      queries: [
        { Name: 'package1', Version: '1.2.3' },
        { Name: 'package2', Version: '2.0.0' }
      ]
    };

    const result = await getPackagesHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');

    const parsedBody = JSON.parse(result.body);
    expect(parsedBody).toHaveLength(2);
    expect(parsedBody).toEqual(expect.arrayContaining([
      { Name: 'Package1', Version: '1.2.3', ID: 'package1--1.2.3' },
      { Name: 'Package2', Version: '2.0.0', ID: 'package2--2.0.0' }
    ]));
  });

  test('handles invalid queries', async () => {
    const event = {
      queries: [
        { Name: 'package1' }, // Missing Version
        { Version: '1.0.0' }  // Missing Name
      ]
    };

    const result = await getPackagesHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Missing or invalid field(s) in the PackageQuery.'
    });
  });

  test('handles no matching packages', async () => {
    mockS3Send.mockResolvedValueOnce({ Contents: [
      { Key: 'package3--1.0.0' }
    ]});

    const event = {
      queries: [
        { Name: 'package1', Version: '1.0.0' }
      ]
    };

    const result = await getPackagesHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'No matching packages found for the specified query.'
    });
  });

  test('handles S3 errors gracefully', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('S3 Error'));

    const event = {
      queries: [
        { Name: 'package1', Version: '1.0.0' }
      ]
    };

    const result = await getPackagesHandler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Internal server error.'
    });
  });

  describe('version matching', () => {
    test('matches exact version', async () => {
      mockS3Send.mockResolvedValueOnce({
        Contents: [{ Key: 'package1--1.2.3' }]
      });

      const event = {
        queries: [{ Name: 'package1', Version: '1.2.3' }]
      };

      const result = await getPackagesHandler(event);
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toHaveLength(1);
    });

    test('matches bounded version range', async () => {
      mockS3Send.mockResolvedValueOnce({
        Contents: [
          { Key: 'package1--1.2.3' },
          { Key: 'package1--1.3.0' },
          { Key: 'package1--2.0.0' }
        ]
      });

      const event = {
        queries: [{ Name: 'package1', Version: '1.2.0-1.3.0' }]
      };

      const result = await getPackagesHandler(event);
      const packages = JSON.parse(result.body);
      expect(result.statusCode).toBe(200);
      expect(packages).toHaveLength(2);
      expect(packages.map(p => p.Version)).toEqual(['1.2.3', '1.3.0']);
    });

    test('matches carat version range', async () => {
      mockS3Send.mockResolvedValueOnce({
        Contents: [
          { Key: 'package1--1.2.3' },
          { Key: 'package1--1.9.0' },
          { Key: 'package1--2.0.0' }
        ]
      });

      const event = {
        queries: [{ Name: 'package1', Version: '^1.2.3' }]
      };

      const result = await getPackagesHandler(event);
      const packages = JSON.parse(result.body);
      expect(result.statusCode).toBe(200);
      expect(packages).toHaveLength(2);
      expect(packages.map(p => p.Version)).toEqual(['1.2.3', '1.9.0']);
    });

    test('matches tilde version range', async () => {
      mockS3Send.mockResolvedValueOnce({
        Contents: [
          { Key: 'package1--1.2.3' },
          { Key: 'package1--1.2.9' },
          { Key: 'package1--1.3.0' }
        ]
      });

      const event = {
        queries: [{ Name: 'package1', Version: '~1.2.3' }]
      };

      const result = await getPackagesHandler(event);
      const packages = JSON.parse(result.body);
      expect(result.statusCode).toBe(200);
      expect(packages).toHaveLength(2);
      expect(packages.map(p => p.Version)).toEqual(['1.2.3', '1.2.9']);
    });
  });

  test('handles multiple queries with OR logic', async () => {
    mockS3Send.mockResolvedValueOnce({
      Contents: [
        { Key: 'package1--1.2.3' },
        { Key: 'package2--2.0.0' },
        { Key: 'package3--3.0.0' }
      ]
    });

    const event = {
      queries: [
        { Name: 'package1', Version: '1.2.3' },
        { Name: 'package2', Version: '2.0.0' }
      ]
    };

    const result = await getPackagesHandler(event);
    const packages = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(packages).toHaveLength(2);
    expect(packages).toEqual(expect.arrayContaining([
      { Name: 'Package1', Version: '1.2.3', ID: 'package1--1.2.3' },
      { Name: 'Package2', Version: '2.0.0', ID: 'package2--2.0.0' }
    ]));
  });
});