import { jest } from '@jest/globals';
import { ratePackageHandler } from './index.mjs';
import { S3Client } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import AdmZip from 'adm-zip';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

// Mock child_process and fs
const mockExecPromise = jest.fn();
jest.mock('child_process', () => ({
    exec: () => mockExecPromise
}));

jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: (fn) => (...args) => mockExecPromise(...args)
}));

const mockMkdir = jest.fn();
const mockUnlink = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('fs/promises', () => ({
    mkdir: (...args) => mockMkdir(...args),
    unlink: (...args) => mockUnlink(...args),
    writeFile: (...args) => mockWriteFile(...args)
}));

describe('Rate Package Handler', () => {
    let mockS3Send;
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockS3Send = jest.fn();
        S3Client.prototype.send = mockS3Send;

        // Default success responses for fs operations
        mockMkdir.mockResolvedValue(undefined);
        mockUnlink.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined);

        // Default success response for exec
        mockExecPromise.mockResolvedValue({ 
            stdout: JSON.stringify({
                URL: "https://github.com/cloudinary/cloudinary_npm",
                NetScore: 0.5,
                RampUp: 0.5,
                Correctness: 0.5,
                BusFactor: 0.5,
                ResponsiveMaintainer: 0.5,
                License: 1.0
            }), 
            stderr: '' 
        });
    });

    test('should handle NPM package successfully', async () => {
        mockS3Send.mockResolvedValueOnce({});  // HEAD
        mockS3Send.mockResolvedValueOnce({     // GET
            Metadata: {
                uploadvia: 'npm',
                name: 'lodash',
                version: '4.17.21',
                score: '8.5'
            }
        });
        mockS3Send.mockResolvedValueOnce({}); // PUT

        const event = {
            pathParameters: {
                id: "lodash@4.17.21"
            }
        };

        const response = await ratePackageHandler(event);
        const body = JSON.parse(response.body);
        
        expect(response.statusCode).toBe(200);
        expect(body.packageId).toBe('lodash@4.17.21');
        expect(body.packageUrl).toBe('https://www.npmjs.com/package/lodash');
    });

    test('should handle GitHub package successfully', async () => {
        mockS3Send.mockResolvedValueOnce({});  // HEAD
        mockS3Send.mockResolvedValueOnce({     // GET
            Metadata: {
                uploadvia: 'github',
                url: 'https://github.com/cloudinary/cloudinary_npm',
                score: '8.5'
            }
        });
        mockS3Send.mockResolvedValueOnce({}); // PUT

        const event = {
            pathParameters: {
                id: "cloudinary-npm-2.5.1"
            }
        };

        const response = await ratePackageHandler(event);
        const body = JSON.parse(response.body);
        
        expect(response.statusCode).toBe(200);
        expect(body.packageUrl).toBe('https://github.com/cloudinary/cloudinary_npm');
    });

    test('should handle zip file content package successfully', async () => {
        // Create a mock zip file with package.json
        const zip = new AdmZip();
        const packageJson = {
            name: "cloudinary",
            version: "2.5.1",
            homepage: "https://github.com/cloudinary/cloudinary_npm",
            repository: {
                type: "git",
                url: "git+https://github.com/cloudinary/cloudinary_npm.git"
            }
        };
        zip.addFile("package.json", Buffer.from(JSON.stringify(packageJson)));
        const zipBuffer = zip.toBuffer();

        // Create a mock readable stream from the zip buffer
        const mockStream = new Readable();
        mockStream.push(zipBuffer);
        mockStream.push(null);

        mockS3Send.mockResolvedValueOnce({});  // HEAD
        mockS3Send.mockResolvedValueOnce({     // GET
            Metadata: {
                uploadvia: 'content',
                score: '-1'
            },
            Body: mockStream
        });
        mockS3Send.mockResolvedValueOnce({}); // PUT

        const event = {
            pathParameters: {
                id: "cloudinary_npm--2.5.1"
            }
        };

        const response = await ratePackageHandler(event);
        const body = JSON.parse(response.body);
        
        expect(response.statusCode).toBe(200);
        expect(body.packageUrl).toBe('https://github.com/cloudinary/cloudinary_npm');
    });

    test('should handle invalid URL in zip content', async () => {
        // Create a zip file with invalid URL
        const zip = new AdmZip();
        const packageJson = {
            name: "test-package",
            repository: {
                url: "https://invalid-url.com/repo"
            }
        };
        zip.addFile("package.json", Buffer.from(JSON.stringify(packageJson)));
        const zipBuffer = zip.toBuffer();

        const mockStream = new Readable();
        mockStream.push(zipBuffer);
        mockStream.push(null);

        mockS3Send.mockResolvedValueOnce({});  // HEAD
        mockS3Send.mockResolvedValueOnce({     // GET
            Metadata: {
                uploadvia: 'content',
                score: '8.5'
            },
            Body: mockStream
        });
        mockS3Send.mockResolvedValueOnce({}); // PUT

        const event = {
            pathParameters: {
                id: "test-package.zip"
            }
        };

        const response = await ratePackageHandler(event);
        const body = JSON.parse(response.body);
        
        expect(response.statusCode).toBe(200);
        expect(body.packageUrl).toBe('Content URL not available');
    });

    test('should return 404 for non-existent package', async () => {
        mockS3Send.mockRejectedValueOnce({ 
            name: 'NotFound',
            $metadata: { httpStatusCode: 404 }
        });

        const event = {
            pathParameters: {
                id: "non-existent-package@1.0.0"
            }
        };

        const response = await ratePackageHandler(event);
        const body = JSON.parse(response.body);
        
        expect(response.statusCode).toBe(404);
        expect(body.error).toContain('not found');
        expect(body.packageId).toBe('non-existent-package@1.0.0');
    });

    test('should handle missing package ID', async () => {
        const event = {
            pathParameters: {}
        };

        const response = await ratePackageHandler(event);
        const body = JSON.parse(response.body);
        
        expect(response.statusCode).toBe(400);
        expect(body.error).toBe('Package ID is required');
    });
});