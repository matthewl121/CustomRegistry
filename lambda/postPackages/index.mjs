import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = "acmeregistrys3";

const VALID_VERSIONS = {
  EXACT: /^\d+\.\d+\.\d+$/,         // e.g., "1.2.3"
  BOUNDED: /^\d+\.\d+\.\d+-\d+\.\d+\.\d+$/, // e.g., "1.2.3-2.1.0"
  CARAT: /^\^\d+\.\d+\.\d+$/,       // e.g., "^1.2.3"
  TILDE: /^~\d+\.\d+\.\d+$/,        // e.g., "~1.2.3"
};

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

export const postPackagesHandler = async (event) => {
  try {
    // Parse and validate the request body
    const queries = Array.isArray(event.queries) ? event.queries : [event.queries];
    const invalidQuery = queries.find(query => !query.Name);

    console.log("event", event);
    console.log("queries:", queries);
    queries.forEach((query, index) => {
      console.log(`Query ${index + 1}:`, query);
      console.log(`Query ${index + 1} - Name:`, query.Name);
      console.log(`Query ${index + 1} - Version:`, query?.Version);
    });


    // Check for wildcard case
    if (queries.some(query => query.Name === "*")) {
      const keys = await listAllKeys(s3, BUCKET_NAME);

      if (keys.length > 30) {
        return {
          statusCode: 413,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: "Too many packages returned.",
          }),
        };
      }

      if (keys.length === 0) {
        // Return an empty array when no packages are found
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([]), // Empty array as JSON
        };
      }

      // If keys are fewer than or equal to 30, return all packages
      const matchingPackages = keys.map(({ Key }) => parsePackageKey(Key));
      const formattedBody = matchingPackages
        .map(item => {
          // Capitalize the first letter of the Name field
          item.Name = item.Name.charAt(0).toUpperCase() + item.Name.slice(1);
          return JSON.stringify(item, null, 2);
        })
        .join('\n');

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
        body: formattedBody,
      };
    }

    // Search for matching packages in the S3 bucket with "OR" relationship
    const matchingPackages = await searchPackagesInS3(queries);

    if (matchingPackages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.",
        }),
      };
    }
    const formattedBody = matchingPackages
      .map(item => {
        // Capitalize the first letter of the Name field
        item.Name = item.Name.charAt(0).toUpperCase() + item.Name.slice(1);
        return JSON.stringify(item, null, 2);
      })
      .join('\n');
      
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: formattedBody,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 400, // technically supposed to be statusCode 500, internal server error
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid." }),
    };
  }
};

// Check if a version is valid based on the defined regex patterns
function isValidVersion(version) {
  return Object.values(VALID_VERSIONS).some((regex) => regex.test(version));
}

// Search for matching packages in the S3 bucket with "OR" logic
async function searchPackagesInS3(queries) {
  const params = { Bucket: BUCKET_NAME };
  const command = new ListObjectsV2Command(params);

  const { Contents = [] } = await s3.send(command);
  const packages = Contents.map(({ Key }) => parsePackageKey(Key));
  console.log("Packages found:", packages)

  // Return packages that match any of the queries (OR logic)
  return packages.filter(pkg =>
    queries.some(query =>
      pkg.Name === query.Name && 
      (!query.Version || matchVersion(pkg.Version, query.Version)) // Match all versions if Version is not specified
    )
  );
}


// Parse package name and version from the S3 object key
function parsePackageKey(key) {
  const [name, version] = key.split("--");
  return { Name: name, Version: version, ID: key };
}

// Helper function to normalize version strings
function normalizeQueryVersion(version) {
  const match = version.match(/\((.*?)\)$/); // Extract content inside parentheses
  return match ? match[1] : version; // If no parentheses, return as-is
}

// Match the version against the query version
function matchVersion(packageVersion, queryVersion) {
  const normalizedQueryVersion = normalizeQueryVersion(queryVersion); // Normalize the query version
  const versionType = getVersionType(normalizedQueryVersion);

  switch (versionType) {
    case "EXACT":
      return packageVersion === normalizedQueryVersion;
    case "BOUNDED":
      const [start, end] = normalizedQueryVersion.split("-");
      return packageVersion >= start && packageVersion <= end;
    case "CARAT":
      const [startMajor, startMinor, startPatch] = normalizedQueryVersion.slice(1).split(".").map(Number);
      const startVersion = `${startMajor}.${startMinor}.${startPatch}`;
      const endVersion = `${startMajor + 1}.0.0`; // Next major version boundary
      return packageVersion >= startVersion && packageVersion < endVersion;
    case "TILDE":
      const [major, minor] = normalizedQueryVersion.slice(1).split(".");
      return packageVersion.startsWith(`${major}.${minor}`);
    default:
      return false;
  }
}

// Get the type of version from the input
function getVersionType(version) {
  const normalizedVersion = normalizeQueryVersion(version); // Normalize the version for type detection

  if (VALID_VERSIONS.EXACT.test(normalizedVersion)) return "EXACT";
  if (VALID_VERSIONS.BOUNDED.test(normalizedVersion)) return "BOUNDED";
  if (VALID_VERSIONS.CARAT.test(normalizedVersion)) return "CARAT";
  if (VALID_VERSIONS.TILDE.test(normalizedVersion)) return "TILDE";
  return null;
}