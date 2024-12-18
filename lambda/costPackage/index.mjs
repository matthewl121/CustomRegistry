/**
 * Package Cost Calculator - AWS Lambda Handler
 * 
 * This module provides functionality to calculate storage costs for packages in an S3 registry.
 * It processes packages stored in a specified S3 bucket, extracts dependency information from
 * package.json files (supporting both tar.gz and zip formats), and calculates costs based on
 * file sizes. The system can evaluate both individual package costs and full dependency trees.
 * 
 * Key features:
 * - Extracts and processes package.json from compressed archives (tar.gz/zip)
 * - Calculates storage costs based on package sizes in MB
 * - Supports recursive dependency cost calculation
 * - Handles both direct package costs and full dependency tree analysis
 * - Implements security measures for package ID validation
 * - Provides CORS-enabled REST API responses
 * 
 */
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { x } from 'tar';
import { gunzipSync } from 'zlib';
import { Readable } from 'stream';
import unzipper from 'unzipper';

const s3 = new S3Client({ region: "us-east-1" });

// Helper function to clean version strings for dependency names
const cleanVersion = (version) => {
  return version.replace(/^[\^~><=]+/, '');
};

// Helper function to convert a stream to a buffer
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

// Helper function to extract dependencies from package.json from tar.gz from S3
const getDepsFromTarGz = async (s3Response) => {
  try {
    // Convert S3 response body stream to buffer
    const buffer = s3Response.Body instanceof Readable
      ? await streamToBuffer(s3Response.Body)
      : s3Response.Body;

    console.log(`Buffer size: ${buffer.length} bytes`);

    // Check GZIP signature (first 2 bytes should be '1f8b')
    const gzipSignature = buffer.slice(0, 2).toString('hex');
    console.log(`GZIP Signature (first 2 bytes): ${gzipSignature}`);

    if (gzipSignature !== '1f8b') {
      throw new Error('Invalid GZIP signature');
    }

    // Decompress the GZIP buffer
    const decompressed = gunzipSync(buffer);

    // Create a readable stream from the decompressed buffer
    const decompressedStream = Readable.from(decompressed);

    // Initialize packageJson
    let packageJson = null;

    // Create a promise to wait until packageJson is set
    const packageJsonPromise = new Promise((resolve, reject) => {
      const extract = x({
        // No filter; process all entries to log them
        onentry: (entry) => {
          console.log(`Processing entry: ${entry.path}`);

          // Check if the entry is package.json and not inside node_modules
          if (entry.path.endsWith('package.json') && !entry.path.includes('node_modules/')) {
            let data = '';
            entry.on('data', (chunk) => {
              data += chunk.toString();
            });
            entry.on('end', () => {
              try {
                packageJson = JSON.parse(data);
                console.log('Successfully extracted package.json');
                resolve();
              } catch (err) {
                reject(new Error(`Failed to parse package.json: ${err.message}`));
              }
            });
            entry.on('error', (err) => {
              reject(new Error(`Error reading package.json: ${err.message}`));
            });
          }
        }
      });

      // Listen for the 'finish' event to know when extraction is complete
      extract.on('finish', () => {
        if (!packageJson) {
          reject(new Error('No package.json found in tar.gz file'));
        }
      });

      // Listen for errors during extraction
      extract.on('error', (err) => {
        reject(err);
      });

      // Pipe the decompressed stream into the tar extractor
      decompressedStream.pipe(extract);
    });

    // Await the promise to ensure packageJson is set
    await packageJsonPromise;

    // At this point, packageJson should be set
    const dependencies = packageJson.dependencies || {};
    const allDependencies = { ...dependencies };

    const depsList = Object.entries(allDependencies).map(([name, version]) => ({
      name,
      version: cleanVersion(version)
    }));

    console.log(`Dependencies extracted: ${JSON.stringify(depsList)}`);

    return depsList;
  } catch (error) {
    console.error('Error extracting dependencies from tar.gz:', error);
    return [];
  }
};

