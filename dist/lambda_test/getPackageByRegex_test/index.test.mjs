import { getPackageByRegexHandler } from '../../lambda/getPackageByRegex/index.mjs';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
describe('getPackageByRegexHandler', () => {
    const s3Mock = mockClient(S3Client);
    beforeEach(() => {
        s3Mock.reset();
    });
    test('successfully retrieves matching packages', async () => {
        // Arrange: Mock S3Client response
        s3Mock.on(ListObjectsV2Command).resolves({
            Contents: [
                { Key: 'ValidPackage--1.0.0' },
                { Key: 'ValidPackagePoop--2.1.3' },
            ],
            IsTruncated: false,
        });
        const event = {
            RegEx: "Valid"
        };
        // Act: Call the handler
        const result = await getPackageByRegexHandler(event);
        // Assert: Check response
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body).toEqual([
            {
                Version: '1.0.0',
                Name: 'ValidPackage',
                ID: 'ValidPackage--1.0.0',
            },
            {
                Version: '2.1.3',
                Name: 'ValidPackagePoop',
                ID: 'ValidPackagePoop--2.1.3',
            },
        ]);
    });
    test('returns 404 when no packages match the regex', async () => {
        // Arrange: Mock S3Client response with no matching keys
        s3Mock.on(ListObjectsV2Command).resolves({
            Contents: [
                { Key: 'NonMatchingPackage--0.0.1' },
            ],
            IsTruncated: false,
        });
        const event = {
            RegEx: 'Valid',
        };
        // Act: Call the handler
        const result = await getPackageByRegexHandler(event);
        // Assert: Check response
        expect(result.statusCode).toBe(404);
    });
    test('returns 400 when RegEx is missing', async () => {
        // Arrange: Event without regex parameter
        const event = {};
        // Act: Call the handler
        const result = await getPackageByRegexHandler(event);
        // Assert: Check response
        expect(result.statusCode).toBe(400);
    });
    test('returns 400 when RegEx is invalid', async () => {
        // Arrange: Event with invalid regex pattern
        const event = {
            RegEx: 'invalid-regex(',
        };
        // Act: Call the handler
        const result = await getPackageByRegexHandler(event);
        // Assert: Check response
        expect(result.statusCode).toBe(400);
    });
    test('handles S3 listing errors gracefully', async () => {
        // Arrange: Mock S3Client to throw an error
        const mockError = new Error('S3 access denied');
        s3Mock.on(ListObjectsV2Command).rejects(mockError);
        const event = {
            RegEx: '^ValidPackage--\\d+\\.\\d+\\.\\d+$',
        };
        // Act: Call the handler
        const result = await getPackageByRegexHandler(event);
        // Assert: Check response
        expect(result.statusCode).toBe(400);
    });
});
//# sourceMappingURL=index.test.mjs.map