/**
 * Registry Reset Handler - AWS Lambda Function
 * 
 * This module implements an AWS Lambda function that completely resets the package registry
 * by deleting all objects in the specified S3 bucket. It handles pagination for large buckets
 * and provides detailed error reporting for failed deletions.
 * 
 * Features:
 * - Bulk deletion of all objects in S3 bucket
 * - Handles pagination for large object lists
 * - Provides detailed logging of deleted objects
 * - Implements error handling for failed deletions
 * 
 * Dependencies:
 * - @aws-sdk/client-s3: AWS SDK for S3 operations
 * 
 * 
 * @module resetRegistryHandler
 * @since 2024
 */

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });


/**
 * Lists all object keys in an S3 bucket, handling pagination
 * @param {S3Client} s3Client - Initialized S3 client
 * @param {string} bucket - Name of the S3 bucket
 * @returns {Promise<Array>} Array of objects containing Keys
 */
const listAllKeys = async (s3Client, bucket) => {
  let isTruncated = true;
  let continuationToken = null;
  const keys = [];

  while (isTruncated) {
    const params = {
      Bucket: bucket,
      MaxKeys: 1000, // Maximum allowed by S3
      ContinuationToken: continuationToken,
    };

    try {
      const response = await s3Client.send(new ListObjectsV2Command(params));
      if (response.Contents) {
        response.Contents.forEach((item) => {
          keys.push({ Key: item.Key });
        });
      }
      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    } catch (error) {
      console.error("Error listing objects:", error);
      throw new Error(`Failed to list objects: ${error.message}`);
    }
  }

  return keys;
};

/**
 * Deletes multiple objects from an S3 bucket
 * @param {S3Client} s3Client - Initialized S3 client
 * @param {string} bucket - Name of the S3 bucket
 * @param {Array} objects - Array of objects to delete
 * @returns {Promise<void>}
 */
const deleteObjects = async (s3Client, bucket, objects) => {
  if (objects.length === 0) return;

  const params = {
    Bucket: bucket,
    Delete: {
      Objects: objects,
      Quiet: false,
    },
  };

  try {
    const response = await s3Client.send(new DeleteObjectsCommand(params));

    // Log deleted objects
    if (response.Deleted && response.Deleted.length > 0) {
      response.Deleted.forEach((deleted) => {
        console.log(`Deleted: ${deleted.Key}`);
      });
    }

    // Handle errors for specific objects
    if (response.Errors && response.Errors.length > 0) {
      response.Errors.forEach((error) => {
        console.error(`Error deleting ${error.Key}: ${error.Message}`);
      });
      throw new Error(`Failed to delete some objects.`);
    }
  } catch (error) {
    console.error("Error deleting objects:", error);
    throw new Error(`Failed to delete objects: ${error.message}`);
  }
};

/**
 * Lambda handler function to reset the registry by deleting all objects
 * @param {Object} event - Lambda event object
 * @returns {Object} Response object with status code and message
 */
export const resetRegistryHandler = async (event) => {
  const bucketName = "acmeregistrys3";

  try {
    console.log(`Starting reset process for bucket: ${bucketName}`);

    // Step 1: List all object keys in the bucket
    const allKeys = await listAllKeys(s3, bucketName);
    console.log(`Total objects to delete: ${allKeys.length}`);

    if (allKeys.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'DELETE',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: "Registry is reset."}),
      };
    }

    // Step 2: Delete all listed objects
    await deleteObjects(s3, bucketName, allKeys);
    console.log(`All objects deleted successfully from bucket: ${bucketName}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Registry is reset."}),
    };
  } catch (error) {
    console.error("Reset function error:", error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Internal Server Error"}),
    };
  }
};