"use strict";
/**
* apiUtils.ts
* Utility functions for making HTTP requests to APIs with retry logic and rate limiting
* Includes GET and POST request handlers with configurable retry attempts and delays
* Handles authentication tokens, rate limits, and error responses
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiPostRequest = exports.apiGetRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const log_1 = require("../utils/log");
// Helper function to add delay between retries
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Makes GET request with retry logic and rate limit handling
const apiGetRequest = async (url, // API endpoint URL
token, // Optional auth token
retries = 10, // Number of retry attempts 
retryDelay = 2000 // Delay between retries in ms
) => {
    try {
        // Set request headers
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        };
        let response = await axios_1.default.get(url, config);
        // Handle 202 status - retry after delay
        if (response.status === 202 && retries > 0) {
            (0, log_1.logToFile)(`Received 202, retrying in ${retryDelay / 1000} seconds...`, 1);
            await delay(retryDelay);
            return await (0, exports.apiGetRequest)(url, token, retries - 1, retryDelay);
        }
        return { data: response.data, error: null };
    }
    catch (error) {
        // Handle rate limits (403/429)
        if (error.response?.status === 403 || error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;
            if (retries > 0) {
                (0, log_1.logToFile)(`Rate limit hit, retrying in ${waitTime / 1000} seconds...`, 1);
                await delay(waitTime);
                return await (0, exports.apiGetRequest)(url, token, retries - 1, retryDelay * 2);
            }
        }
        // Log error and return error response
        (0, log_1.logToFile)(`Error details: ${error.response?.data || error.message || error}`, 1);
        return {
            data: null,
            error: error.response?.data?.message || error.message || 'Something went wrong'
        };
    }
};
exports.apiGetRequest = apiGetRequest;
// Makes POST request with retry logic and rate limit handling
const apiPostRequest = async (url, // API endpoint URL
data, // POST request body
token, // Optional auth token
retries = 10, // Number of retry attempts
retryDelay = 2000 // Delay between retries in ms
) => {
    try {
        // Set request headers
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        };
        const response = await axios_1.default.post(url, data, config);
        return { data: response.data, error: null };
    }
    catch (error) {
        // Handle rate limits (403/429)
        if (error.response?.status === 403 || error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;
            if (retries > 0) {
                (0, log_1.logToFile)(`Rate limit hit, retrying in ${waitTime / 1000} seconds...`, 1);
                await delay(waitTime);
                return await (0, exports.apiPostRequest)(url, data, token, retries - 1, retryDelay * 2);
            }
        }
        // Log error and return error response
        (0, log_1.logToFile)(`Error details: ${error.response?.data || error.message || error}`, 1);
        return {
            data: null,
            error: error.response?.data?.message || error.message || 'Something went wrong'
        };
    }
};
exports.apiPostRequest = apiPostRequest;
//# sourceMappingURL=apiUtils.js.map