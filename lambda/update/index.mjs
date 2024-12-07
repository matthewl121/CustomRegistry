import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });

// Helper functions for debloat
// Function to list all object keys with a specific prefix
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
// Function to delete multiple objects given their keys
const deleteObjects = async (s3, bucket, objects) => {
  if (objects.length === 0) return;
  const params = {
    Bucket: bucket,
    Delete: {
      Objects: objects,
      Quiet: false,
    },
  };
  await s3.send(new DeleteObjectsCommand(params));
};

// Helper function for uploading via content
const isNewPatchVersionGreater = (oldVersion, newVersion) => {
  const parseVersion = (version) => {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error(`Invalid version format "${version}". Expected format: x.x.x`);
    }
    return parts;
  };
  const [oldMajor, oldMinor, oldPatch] = parseVersion(oldVersion);
  const [newMajor, newMinor, newPatch] = parseVersion(newVersion);
  return newPatch >= oldPatch;
};

// Helper functions for GitHub URL
const extractGitHubOwnerAndRepo = (parsedURL) => {
  const pathParts = parsedURL.pathname.split('/').filter(part => part);
  if (pathParts.length < 2) {
    throw new Error("/package: Invalid GitHub URL. Expected format: https://github.com/{owner}/{repo}");
  }
  const [owner, repo] = pathParts;
  return { owner, repo };
}
const getGitHubDefaultBranch = async (owner, repo, githubToken = null) => {
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AWS-Lambda', // GitHub API requires a User-Agent header
  };
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }
  const repoResponse = await fetch(repoApiUrl, { headers });
  if (!repoResponse.ok) {
    throw new Error(`GitHub API error when fetching repository info: ${repoResponse.statusText}`);
  }
  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch || "main";
  return defaultBranch;
};
const getGithubTarballContent = async (owner, repo, defaultBranch, githubToken = null) => {
  const tarballUrl = `https://api.github.com/repos/${owner}/${repo}/tarball/${defaultBranch}`;
  const headers = {
    'Accept': 'application/vnd.github.v3.tarball',
    'User-Agent': 'AWS-Lambda', // GitHub API requires a User-Agent header
  };
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }
  try {
    const tarballResponse = await fetch(tarballUrl, { headers });
    if (!tarballResponse.ok) {
      throw new Error(`Failed to fetch tarball from GitHub URL: ${tarballResponse.statusText}`);
    }
    const arrayBuffer = await tarballResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Successfully fetched tarball from ${tarballUrl}`);
    return buffer;
  } catch (error) {
    console.error(`Error fetching tarball: ${error.message}`);
    throw error; // Rethrow the error to be handled by the caller
  }
};

// Helper functions for npm URL
const getNpmPackageInfo = async (packageName) => {
  const npmRegistryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  try {
    const npmInfoResponse = await fetch(npmRegistryUrl);
    if (!npmInfoResponse.ok) {
      throw new Error(`/package: Failed to fetch package info: ${npmInfoResponse.statusText}`);
    }
    const npmData = await npmInfoResponse.json();
    if (!npmData['dist-tags'] || !npmData['dist-tags'].latest) {
      throw new Error(`/package: Could not determine the latest version for package "${packageName}".`);
    }
    const latestVersion = npmData['dist-tags'].latest;
    console.log(`Fetched npm package info for "${packageName}": Latest version is "${latestVersion}"`);
    return { latestVersion, npmData };
  } catch (error) {
    console.error(`/package: Error fetching npm package info for "${packageName}": ${error.message}`);
    throw error; // Rethrow the error to be handled by the caller
  }
};
const getNpmTarballContent = async (tarballUrl, options = {}) => {
  try {
    const response = await fetch(tarballUrl, options);
    if (!response.ok) {
      throw new Error(`Failed to fetch tarball from URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Successfully fetched tarball from ${tarballUrl}`);
    return buffer;
  } catch (error) {
    console.error(`Error fetching tarball from URL "${tarballUrl}": ${error.message}`);
    throw error; // Rethrow the error to be handled by the caller
  }
};


export const updatePackageHandler = async (event) => {
  // MIGHT NEETO TO ADD 'pathParameters' OR SIMILAR TO 'event' FIELDS
  const bucketName = "acmeregistrys3";
  
  if (!event.metadata || !event.data) {
    console.error("/package/{id} POST: Either metadata or data is empty");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
    };
  }
  
  const packageName = event.metadata.Name;
  const packageVersion = event.metadata.Version;
  const debloat = event.data.debloat === "true";
  let content;

  const oldPackageId = event.metadata.ID;
  const oldMetadataParams = {
    Bucket: bucketName,
    Key: oldPackageId,
  };

  // Check if old package exists in S3
  let response0;
  try {
    const command0 = new HeadObjectCommand(oldMetadataParams);
    response0 = await s3.send(command0);
  } catch (error) {
    console.error("/package/{id} POST: Object does not exist.");
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: "Package does not exist."})
    };
  }

  // Get old metadata
  const oldMetadata = response0.Metadata;
  
  // Check if uploaded via same method
  if ((event.data.URL && oldMetadata.uploadvia == "content") || 
    event.data.Content && oldMetadata.uploadvia != "content") {
    console.error("/package/{id} POST: 'Trying to update via invalid/wrong/opposite method'.");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
    };
  }

  // Upload new version of package to S3
  if (event.data.Content) {
    // Handle content
    // only create new object in S3 if new patch version is larger

    try {
      const isValidVersion = isNewPatchVersionGreater(oldMetadata.version, packageVersion);
      if (!isValidVersion) {
        console.error("/package/{id} POST: New patch version is not greater than or equal to the old patch version.");
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
        };
      }

      // new patch version is valid
      // Use Content (Base64-encoded) directly
      content = Buffer.from(event.data.Content, 'base64');

    } catch (error) {
      console.error("/package/{id} POST: Error comparing versions:", error.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
      };
    }
  } else if (event.data.URL) {
    // Handle URL
    // create new object in S3 no matter what
    const parsedURL = new URL(event.data.URL);

    try {
      if (parsedURL.hostname === "www.github.com" || parsedURL.hostname === "github.com") {
        // Get owner and repo from Github URL
        let owner, repo;
        try {
          ({ owner, repo } = extractGitHubOwnerAndRepo(parsedURL));
        } catch (error) {
          throw new Error(`/package/{id} POST: ${error.message}`);
        }
        // packageName = repo;

        // Fetch repository info to get the default branch
        let defaultBranch;
        try {
          defaultBranch = await getGitHubDefaultBranch(owner, repo, process.env.GITHUB_TOKEN);
        } catch (error) {
          throw new Error(`/package/{id} POST: ${error.message}`);
        }

        // Already have package version number

        // Fetch content using tarball
        try {
          content = await getGithubTarballContent(owner, repo, defaultBranch, process.env.GITHUB_TOKEN);
        } catch (error) {
          throw new Error(`/package/{id} POST: ${error.message}`);
        }

      } else if (parsedURL.hostname === "www.npmjs.com" || parsedURL.hostname === "npmjs.com") {
        // Aready have package name

        // Already have package version number
        // Get tarball URL from npm URL
        const { latestVersion, npmData } = await getNpmPackageInfo(packageName);
        // packageVersion = latestVersion;
        const tarballUrl = npmData.versions[latestVersion]?.dist?.tarball;
        if (!tarballUrl) {
          throw new Error(`/package: Could not find tarball URL for version "${latestVersion}" of package "${packageName}".`);
        }

        // Fetch content using tarball
        try {
          content = await getNpmTarballContent(tarballUrl);
        } catch (error) {
          throw new Error(`/package: Failed to fetch tarball from npm URL: ${error.message}`);
        }

      } else {
        throw new Error("Unsupported URL hostname. Only GitHub and npm registry URLs are supported.");
      }
    } catch (error) {
      console.error(`/package/{id} POST: Error processing URL: ${error.message}`);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
      };
    }
  } else {
    // Neither Content nor URL is provided
    console.error("/package/{id} POST: Either Content or URL must be provided.");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
    };
  }

  // update metadata
  const packageId = packageName + '--' + packageVersion;
  const metadata = {
    name: packageName,
    id: packageId,
    version: packageVersion,
    uploadvia: oldMetadata.uploadvia,
  }

  const params = {
    Bucket: bucketName,
    Key: packageId, // key is the id
    Body: content, // must be base64
    ContentType: "application/zip",
    Metadata: metadata, // custom metadata as key-value pairs
  };

  // manage debloat
  if (debloat) {
    // remove all packages with same packageName
    const prefix = `${packageName}--`;
    try {
      const existingKeys = await listAllKeys(s3, bucketName, prefix);
      if (existingKeys.length > 0) {
        await deleteObjects(s3, bucketName, existingKeys);
        console.log(`/package/{id} POST: Deleted ${existingKeys.length} existing versions of package "${packageName}".`);
      } else {
        console.log(`/package/{id} POST: No existing versions found for package "${packageName}".`);
      }
    } catch (error) {
      console.error(`/package/{id} POST: Error during debloat: ${error.message}`);
      return {
        statusCode: 400, // technically supossed to be 500 but that statusCode is not supported by this endpoint
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
      };
    }
  }

  try {
    // store zip file to S3
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    console.log("/package/{id} POST: Package updated successfully:", response);

    // send response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  } catch (error) {
    console.error("/package/{id} POST: Error updating package:", error);
    return {
      statusCode: 400, // technically supossed to be 500 but that statusCode is not supported by this endpoint
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."})
    };
  }
};