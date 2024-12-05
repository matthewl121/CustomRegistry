export namespace codes {
    let ERR_INPUT_TYPE_NOT_ALLOWED: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_INVALID_ARG_VALUE: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_INVALID_MODULE_SPECIFIER: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_INVALID_PACKAGE_CONFIG: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_INVALID_PACKAGE_TARGET: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_MANIFEST_DEPENDENCY_MISSING: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_MODULE_NOT_FOUND: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_PACKAGE_IMPORT_NOT_DEFINED: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_PACKAGE_PATH_NOT_EXPORTED: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_UNSUPPORTED_DIR_IMPORT: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_UNSUPPORTED_ESM_URL_SCHEME: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    let ERR_UNKNOWN_FILE_EXTENSION: {
        new (...args: any[]): {
            name: string;
            message: string;
            stack?: string;
            cause?: unknown;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
}
export function createErrRequireEsm(filename: any, parentPath: any, packageJsonPath: any): Error;
//# sourceMappingURL=node-internal-errors.d.ts.map