import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { spawn, execSync } from "child_process"; // Import child_process to run commands

const s3 = new S3Client({ region: "us-east-1" });


export const handler = async (event) => {
  if (process.env.RUN_INSTALL_ON_DEPLOY === 'true') {
    try {
      execSync('./run install', { stdio: 'inherit' });
      console.log('Install command executed successfully.');
    } catch (error) {
      console.error('Error running install command:', error);
    }
  }

  console.log("Received event:", JSON.stringify(event, null, 2));

  const bucketName = "acmeregistrys3";
  const commandArg = event.pathParameters.id; // Get argument (e.g., "install")

  const params = {
    Bucket: bucketName,
    Key: commandArg, // Assuming the key in S3 matches the command argument
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
