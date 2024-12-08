/**
 * Utility function to create an HTTP response.
 *
 * @param {number} statusCode - The HTTP status code to return.
 * @param {Object} body - The response body as a JSON object.
 * @returns {Object} The HTTP response object.
 */
export const createResponse = (code, body) => {
    return {
	    statusCode: code,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
          },
	    body: JSON.stringify(body),
    };
};