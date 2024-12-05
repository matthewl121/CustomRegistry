/**
* apiUtils.ts
* Utility functions for making HTTP requests to APIs with retry logic and rate limiting
* Includes GET and POST request handlers with configurable retry attempts and delays
* Handles authentication tokens, rate limits, and error responses
*/
import { ApiResponse } from '../types';
export declare const apiGetRequest: <T>(url: string, token?: string, retries?: number, retryDelay?: number) => Promise<ApiResponse<T>>;
export declare const apiPostRequest: <T>(url: string, data: any, token?: string, retries?: number, retryDelay?: number) => Promise<ApiResponse<T>>;
//# sourceMappingURL=apiUtils.d.ts.map