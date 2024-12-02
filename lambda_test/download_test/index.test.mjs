import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { downloadPackageHandler } from './downloadPackageHandler';
import { Readable } from 'stream';
import _ from 'lodash';

// Mock the AWS SDK
jest.mock("@aws-sdk/client-s3");

describe('downloadPackageHandler', () => {
  let mockS3Send;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = jest.fn();
    S3Client.prototype.send = mockS3Send;
  });

  const createMockStream = (data) => Readable.from([Buffer.from(data)]);

  const generateMetadata = (overrides = {}) => _.defaults(overrides, {
    author: 'default-author',
    version: '1.0.0',
    description: 'default-description',
    id: 'default-id'
  });

  const verifyHeaders = (headers) => {
    const expectedHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    expect(headers).toMatchObject(expectedHeaders);
  };

  test('successfully downloads and processes a package', async () => {
    const mockMetadata = generateMetadata({
      author: 'test-author',
      version: '2.0.0'
    });

    const mockFileContent = _.repeat('test-content', 10);
    
    // Chain mock implementations using lodash
    _.forEach([
      () => ({ Metadata: mockMetadata }),
      () => ({ Body: createMockStream(mockFileContent) })
    ], (implementation) => {
      mockS3Send.mockImplementationOnce(async () => implementation());
    });

    const result = await downloadPackageHandler('test-package-id');

    expect(result.statusCode).toBe(200);
    verifyHeaders(result.headers);
    expect(result.headers['Content-Type']).toBe('application/json');

    const parsedBody = JSON.parse(result.body);
    
    // Use lodash for deep comparison
    expect(_.get(parsedBody, 'metadata')).toEqual({
      'Author': 'test-author',
      'Version': '2.0.0',
      'Description': 'default-description',
      'ID': 'default-id'
    });

    const expectedContent = Buffer.from(mockFileContent).toString('base64');
    expect(_.get(parsedBody, 'data.Content')).toBe(expectedContent);

    // Verify S3 calls
    expect(mockS3Send).toHaveBeenCalledTimes(2);
    
    const [headCall, getCall] = mockS3Send.mock.calls;
    expect(headCall[0]).toBeInstanceOf(HeadObjectCommand);
    expect(getCall[0]).toBeInstanceOf(GetObjectCommand);
    
    // Verify command parameters
    _.forEach([headCall[0].input, getCall[0].input], (params) => {
      expect(params).toEqual({
        Bucket: 'acmeregistrys3',
        Key: 'test-package-id'
      });
    });
  });

  test('returns 404 when package does not exist', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('Object not found'));

    const result = await downloadPackageHandler(_.uniqueId('non-existent-'));
    
    expect(result.statusCode).toBe(404);
    verifyHeaders(result.headers);
    expect(mockS3Send).toHaveBeenCalledTimes(1);
  });

  test('returns 400 when download fails', async () => {
    const errorMessage = 'Download failed';
    mockS3Send
      .mockResolvedValueOnce({ Metadata: generateMetadata() })
      .mockRejectedValueOnce(new Error(errorMessage));

    const result = await downloadPackageHandler(_.uniqueId('failed-'));

    expect(result.statusCode).toBe(400);
    verifyHeaders(result.headers);
    
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.message).toBe(`/package/{id} GET: Error downloading file: ${errorMessage}`);
  });

  test('properly capitalizes metadata with various cases', async () => {
    const testCases = [
      { input: { author: 'test', VERSION: '1.0', Description: 'test', id: 'test' } },
      { input: { AUTHOR: 'test', version: '1.0', description: 'test', ID: 'test' } },
      { input: { Author: 'test', Version: '1.0', DESCRIPTION: 'test', Id: 'test' } }
    ];

    for (const testCase of testCases) {
      mockS3Send
        .mockResolvedValueOnce({ Metadata: testCase.input })
        .mockResolvedValueOnce({ Body: createMockStream('test') });

      const result = await downloadPackageHandler(_.uniqueId('test-'));
      const parsedBody = JSON.parse(result.body);

      // Verify each key is properly capitalized regardless of input case
      _.forEach(parsedBody.metadata, (value, key) => {
        expect(key).toMatch(/^[A-Z][a-z]+$|^ID$/);
      });

      // Verify expected keys are present
      expect(_.keys(parsedBody.metadata)).toEqual(
        expect.arrayContaining(['Author', 'Version', 'Description', 'ID'])
      );
    }
  });

  test('handles empty and missing metadata gracefully', async () => {
    const testCases = [
      { Metadata: {} },
      { Metadata: null },
      {}
    ];

    for (const metadata of testCases) {
      mockS3Send
        .mockResolvedValueOnce(metadata)
        .mockResolvedValueOnce({ Body: createMockStream('test') });

      const result = await downloadPackageHandler(_.uniqueId('empty-'));
      expect(result.statusCode).toBe(200);
      
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.metadata).toBeDefined();
      expect(_.isEmpty(parsedBody.metadata)).toBe(true);
    }
  });

  test('handles large file downloads efficiently', async () => {
    const largeContent = _.repeat('x', 1024 * 1024); // 1MB of data
    
    mockS3Send
      .mockResolvedValueOnce({ Metadata: generateMetadata() })
      .mockResolvedValueOnce({ Body: createMockStream(largeContent) });

    const result = await downloadPackageHandler('large-file');
    expect(result.statusCode).toBe(200);
    
    const parsedBody = JSON.parse(result.body);
    expect(parsedBody.data.Content.length).toBe(Buffer.from(largeContent).toString('base64').length);
  });
});