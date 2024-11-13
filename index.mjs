import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Lambda handler function
 * @param {Object} event - The event object passed to the Lambda function, expected to contain a 'url' parameter.
 * @returns {Promise<Object>} - The result of the execution or an error message.
 */
export const handler = async (event) => {
    const { url } = event.pathParameters.id;

    if (!url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'URL parameter is required' }),
        };
    }

    // Path to the node_modules directory
    const nodeModulesPath = path.resolve('./node_modules');

    // Check if node_modules exists and install if not
    if (!fs.existsSync(nodeModulesPath)) {
        console.log('node_modules not found, running npm install --production...');
        return new Promise((resolve, reject) => {
            exec('npm install --production', (error, stdout, stderr) => {
                if (error) {
                    console.error(`npm install error: ${stderr}`);
                    return resolve({
                        statusCode: 500,
                        body: JSON.stringify({ message: 'Error running npm install', error: stderr }),
                    });
                }

                console.log('npm install complete, proceeding with script execution...');
                // After installing, run the script
                exec(`./run "${url}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Execution error: ${stderr}`);
                        return resolve({
                            statusCode: 500,
                            body: JSON.stringify({ message: 'Error executing run script', error: stderr }),
                        });
                    }

                    resolve({
                        statusCode: 200,
                        body: JSON.stringify({ message: 'Execution successful', output: stdout }),
                    });
                });
            });
        });
    } else {
        // If node_modules exists, skip npm install and directly run the script
        return new Promise((resolve, reject) => {
            exec(`./run "${url}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Execution error: ${stderr}`);
                    return resolve({
                        statusCode: 500,
                        body: JSON.stringify({ message: 'Error executing run script', error: stderr }),
                    });
                }

                resolve({
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Execution successful', output: stdout }),
                });
            });
        });
    }
};
