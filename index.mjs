import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { spawn } from "child_process"; // Import child_process to run commands

const s3 = new S3Client({ region: "us-east-1" });

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const bucketName = "acmeregistrys3";
  const key = event.pathParameters.id;
  const commandArg = event.queryStringParameters?.command || ""; // Error if not argument is provided

  if (commandArg === "") {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: `Error: No command argument provided` }),
    };
  }

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    // Generate a pre-signed URL
    const signedUrl = await getSignedUrl(s3, new GetObjectCommand(params), {
      expiresIn: 300,
    });

    console.log(`Pre-signed URL generated successfully: ${signedUrl}`);

    // Run the `./run` executable with the selected argument
    const output = await runExecutable(commandArg);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ downloadUrl: signedUrl, output }),
    };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: `Error: ${error.message}` }),
    };
  }
};

// Function to execute the `./run` command with a specified argument
async function runExecutable(arg) {
  return new Promise((resolve, reject) => {
    const process = spawn("./run", [arg]); // Spawn the executable with the argument

    let output = "";

    // Collect output data
    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Collect error data
    process.stderr.on("data", (data) => {
      output += data.toString();
    });

    // Resolve or reject based on process exit
    process.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command exited with code ${code}: ${output}`));
      }
    });
  });
}
