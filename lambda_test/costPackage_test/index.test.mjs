import { jest } from '@jest/globals';
import { handler } from '../../lambda/costPackage/index.mjs';
import { S3Client } from "@aws-sdk/client-s3";

// Set longer timeout for all tests
jest.setTimeout(30000);

describe('Cost Package Handler - Integration Tests', () => {
    test('should calculate costs with dependencies for cloudinary package', async () => {
        const response = await handler({
            id: "cloudinary_npm--2.5.1",
            dependency: "true"
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        console.log('Cloudinary with dependencies response:', JSON.stringify(body, null, 2));
        
        expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
        expect(body["cloudinary_npm--2.5.1"].standaloneCost).toBeDefined();
        expect(body["cloudinary_npm--2.5.1"].totalCost).toBeDefined();
    });

    test('should calculate standalone cost for cloudinary package', async () => {
        const response = await handler({
            id: "cloudinary_npm--2.5.1",
            dependency: "false"
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        console.log('Cloudinary standalone response:', JSON.stringify(body, null, 2));
        
        expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
        expect(body["cloudinary_npm--2.5.1"].totalCost).toBeDefined();
    });

    test('should handle non-existent package', async () => {
        const response = await handler({
            id: "non-existent-package--1.0.0",
            dependency: "true"
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body["non-existent-package--1.0.0"].totalCost).toBe(0.5);
    });
});

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
            id: "cloudinary_npm--2.5.1"
        });
        expect(response.statusCode).toBe(200);
        
        const body = JSON.parse(response.body);
        expect(body["cloudinary_npm--2.5.1"]).toBeDefined();
    });
});