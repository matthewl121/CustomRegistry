export function getPackagesHandler(event: any): Promise<{
    statusCode: number;
    body: string;
    headers?: undefined;
} | {
    statusCode: number;
    headers: {
        "Content-Type": string;
    };
    body: string;
}>;
//# sourceMappingURL=packages.d.mts.map