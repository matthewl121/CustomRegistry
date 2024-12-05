import { jest } from '@jest/globals';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getPackagesHandler } from '../../lambda/getPackages/index.mjs';
// Mock console.error to prevent error output in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});
afterAll(() => {
    console.error = originalConsoleError;
});
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
        console.error.mockClear();
    });
    test('successfully retrieves matching packages', async () => {
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
        expect(console.error).not.toHaveBeenCalled();
    });
    test('handles invalid queries', async () => {
        const event = {
            queries: [
                { Name: 'package1' }, // Missing Version
                { Version: '1.0.0' } // Missing Name
            ]
        };
        const result = await getPackagesHandler(event);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body)).toEqual({
            error: 'Missing or invalid field(s) in the PackageQuery.'
        });
        expect(console.error).not.toHaveBeenCalled();
    });
    test('handles no matching packages', async () => {
        mockS3Send.mockResolvedValueOnce({ Contents: [
                { Key: 'package3--1.0.0' }
            ] });
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
        expect(console.error).not.toHaveBeenCalled();
    });
    test('handles S3 errors gracefully', async () => {
        const testError = new Error('S3 Error');
        mockS3Send.mockRejectedValueOnce(testError);
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
        expect(console.error).toHaveBeenCalledWith('Error:', testError);
    });
    test('properly matches version ranges', async () => {
        const mockContents = [
            { Key: 'package1--1.2.3' },
            { Key: 'package1--1.2.9' },
            { Key: 'package1--1.3.0' },
            { Key: 'package1--2.0.0' }
        ];
        const testCases = [
            {
                query: { Name: 'package1', Version: '1.2.3' },
                expectedVersions: ['1.2.3']
            },
            {
                query: { Name: 'package1', Version: '1.2.0-1.3.0' },
                expectedVersions: ['1.2.3', '1.2.9', '1.3.0']
            },
            {
                query: { Name: 'package1', Version: '^1.2.3' },
                expectedVersions: ['1.2.3', '1.2.9', '1.3.0']
            },
            {
                query: { Name: 'package1', Version: '~1.2.3' },
                expectedVersions: ['1.2.3', '1.2.9']
            }
        ];
        for (const testCase of testCases) {
            const event = {
                queries: [testCase.query]
            };
            mockS3Send.mockResolvedValueOnce({ Contents: mockContents });
            const result = await getPackagesHandler(event);
            expect(result.statusCode).toBe(200);
            const packages = JSON.parse(result.body);
            const versions = packages.map(p => p.Version);
            expect(versions.sort()).toEqual(testCase.expectedVersions.sort());
            expect(console.error).not.toHaveBeenCalled();
        }
    });
});
//# sourceMappingURL=index.test.mjs.map