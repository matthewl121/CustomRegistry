import { jest } from '@jest/globals';
import { handler } from '../../lambda/costPackage/index.mjs';
import { S3Client } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import { gzipSync } from 'zlib';

// Set longer timeout for all tests
jest.setTimeout(30000);

describe('Cost Package Handler - Mocked Tests', () => {
    let mockS3Send;

    beforeEach(() => {
        jest.clearAllMocks();
        mockS3Send = jest.fn();
        S3Client.prototype.send = mockS3Send;
    });

    test('should calculate costs with mocked dependencies', async () => {
        // Mock main package
        mockS3Send.mockResolvedValueOnce({
            ContentLength: 1024 * 1024 // 1MB
        });

        const mainPackageJson = {
            dependencies: {
                "dep1": "1.0.0",
                "dep2": "^2.0.0"
            }
        };
        mockS3Send.mockResolvedValueOnce({
            Body: Readable.from(gzipSync(Buffer.from(JSON.stringify(mainPackageJson))))
        });

        // Mock dependencies
        mockS3Send.mockResolvedValueOnce({
            ContentLength: 512 * 1024
        });
        mockS3Send.mockResolvedValueOnce({
            Body: Readable.from(gzipSync(Buffer.from(JSON.stringify({ dependencies: {} }))))
        });

        mockS3Send.mockResolvedValueOnce({
            ContentLength: 512 * 1024
        });
        mockS3Send.mockResolvedValueOnce({
            Body: Readable.from(gzipSync(Buffer.from(JSON.stringify({ dependencies: {} }))))
        });

        const response = await handler({
            id: "main-package-1.0.0",
            dependency: "true"
        });

        const body = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(body["main-package-1.0.0"].totalCost).toBe(2.0); // 1MB + 0.5MB + 0.5MB
    });

    test('should handle corrupt tar.gz files', async () => {
        mockS3Send.mockResolvedValueOnce({
            ContentLength: 1024 * 1024
        });

        mockS3Send.mockResolvedValueOnce({
            Body: Readable.from(Buffer.from('invalid content'))
        });

        const response = await handler({
            id: "corrupt-package-1.0.0",
            dependency: "true"
        });

        const body = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(body["corrupt-package-1.0.0"].totalCost).toBe(1.0);
    });
});

// Disable mocking for integration tests
beforeEach(() => {
    jest.resetModules();
    jest.dontMock('@aws-sdk/client-s3');
});

describe('Cost Package Handler - Integration Tests', () => {
    test('should calculate costs for cloudinary_npm package with dependencies', async () => {
        const response = await handler({
            id: "cloudinary_npm--2.5.1",
            dependency: "true"
        });

        const body = JSON.parse(response.body);
        console.log('Real cloudinary_npm response:', JSON.stringify(body, null, 2));

        expect(response.statusCode).toBe(200);
        expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
        expect(body["cloudinary_npm--2.5.1"].standaloneCost).toBeDefined();
        expect(body["cloudinary_npm--2.5.1"].totalCost).toBeDefined();
    });

    test('should calculate standalone cost for lodash package', async () => {
        const response = await handler({
            id: "lodash@4.17.21",
            dependency: "false"
        });

        const body = JSON.parse(response.body);
        console.log('Real lodash standalone response:', JSON.stringify(body, null, 2));

        expect(response.statusCode).toBe(200);
        expect(body["lodash@4.17.21"]).toBeDefined();
        expect(body["lodash@4.17.21"].totalCost).toBeDefined();
    });

    test('should handle non-existent package in real S3', async () => {
        const response = await handler({
            id: "non-existent-package@1.0.0",
            dependency: "true"
        });

        const body = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(body["non-existent-package@1.0.0"].totalCost).toBe(0.5);
    });
});

// Common tests that work for both mocked and real scenarios
describe('Cost Package Handler - Common Tests', () => {
    test('should handle invalid package ID', async () => {
        const response = await handler({
            id: "../invalid/package/id",
            dependency: "true"
        });
        expect(response.statusCode).toBe(400);
    });

    test('should handle missing package ID', async () => {
        const response = await handler({
            dependency: "true"
        });
        expect(response.statusCode).toBe(400);
    });

    test('should handle missing dependency flag', async () => {
        const response = await handler({
            id: "lodash@4.17.21"
        });
        expect(response.statusCode).toBe(200);
        
        const body = JSON.parse(response.body);
        expect(body["lodash@4.17.21"]).toBeDefined();
    });
});