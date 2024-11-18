import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: "us-east-1" });


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


export const handler = async (event) => {
  // MIGHT NEETO TO ADD 'pathParameters' OR SIMILAR TO 'event' FIELDS
  // might need to add 'pathParameters' or similar
  const bucketName = "acmeregistrys3";
  const debloat = event.debloat || false;

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
        const pathParts = parsedURL.pathname.split('/').filter(part => part);
        if (pathParts.length < 2) {
          throw new Error("/package: Invalid GitHub URL. Expected format: https://github.com/{owner}/{repo}");
        }
        const owner = pathParts[0];
        const repo = pathParts[1];
        packageName = repo;

        // Fetch repository info to get the default branch
        const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const repoResponse = await fetch(repoApiUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            // 'Authorization': `token YOUR_GITHUB_TOKEN`
          },
        });
        if (!repoResponse.ok) {
          throw new Error(`GitHub API error when fetching repository info: ${repoResponse.statusText}`);
        }
        const repoData = await repoResponse.json();
        const defaultBranch = repoData.default_branch || "main";

        // Find version number for GitHub URL
        const versionRegex = /[A-Za-z]*\s*(\d+\.\d+\.\d+)/i;
        const latestReleaseUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
        const latestReleaseResponse = await fetch(latestReleaseUrl, { 
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AWS-Lambda',
            // If you have a GitHub token, you can include it here for higher rate limits
            // 'Authorization': `token YOUR_GITHUB_TOKEN`
          }
         });
         let versionFound = false;
         if (latestReleaseResponse.ok) {
          const latestReleaseData = await latestReleaseResponse.json();
          let tagName = latestReleaseData.tag_name;
        
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

        if (!versionFound) {
          const packageJsonUrl = `https://api.github.com/repos/${owner}/${repo}/contents/package.json?ref=${defaultBranch}`;
          const packageJsonResponse = await fetch(packageJsonUrl, { 
            headers: {
              'Accept': 'application/vnd.github.v3.raw', // For raw package.json content
              'User-Agent': 'AWS-Lambda', // Customize as needed
              // If you have a GitHub token, you can include it here for higher rate limits
              // 'Authorization': `token YOUR_GITHUB_TOKEN`
            }
           });
        
          if (packageJsonResponse.ok) {
            const packageJson = await packageJsonResponse.json();
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
        }
        
        // If no releases or package.json
        if (!versionFound) {
          packageVersion = "1.0.0";
        }
        
        // Construct the tarball URL using GitHub's API
        const tarballUrl = `https://api.github.com/repos/${owner}/${repo}/tarball/${defaultBranch}`;

        // Fetch the tarball from GitHub
        const tarballResponse = await fetch(tarballUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3.tarball',
            'User-Agent': 'AWS-Lambda' // GitHub API requires a User-Agent header
            // If you have a GitHub token, you can include it here for higher rate limits
            // 'Authorization': `token YOUR_GITHUB_TOKEN`
          }
        });

        if (!tarballResponse.ok) {
          throw new Error(`Failed to fetch tarball from GitHub URL: ${tarballResponse.statusText}`);
        }

        // Convert the response to an ArrayBuffer and then to a Buffer
        const arrayBuffer = await tarballResponse.arrayBuffer();
        content = Buffer.from(arrayBuffer);

      } else if (parsedURL.hostname === "www.npmjs.com" || parsedURL.hostname === "npmjs.com") {
        uploadVia = "npm";

        // Get repo name
        const regex = /\/package\/([^/]+)\/?/;
        const match = parsedURL.pathname.match(regex);
        if (!match || match.length < 2) {
          throw new Error("Invalid NPM package URL format. Expected format: https://www.npmjs.com/package/{packageName}");
        }
        packageName = match[1];        

        // Handle npm registry URL
        const npmInfoResponse = await fetch(`https://registry.npmjs.org/${packageName}`);
        if (!npmInfoResponse.ok) {
          throw new Error(`/package: Failed to fetch package info: ${response.statusText}`);
        }
  
        const npmData = await npmInfoResponse.json();
        const latestVersion = npmData['dist-tags'].latest;
        packageVersion = latestVersion;
        const tarballUrl = npmData.versions[latestVersion].dist.tarball;

        // Fetch tarball from npm
        const tarballResponse = await fetch(tarballUrl);
        if (!tarballResponse.ok) {
          throw new Error(`Failed to fetch tarball from npm URL: ${tarballResponse.statusText}`);
        }

        const arrayBuffer = await tarballResponse.arrayBuffer();
        content = Buffer.from(arrayBuffer);

      } else {
        throw new Error("Unsupported URL hostname. Only GitHub and npm registry URLs are supported.");
      }
    } catch (error) {
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
    name: packageName,
    id: packageId,
    version: packageVersion,
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
        metadata: metadata,
        data: {
          'Content': content.toString('base64'), // Convert Buffer to Base64 string
        }
      });
    } else {
      responseBody = JSON.stringify({
        metadata: metadata,
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
