import type * as _ts from 'typescript';
import { CreateOptions, OptionBasePaths, RegisterOptions, TSCommon, TsConfigOptions } from './index';
/** @internal */
export declare function findAndReadConfig(rawOptions: CreateOptions): {
    options: RegisterOptions;
    config: _ts.ParsedCommandLine;
    projectLocalResolveDir: string;
    optionBasePaths: OptionBasePaths;
    configFilePath: string | undefined;
    cwd: string;
    compiler: string;
};
/**
 * Load TypeScript configuration. Returns the parsed TypeScript config and
 * any `ts-node` options specified in the config file.
 *
 * Even when a tsconfig.json is not loaded, this function still handles merging
 * compilerOptions from various sources: API, environment variables, etc.
 *
 * @internal
 */
export declare function readConfig(cwd: string, ts: TSCommon, rawApiOptions: CreateOptions): {
    /**
     * Path of tsconfig file if one was loaded
     */
    configFilePath: string | undefined;
    /**
     * Parsed TypeScript configuration with compilerOptions merged from all other sources (env vars, etc)
     */
    config: _ts.ParsedCommandLine;
    /**
     * ts-node options pulled from `tsconfig.json`, NOT merged with any other sources.  Merging must happen outside
     * this function.
     */
    tsNodeOptionsFromTsconfig: TsConfigOptions;
    optionBasePaths: OptionBasePaths;
};
/**
 * Load the typescript compiler. It is required to load the tsconfig but might
 * be changed by the tsconfig, so we have to do this twice.
 * @internal
 */
export declare function resolveAndLoadCompiler(name: string | undefined, relativeToPath: string): {
    compiler: string;
    ts: TSCommon;
};
/** @internal */
export declare function loadCompiler(compiler: string): TSCommon;
/** @internal */
export declare const ComputeAsCommonRootOfFiles: unique symbol;
/**
 * Some TS compiler options have defaults which are not provided by TS's config parsing functions.
 * This function centralizes the logic for computing those defaults.
 * @internal
 */
export declare function getTsConfigDefaults(config: _ts.ParsedCommandLine, basePath: string, _files: string[] | undefined, _include: string[] | undefined, _exclude: string[] | undefined): {
    rootDir: string | symbol;
    outDir: string | symbol;
    include: string[];
    files: string[];
    exclude: (string | symbol)[];
    composite: boolean;
};
//# sourceMappingURL=configuration.d.ts.map