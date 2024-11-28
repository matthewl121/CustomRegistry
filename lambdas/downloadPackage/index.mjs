import { S3Client, GetObjectCommand, HeadObjectCommand} from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });

export const handler = async (event) => {
  // console.log("Received event:", JSON.stringify(event, null, 2)); // Log event for debugging

  const bucketName = "acmeregistrys3";
  const packageId = event.pathParameters.id; // Access id from pathParameters

  const params = {
    Bucket: bucketName,
    Key: packageId,
  };

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
      },
      // body: JSON.stringify(`/package/{id} GET: ${error}`)
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
      metadata: packageMetadata,
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
      },
      body: JSON.stringify({ message: `/package/{id} GET: Error downloading file: ${error.message}` }),
    };
  }
};
