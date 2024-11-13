import { exec } from 'child_process';

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

    return new Promise((resolve, reject) => {
        // Execute the `run` script with the provided URL
        exec(`./run "${url}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${stderr}`);
                return resolve({
                    statusCode: 500,
                    body: JSON.stringify({ message: 'Error executing run script', error: stderr }),
                });
            }

            // Parse stdout or format it as needed for the response
            resolve({
                statusCode: 200,
                body: JSON.stringify({ message: 'Execution successful', output: stdout }),
            });
        });
    });
};
