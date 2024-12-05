type RequestOptions = {
    headers?: Record<string, string>;
    body?: Record<string, any>;
};
export declare const apiGet: (endpoint: string, options?: RequestOptions) => Promise<any>;
export declare const apiPost: (endpoint: string, options?: RequestOptions) => Promise<any>;
export declare const apiPut: (endpoint: string, options?: RequestOptions) => Promise<any>;
export declare const apiDelete: (endpoint: string, options?: RequestOptions) => Promise<any>;
export {};
//# sourceMappingURL=api.d.ts.map