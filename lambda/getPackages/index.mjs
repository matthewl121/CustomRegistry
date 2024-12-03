import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = "acmeregistrys3";

const VALID_VERSIONS = {
  EXACT: /^\d+\.\d+\.\d+$/,         // e.g., "1.2.3"
  BOUNDED: /^\d+\.\d+\.\d+-\d+\.\d+\.\d+$/, // e.g., "1.2.3-2.1.0"
  CARAT: /^\^\d+\.\d+\.\d+$/,       // e.g., "^1.2.3"
  TILDE: /^~\d+\.\d+\.\d+$/,        // e.g., "~1.2.3"
};

export const getPackagesHandler = async (event) => {
  try {
    // Extract the queries from the event object
    const queries = event.queries;

    // Validate the queries
    const invalidQuery = queries.find(query => !query.Version || !query.Name);

    if (invalidQuery) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing or invalid field(s) in the PackageQuery.",
        }),
      };
    }

    // Search for matching packages in the S3 bucket
    const matchingPackages = await searchPackagesInS3(queries);

    if (matchingPackages.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No matching packages found for the specified query.",
        }),
      };
    }

    // Capitalize the first letter of the Name field for each package
    const formattedPackages = matchingPackages.map(item => {
      item.Name = item.Name.charAt(0).toUpperCase() + item.Name.slice(1);
      return item;
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedPackages),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." }),
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

  // Return packages that match any of the queries (OR logic)
  return packages.filter(pkg =>
    queries.some(query =>
      pkg.Name === query.Name && matchVersion(pkg.Version, query.Version)
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
  const match = version.match(/\((.*?)\)$/);  // Extract content inside parentheses
  return match ? match[1] : version;  // If no parentheses, return as-is
}

// Match the version against the query version
function matchVersion(packageVersion, queryVersion) {
  const normalizedQueryVersion = normalizeQueryVersion(queryVersion);
  const versionType = getVersionType(normalizedQueryVersion);

  switch (versionType) {
    case "EXACT":
      return packageVersion === normalizedQueryVersion;
    case "BOUNDED":
      const [start, end] = normalizedQueryVersion.split("-");
      return packageVersion >= start && packageVersion <= end;
    case "CARAT":
      const [startMajor, startMinor, startPatch] = normalizedQueryVersion.slice(1).split(".");
      const startVersion = `${startMajor}.${startMinor}.${startPatch}`;
      const endVersion = `${startMajor + 1}.0.0`;  // Next major version boundary
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
  const normalizedVersion = normalizeQueryVersion(version);

  if (VALID_VERSIONS.EXACT.test(normalizedVersion)) return "EXACT";
  if (VALID_VERSIONS.BOUNDED.test(normalizedVersion)) return "BOUNDED";
  if (VALID_VERSIONS.CARAT.test(normalizedVersion)) return "CARAT";
  if (VALID_VERSIONS.TILDE.test(normalizedVersion)) return "TILDE";
  return null;
}