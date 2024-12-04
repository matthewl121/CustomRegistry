import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });

const capitalizeFirstLetter = (str) => {
  if (str === 'id') {
    return 'ID'; // Special case for 'id' key to become 'ID'
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const formatMetadata = (obj) => {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && key.toLowerCase() !== 'uploadvia') {
      const capitalizedKey = capitalizeFirstLetter(key);
      result[capitalizedKey] = obj[key];
    }
  }
  return result;
};

// Helper functions for debloat
// Function to list all object keys with a specific prefix
const listAllKeys = async (s3, bucket, prefix) => {
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
const getLatestReleaseVersion = async (owner, repo, githubToken = null, versionRegex = /[A-Za-z]*\s*(\d+\.\d+\.\d+)/i) => {
  const latestReleaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AWS-Lambda', // GitHub API requires a User-Agent header
  };
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }
  const latestReleaseResponse = await fetch(latestReleaseUrl, { headers });
  let versionFound = false;
  let packageVersion = null;
  if (latestReleaseResponse.ok) {
    const latestReleaseData = await latestReleaseResponse.json();
    const tagName = latestReleaseData.tag_name;
    if (tagName) {
      const match = tagName.match(versionRegex);
      if (match) {
        packageVersion = match[1]; // Extracted version
        versionFound = true;
        console.log(`Extracted version from latest release tag: ${packageVersion}`);
      } else {
        console.warn(`Latest release tag "${tagName}" does not match version pattern.`);
      }
    } else {
      console.warn("Latest release does not have a tag_name.");
    }
  } else if (latestReleaseResponse.status === 404) {
    console.warn("No releases found for this repository.");
  } else {
    throw new Error(`GitHub API error when fetching latest release: ${latestReleaseResponse.statusText}`);
  }
  return { version: packageVersion, found: versionFound };
};
const getPackageJsonVersion = async (owner, repo, defaultBranch, githubToken = null, versionRegex = /v?(\d+\.\d+\.\d+)/i) => {
  const packageJsonUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${defaultBranch}`;
  const headers = {
    'Accept': 'application/vnd.github.v3.raw', // Fetch raw content
    'User-Agent': 'AWS-Lambda', // GitHub API requires a User-Agent header
  };
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }
  let packageVersion = null;
  let versionFound = false;
  try {
    const packageJsonResponse = await fetch(packageJsonUrl, { headers });
    if (packageJsonResponse.ok) {
      const packageJsonText = await packageJsonResponse.text();
      let packageJson;
      try {
        packageJson = JSON.parse(packageJsonText);
      } catch (parseError) {
        console.warn(`Failed to parse package.json: ${parseError.message}`);
        return { version: null, found: false };
      }
      const pkgVersion = packageJson.version;
      if (pkgVersion) {
        const matchPkg = pkgVersion.match(versionRegex);
        if (matchPkg) {
          packageVersion = matchPkg[1];
          versionFound = true;
          console.log(`Extracted version from package.json: ${packageVersion}`);
        } else {
          console.warn(`package.json version "${pkgVersion}" does not match version pattern.`);
        }
      } else {
        console.warn("package.json does not contain a version field.");
      }
    } else {
      console.warn(`Failed to fetch package.json: ${packageJsonResponse.statusText}`);
    }
  } catch (error) {
    console.warn(`Error fetching package.json: ${error.message}`);
  }
  return { version: packageVersion, found: versionFound };
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
const extractNpmPackageName = (parsedURL) => {
  const regex = /\/package\/([^/]+)\/?/;
  const match = parsedURL.pathname.match(regex);
  if (!match || match.length < 2) {
    throw new Error("Invalid NPM package URL format. Expected format: https://www.npmjs.com/package/{packageName}");
  }
  const packageName = match[1];
  console.log(`Extracted package name from npm URL: ${packageName}`);
  return packageName;
};
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


export const uploadPackageHandler = async (event) => {
  // MIGHT NEETO TO ADD 'pathParameters' OR SIMILAR TO 'event' FIELDS
  const bucketName = "acmeregistrys3";
  const debloat = event.debloat === "true";

  let packageName;
  let content;
  let packageVersion;
  let uploadVia;

  // Check if Content or URL is provided
  if (event.Content) {
    // Use Content (Base64-encoded) directly
    packageName = event.Name;
    content = Buffer.from(event.Content, 'base64');
    packageVersion = "1.0.0";  // Default version if uploaded via Content
    uploadVia = "content";

  } else if (event.URL) {
    // Determine if the URL is npm or GitHub based on hostname
    const parsedURL = new URL(event.URL);
    
    try {
      if (parsedURL.hostname === "www.github.com" || parsedURL.hostname === "github.com") {
        uploadVia = "github";

        // Get owner and repo from Github URL
        let owner, repo;
        try {
          ({ owner, repo } = extractGitHubOwnerAndRepo(parsedURL));
        } catch (error) {
          throw new Error(`/package: ${error.message}`);
        }
        packageName = repo;

        // Fetch repository info to get the default branch
        let defaultBranch;
        try {
          defaultBranch = await getGitHubDefaultBranch(owner, repo, process.env.GITHUB_TOKEN);
        } catch (error) {
          throw new Error(`/package: ${error.message}`);
        }

        // Find version number for GitHub URL using release info
        let versionFound = false;
        try {
          const { version, found } = await getLatestReleaseVersion(owner, repo, process.env.GITHUB_TOKEN);
          if (found) {
            packageVersion = version;
            versionFound = true;
          }
        } catch (error) {
          throw new Error(`/package: ${error.message}`);
        }

        // Find version number for GitHub URL using package.json info
        if (!versionFound) {
          const { version, found } = await getPackageJsonVersion(owner, repo, defaultBranch, process.env.GITHUB_TOKEN);
          if (found) {
            packageVersion = version;
            versionFound = true;
          }
        }
        
        // If no releases or package.json
        if (!versionFound) {
          packageVersion = "1.0.0";
        }
        
        // Fetch content using tarball
        try {
          content = await getGithubTarballContent(owner, repo, defaultBranch, process.env.GITHUB_TOKEN);
        } catch (error) {
          throw new Error(`/package: ${error.message}`);
        }

      } else if (parsedURL.hostname === "www.npmjs.com" || parsedURL.hostname === "npmjs.com") {
        uploadVia = "npm";

        // Get repo name
        try {
          packageName = extractNpmPackageName(parsedURL);
        } catch (error) {
          throw new Error(`/package: ${error.message}`);
        }

        // Get version and tarball URL from npm URL
        const { latestVersion, npmData } = await getNpmPackageInfo(packageName);
        packageVersion = latestVersion;
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
      console.error(`/package: Error processing URL: ${error.message}`);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        // body: JSON.stringify(`/package: Error processing URL: ${error.message}`),
      };
    }
  } else {
    // Neither Content nor URL is provided
      console.error("/package: Either Content or URL must be provided.");
      return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      // body: JSON.stringify("/package: Either Content or URL must be provided."),
    };
  }

  const packageId = packageName + '--' + packageVersion;
  const metadata = {
    Name: packageName,
    ID: packageId,
    Version: packageVersion,
    uploadvia: uploadVia,
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
        console.log(`/package: Deleted ${existingKeys.length} existing versions of package "${packageName}".`);
      } else {
        console.log(`/package: No existing versions found for package "${packageName}".`);
      }
    } catch (error) {
      console.error(`/package: Error during debloat: ${error.message}`);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        // body: JSON.stringify(`/package: Error during debloat: ${error.message}`),
      };
    }
  }

  try {
    // store zip file to S3
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    console.log("/package: Package uploaded successfully:", response);

    // temporary: try to read the metadata back
    // const read_metadata_params = {
    //   Bucket: bucketName,
    //   Key: packageId,
    // };
    // const command1 = new HeadObjectCommand(read_metadata_params);
    // const response1 = await s3.send(command1);
    // const userMetadata = response1.Metadata;
    // const systemMetadata = {
    //   ContentType: response1.ContentType,
    //   ContentLength: response1.ContentLength,
    //   LastModified: response1.LastModified,
    //   ETag: response1.ETag,
    // };
    // console.log("/package: System Metadata:", JSON.stringify(systemMetadata, null, 2));
    // console.log("/package: User Metadata:", JSON.stringify(userMetadata, null, 2));

    let responseBody;
    if (event.Content) {
      responseBody = JSON.stringify({
        metadata: formatMetadata(metadata),
        data: {
          'Content': content.toString('base64'), // Convert Buffer to Base64 string
        }
      });
    } else {
      responseBody = JSON.stringify({
        metadata: formatMetadata(metadata),
        data: {
          'Content': content.toString('base64'), // Convert Buffer to Base64 string
          'URL': event.URL
        }
      });
    }
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: responseBody,
    };
  } catch (error) {
    console.error("/package: Error uploading package:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      // body: JSON.stringify(`/package: Error uploading package: ${error.message}`),
    };
  }
};