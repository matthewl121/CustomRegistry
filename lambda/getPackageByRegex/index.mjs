// /package/byRegEx
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });


// Helper function for S3
const listAllKeys = async (s3, bucket, prefix="") => {
  let isTruncated = true;
  let continuationToken = null;
  const keys = [];
  while (isTruncated) {
    const params = {
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    };
    const response = await s3.send(new ListObjectsV2Command(params));
    if (response.Contents) {
      response.Contents.forEach((item) => {
        keys.push({ Key: item.Key });
      });
    }
    isTruncated = response.IsTruncated;
    continuationToken = response.NextContinuationToken;
  }
  return keys;
};

// Helper function for regex
const isValidRegex = (pattern) => {
  let regex;
  try {
    regex = new RegExp(pattern);
  } catch (error) {
    throw new Error("Invalid regex pattern provided.");
  }
  return regex;
};
const filterKeysByRegex = (keys, regex) => {
  return keys.filter(({ Key }) => {
    // Split the key by '--' delimiter
    const parts = Key.split('--');
    // Extract the package name (first part)
    const packageName = parts[0];
    // Apply the regex to the package name only
    return regex.test(packageName);
  });
};

// Helper function to transform keys to desired structure for response
const transformKeys = (keys) => {
  return keys.map(({ Key }) => {
    const parts = Key.split('--');
    // Ensure the key has exactly two parts: Name and Version
    if (parts.length !== 2) {
      // Handle unexpected key format
      return {
        Version: "Unknown",
        Name: "Unknown",
        ID: Key,
        Note: "Unexpected key format",
      };
    }
    const [Name, Version] = parts;
    return {
      Version,
      Name,
      ID: Key,
    };
  });
};


export const getPackageByRegexHandler = async (event) => {
  // MIGHT NEETO TO ADD 'pathParameters' OR SIMILAR TO 'event' FIELDS
  const bucketName = "acmeregistrys3";
  const regexPattern = event.RegEx;

  // check if regex pattern exists
  if (!regexPattern) {
    console.error("/package/byReGex: Missing regex pattern.");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Missing regex pattern." }),
    };
  }

  // check that regex pattern is valid
  let regexObject;
  try {
    regexObject = isValidRegex(regexPattern);
  } catch (error) {
    console.error("/package/byReGex: Invalid regex pattern.");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: "Invalid regex pattern." }),
    };
  }

  try {
    // list all keys in the bucket
    const allKeys = await listAllKeys(s3, bucketName);

    // get all matching keys
    const matchingKeys = filterKeysByRegex(allKeys, regexObject);

    console.log(`matchingKeys: ${JSON.stringify(matchingKeys)}`);
    
    if (matchingKeys.length === 0) {
      console.error("/package/byReGex: No packages found.");
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: "/package/byReGex: No packages found." }),
      };
    }

    // Transform the matching keys format
    const matchedPackages = transformKeys(matchingKeys);

    console.log(`matchedPackages: ${JSON.stringify(matchedPackages)}`);

    // return response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matchedPackages),
    };
  } catch (error) {
    console.error("/package/byReGex: Error processing request:", error);
    return {
      statusCode: 400, // supposed to be status code 500 but that is not in the spec so i am using 400
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "/package/byReGex: Error processing request." }),
    };
  }
};