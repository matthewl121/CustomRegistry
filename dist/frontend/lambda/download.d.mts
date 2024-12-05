export function downloadPackageHandler(event: any): Promise<{
    statusCode: number;
    headers: {
        'Access-Control-Allow-Origin': string;
        'Access-Control-Allow-Methods': string;
        'Access-Control-Allow-Headers': string;
        'Content-Type'?: undefined;
    };
    body?: undefined;
} | {
    statusCode: number;
    headers: {
        'Access-Control-Allow-Origin': string;
        'Access-Control-Allow-Methods': string;
        'Access-Control-Allow-Headers': string;
        'Content-Type': string;
    };
    body: string;
} | {
    statusCode: number;
    headers: {
        'Access-Control-Allow-Origin': string;
        'Access-Control-Allow-Methods': string;
        'Access-Control-Allow-Headers': string;
        'Content-Type'?: undefined;
    };
    body: string;
}>;
//# sourceMappingURL=download.d.mts.map