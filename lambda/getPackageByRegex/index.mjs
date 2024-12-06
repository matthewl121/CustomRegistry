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
  // Check for quantifiers that exceed a certain allowed size
  // This simple check looks for any {min,max} quantifier pair
  const quantifierPattern = /\{(\d+),(\d+)\}/g;
  let match;
  
  while ((match = quantifierPattern.exec(pattern)) !== null) {
    const [ , min, max ] = match;
    const minVal = parseInt(min, 10);
    const maxVal = parseInt(max, 10);
    
    // Customize these thresholds as desired
    if (maxVal > 1000) {
      throw new Error(`Invalid regex pattern: quantifier {${min},${max}} is too large.`);
    }
  }

  // Now try to construct the regex
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
    const parts = Key.split('--');
    const packageName = parts[0];
    const match = packageName.match(regex);
    // Check if we got a match and if the matched string equals the full packageName
    return match && match[0] === packageName;
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
      body: JSON.stringify({ message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid" }),
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
      body: JSON.stringify({ message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid" }),
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
        // body: JSON.stringify({ message: "No package found under this regex." }),
        body: JSON.stringify([]),
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
      body: JSON.stringify({ message: "There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid" }),
    };
  }
};