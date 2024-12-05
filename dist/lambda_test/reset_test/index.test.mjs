import { jest } from '@jest/globals';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { resetRegistryHandler } from '../../lambda/resetRegistry/index.mjs';
jest.mock("@aws-sdk/client-s3", () => ({
    S3Client: jest.fn(() => ({
        send: jest.fn()
    })),
    ListObjectsV2Command: jest.fn(),
    DeleteObjectsCommand: jest.fn()
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
        { Key: 'package3.zip' }
    ];
    test('successfully resets the registry by deleting all packages', async () => {
        // Mock ListObjectsV2Command to return packages
        mockS3Send.mockImplementation((command) => {
            if (command instanceof ListObjectsV2Command) {
                return Promise.resolve({
                    Contents: mockPackages,
                    IsTruncated: false
                });
            }
            if (command instanceof DeleteObjectsCommand) {
                return Promise.resolve({
                    Deleted: mockPackages.map(pkg => ({ Key: pkg.Key })),
                    Errors: []
                });
            }
        });
        const result = await resetRegistryHandler();
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toBe(`All objects have been successfully deleted from bucket "acmeregistrys3".`);
        // Verify both commands were called
        const listCalls = mockS3Send.mock.calls.filter(([command]) => command instanceof ListObjectsV2Command);
        const deleteCalls = mockS3Send.mock.calls.filter(([command]) => command instanceof DeleteObjectsCommand);
        expect(listCalls).toHaveLength(1);
        expect(deleteCalls).toHaveLength(1);
        // Verify DeleteObjectsCommand was called with correct parameters
        expect(deleteCalls[0][0].input).toEqual({
            Bucket: 'acmeregistrys3',
            Delete: {
                Objects: mockPackages,
                Quiet: false
            }
        });
    });
    test('successfully handles empty registry', async () => {
        mockS3Send.mockImplementation((command) => {
            if (command instanceof ListObjectsV2Command) {
                return Promise.resolve({
                    Contents: [],
                    IsTruncated: false
                });
            }
        });
        const result = await resetRegistryHandler();
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toBe("Bucket is already empty.");
        expect(mockS3Send).toHaveBeenCalledTimes(1);
    });
    test('handles errors during deletion', async () => {
        mockS3Send.mockImplementation((command) => {
            if (command instanceof ListObjectsV2Command) {
                return Promise.resolve({
                    Contents: mockPackages,
                    IsTruncated: false
                });
            }
            if (command instanceof DeleteObjectsCommand) {
                return Promise.resolve({
                    Deleted: [],
                    Errors: [{ Key: 'package1.zip', Message: 'Access Denied' }]
                });
            }
        });
        const result = await resetRegistryHandler();
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toContain('Failed to delete some objects');
    });
});
//# sourceMappingURL=index.test.mjs.map