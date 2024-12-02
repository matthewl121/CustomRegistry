import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });


// Helper function to list all object keys in the bucket
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

// Helper function to delete multiple objects given their keys
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


export const handler = async (event) => {
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify("Bucket is already empty."),
      };
    }

    // Step 2: Delete all listed objects
    await deleteObjects(s3, bucketName, allKeys);
    console.log(`All objects deleted successfully from bucket: ${bucketName}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(`All objects have been successfully deleted from bucket "${bucketName}".`),
    };
  } catch (error) {
    console.error("Reset function error:", error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(`Error during reset: ${error.message}`),
    };
  }
};