// api.ts
// PROD URL: "http://ec2-34-239-114-173.compute-1.amazonaws.com:5000"
const BASE_URL = "http://ec2-34-239-114-173.compute-1.amazonaws.com:5000";

type RequestOptions = {
  headers?: Record<string, string>;
  body?: Record<string, any>;
};

// Helper function to handle response and errors
const handleResponse = async (response: Response) => {
  console.log("Handling response:", response);
  console.log("Response status:", response.status); // Print the response status code

  // If the response status is not OK (not in the 2xx range)
  if (!response.ok) {
    // Try to parse and log the error message, or fallback to status text
    const error = await response.json().catch(() => response.statusText);
    console.error("Error response:", error); // Log the error
    throw new Error(error.message || response.statusText);
  }

  // Print the response body as text for debugging (whether it's empty or not)
  const bodyText = await response.text();
  console.log("Response body:", bodyText); // Log the body

  // If there's no content in the response, return an empty object
  if (response.status === 200 && !bodyText) {
    return {};  // Return empty object if status is 200 and the body is empty
  }

  // Try to parse the response as JSON if the body exists
  try {
    const data = JSON.parse(bodyText); // Using JSON.parse() instead of response.json() directly
    return data;
  } catch (error) {
    console.error('Error parsing response as JSON:', error);
    throw new Error('Failed to parse response as JSON');
  }
};


// GET request
export const apiGet = async (endpoint: string, options?: RequestOptions) => {
  try {
    console.log(`${BASE_URL}${endpoint}`)
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
};

// POST request
export const apiPost = async (endpoint: string, options?: RequestOptions) => {
  try {
    console.log("Payload being sent:", JSON.stringify(options?.body)); // Log the body before sending
    console.log(`${BASE_URL}${endpoint}`)
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(options?.body),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
};

// PUT request
export const apiPut = async (endpoint: string, options?: RequestOptions) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(options?.body),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('PUT request failed:', error);
    throw error;
  }
};

// DELETE request
export const apiDelete = async (endpoint: string, options?: RequestOptions) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('DELETE request failed:', error);
    throw error;
  }
};