// Helper function to extract dependencies from package.json from ZIP from S3
const getDepsFromZip = async (s3Response) => {
  try {
    // Convert S3 response body stream to buffer
    const buffer = s3Response.Body instanceof Readable
      ? await streamToBuffer(s3Response.Body)
      : s3Response.Body;

    console.log(`Buffer size: ${buffer.length} bytes`);

    // Create a readable stream from the buffer
    const bufferStream = Readable.from(buffer);

    // Initialize packageJson
    let packageJson = null;

    // Create a promise to wait until packageJson is set
    const packageJsonPromise = new Promise((resolve, reject) => {
      bufferStream
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          const filePath = entry.path;
          const type = entry.type; // 'Directory' or 'File'
          console.log(`Processing entry: ${filePath}`);

          // Check if the entry is package.json and not inside node_modules
          if (filePath.endsWith('package.json') && !filePath.includes('node_modules/')) {
            let data = '';
            entry.on('data', (chunk) => {
              data += chunk.toString();
            });
            entry.on('end', () => {
              try {
                packageJson = JSON.parse(data);
                console.log('Successfully extracted package.json from ZIP');
                resolve();
              } catch (err) {
                reject(new Error(`Failed to parse package.json: ${err.message}`));
              }
            });
            entry.on('error', (err) => {
              reject(new Error(`Error reading package.json: ${err.message}`));
            });
          } else {
            // Ignore other files
            entry.autodrain();
          }
        })
        .on('close', () => {
          if (!packageJson) {
            reject(new Error('No package.json found in ZIP file'));
          }
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    // Await the promise to ensure packageJson is set
    await packageJsonPromise;

    // At this point, packageJson should be set
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    const allDependencies = { ...dependencies, ...devDependencies };

    const depsList = Object.entries(allDependencies).map(([name, version]) => ({
      name,
      version: cleanVersion(version)
    }));

    console.log(`Dependencies extracted: ${JSON.stringify(depsList)}`);

    return depsList;
  } catch (error) {
    console.error('Error extracting dependencies from ZIP:', error);
    return [];
  }
};

// Generic helper function to extract dependencies based on upload method
const getDeps = async (s3Response, uploadVia) => {
  if (uploadVia === 'content') {
    return await getDepsFromZip(s3Response);
  } else {
    // Default to tar.gz processing
    return await getDepsFromTarGz(s3Response);
  }
};

// Recursive function to process a package and its dependencies
const processPackage = async (packageId, bucketName, processedPackages) => {
  // If already processed, return to prevent cycles
  if (processedPackages[packageId]) {
    return processedPackages[packageId].totalCost;
  }

  let standaloneCost = 0.0;
  let totalCost = 0.0;
  let dependencies = [];
  let uploadVia = 'url'; // Default assumption

  // Attempt to fetch package size and metadata from S3
  try {
    const headParams = {
      Bucket: bucketName,
      Key: packageId,
    };
    const headResponse = await s3.send(new HeadObjectCommand(headParams));
    const sizeBytes = headResponse.ContentLength;
    const sizeMB = Math.round((sizeBytes / (1024 * 1024)) * 100) / 100;
    standaloneCost = Math.round(sizeMB * 100) / 100; // Rounded to 2 decimals
    totalCost = standaloneCost;

    // Determine upload method from metadata
    if (headResponse.Metadata && headResponse.Metadata.uploadvia) {
      uploadVia = headResponse.Metadata.uploadvia;
    }

    // Extract dependencies based on upload method
    const getObjectParams = {
      Bucket: bucketName,
      Key: packageId,
    };
    const getObjectResponse = await s3.send(new GetObjectCommand(getObjectParams));
    dependencies = await getDeps(getObjectResponse, uploadVia);
  } catch (error) {
    // If package not found in S3, use estimated size
    console.warn(`Package ${packageId} not found in S3. Using estimated size.`);
    const estimatedSizeMB = Math.round((500 * 1024 / (1024 * 1024)) * 100) / 100; // 0.5 MB
    standaloneCost = Math.round(estimatedSizeMB * 100) / 100; // rounded to 2 decimals
    totalCost = standaloneCost;
    dependencies = []; // Assume no dependencies if not found
  }

  // Initialize the package entry
  processedPackages[packageId] = {
    standaloneCost,
    totalCost
  };

  // Process each dependency
  for (const dep of dependencies) {
    const depKey = `${dep.name}--${dep.version}`;
    const depTotalCost = await processPackage(depKey, bucketName, processedPackages);
    // Add dependency's totalCost to current package's totalCost
    totalCost += depTotalCost;
  }

  // Update the totalCost after processing dependencies
  processedPackages[packageId].totalCost = Math.round(totalCost * 100) / 100; // Rounded to 2 decimals

  return processedPackages[packageId].totalCost;
};

export const packageCostHandler = async (event) => {
  const bucketName = "acmeregistrys3";

  if (!event) {
    console.error("/package/{id}/cost: Missing package ID in path parameters");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID" }),
    };
  }

  const packageId = event.id;
  // was previously checking for equality with (string) "true" instead of (boolean) true
  const dependencyFlag = event.dependency === true; 

  if (!packageId) {
    console.error("/package/{id}/cost: Missing package ID in path parameters");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID" }),
    };
  }

  // Validate packageId format to prevent security issues
  const isValidPackageId = (id) => {
    const regex = /^[a-zA-Z0-9_\-\.]+$/;
    return regex.test(id);
  };

  if (!isValidPackageId(packageId)) {
    console.error("/package/{id}/cost: Invalid package ID format.");
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID" }),
    };
  }

  // Check that package exists in S3 using HEAD request
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: packageId }));
  } catch (error) {
    // If package does not exist, return a 404
    console.error(`/package/{id}/cost: Package ${packageId} does not exist in S3.`);
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Package does not exist." }),
    };
  }

  // If the package exists, proceed
  const processedPackages = {};

  try {
    // Calculate costs recursively
    await processPackage(packageId, bucketName, processedPackages);

    // If dependencyFlag is not set, return only the selected package's totalCost

    if (!dependencyFlag) {
      const standaloneCost = processedPackages[packageId].standaloneCost;
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [packageId]: { "totalCost": standaloneCost } }),
      };
    }

    // Prepare the response body for all processed packages
    const responseBody = {};
    for (const [pkgId, costs] of Object.entries(processedPackages)) {
      responseBody[pkgId] = {
        "standaloneCost": costs.standaloneCost,
        "totalCost": costs.totalCost
      };
    }

    console.log("responseBody:");
    console.log(responseBody);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseBody),
    };

  } catch (error) {
    console.error("/package/{id}/cost: Error processing request:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "The package rating system choked on at least one of the metrics." }),
    };
  }
};