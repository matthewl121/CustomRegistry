/**
* apiUtils.ts
* Utility functions for making HTTP requests to APIs with retry logic and rate limiting
* Includes GET and POST request handlers with configurable retry attempts and delays
* Handles authentication tokens, rate limits, and error responses
*/

import axios, { AxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';
import { writeFile } from '../utils/utils';
import { logToFile } from '../utils/log';

// Helper function to add delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Makes GET request with retry logic and rate limit handling
export const apiGetRequest = async <T>(
   url: string,                          // API endpoint URL
   token?: string,                       // Optional auth token
   retries: number = 10,                 // Number of retry attempts 
   retryDelay: number = 2000            // Delay between retries in ms
): Promise<ApiResponse<T>> => {
   try {
       // Set request headers
       const config: AxiosRequestConfig = {
           headers: {
               'Content-Type': 'application/json',
               ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
           },
       };

       let response = await axios.get<T>(url, config);

       // Handle 202 status - retry after delay
       if (response.status === 202 && retries > 0) {
           logToFile(`Received 202, retrying in ${retryDelay / 1000} seconds...`, 1);
           await delay(retryDelay);
           return await apiGetRequest<T>(url, token, retries - 1, retryDelay);
       }

       return { data: response.data, error: null };

   } catch (error: any) {
       // Handle rate limits (403/429)
       if (error.response?.status === 403 || error.response?.status === 429) {
           const retryAfter = error.response.headers['retry-after'];
           const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;

           if (retries > 0) {
               logToFile(`Rate limit hit, retrying in ${waitTime / 1000} seconds...`, 1);
               await delay(waitTime);
               return await apiGetRequest<T>(url, token, retries - 1, retryDelay * 2);
           }
       }

       // Log error and return error response
       logToFile(`Error details: ${error.response?.data || error.message || error}`, 1);
       return { 
           data: null, 
           error: error.response?.data?.message || error.message || 'Something went wrong' 
       };
   }
};

// Makes POST request with retry logic and rate limit handling
export const apiPostRequest = async <T>(
   url: string,                          // API endpoint URL
   data: any,                            // POST request body
   token?: string,                       // Optional auth token
   retries: number = 10,                 // Number of retry attempts
   retryDelay: number = 2000            // Delay between retries in ms
): Promise<ApiResponse<T>> => {
   try {
       // Set request headers
       const config: AxiosRequestConfig = {
           headers: {
               'Content-Type': 'application/json',
               ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
           },
       };

       const response = await axios.post<T>(url, data, config);
       return { data: response.data, error: null };

   } catch (error: any) {
       // Handle rate limits (403/429)
       if (error.response?.status === 403 || error.response?.status === 429) {
           const retryAfter = error.response.headers['retry-after'];
           const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;

           if (retries > 0) {
               logToFile(`Rate limit hit, retrying in ${waitTime / 1000} seconds...`, 1);
               await delay(waitTime);
               return await apiPostRequest<T>(url, data, token, retries - 1, retryDelay * 2);
           }
       }

       // Log error and return error response
       logToFile(`Error details: ${error.response?.data || error.message || error}`, 1);
       return {
           data: null,
           error: error.response?.data?.message || error.message || 'Something went wrong'
       };
   }
};