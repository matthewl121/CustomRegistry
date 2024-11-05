// api.ts
const BASE_URL = "https://6t3q6qnrv5.execute-api.us-east-1.amazonaws.com/dev";

type RequestOptions = {
  headers?: Record<string, string>;
  body?: Record<string, any>;
};

// Helper function to handle response and errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => response.statusText);
    throw new Error(error.message || response.statusText);
  }
  return response.json();
};

// GET request
export const apiGet = async (endpoint: string, options?: RequestOptions) => {
  try {
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
