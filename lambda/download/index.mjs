
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });

const capitalizeFirstLetter = (str) => {
  if (str.toLowerCase() === 'id') {
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

export const downloadPackageHandler = async (packageId) => {
  // console.log("Received event:", JSON.stringify(event, null, 2)); // Log event
  const bucketName = "acmeregistrys3";
  const params = {
    Bucket: bucketName,
    Key: packageId,
  };

  if (!packageId) {
    console.error(`/package/{id} GET: Invalid ID`);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid." }),
    };
  }

  // Check if old package exists in S3
  let response0;
  try {
    const command0 = new HeadObjectCommand(params);
    response0 = await s3.send(command0);
  } catch (error) {
    console.error(`/package/{id} GET: ${error}`);
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Package does not exist." })
    };
  }

  // retrieve metadata from package name
  const packageMetadata = response0.Metadata;

  try {
    // retrieve zip file data
    const data = await s3.send(new GetObjectCommand(params));
    
    // Collect the file data into chunks
    const chunks = [];
    for await (const chunk of data.Body) {
      chunks.push(chunk);
    }
    const fileData = Buffer.concat(chunks);
    console.log(`File downloaded successfully. File size: ${fileData.length} bytes`);

    // craft response body
    const responseBody = JSON.stringify({
      metadata: formatMetadata(packageMetadata),
      data: {
        'Content': fileData.toString('base64'), // Convert Buffer to Base64 string
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: responseBody,
    };
  } catch (error) {
    console.error(`/package/{id} GET: Error downloading file: ${error.message}`);
    return {
      statusCode: 400, // supposed to be statusCode 500 but it's not in spec
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid." }),
    };
  }
};