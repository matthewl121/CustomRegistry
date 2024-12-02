/**
 * Utility function to create an HTTP response.
 *
 * @param {number} statusCode - The HTTP status code to return.
 * @param {Object} body - The response body as a JSON object.
 * @returns {Object} The HTTP response object.
 */
export const createResponse = (statusCode, body) => {
    return {
	statusCode,
        headers: {
            "Content-Type": "application/json",
        },
	body: JSON.stringify(body),
    };
};