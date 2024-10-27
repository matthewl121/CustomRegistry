// top level code
import axios from 'axios';

const apiBaseUrl = 'https://6t3q6qnrv5.execute-api.us-east-1.amazonaws.com/test'; // Replace with your API Gateway base URL

// Define API functions for each Lambda

export async function callUpload() {
  try {
    const response = await axios.get(`${apiBaseUrl}/Upload`);
    return response.data;
  } catch (error) {
    console.error('Error calling Upload:', error);
    throw error;
  }
}

export async function callUpdate() {
  try {
    const response = await axios.get(`${apiBaseUrl}/Update`);
    return response.data;
  } catch (error) {
    console.error('Error calling Update:', error);
    throw error;
  }
}

export async function callDownload() {
  try {
    const response = await axios.get(`${apiBaseUrl}/Download`);
    return response.data;
  } catch (error) {
    console.error('Error calling Download:', error);
    throw error;
  }
}
