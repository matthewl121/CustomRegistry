import { BaseError } from 'make-error';
import type * as _ts from 'typescript';
import { ProjectLocalResolveHelper } from './util';
import { findAndReadConfig } from './configuration';
import type { TSCommon } from './ts-compiler-types';
import { ModuleTypeClassifier } from './module-type-classifier';
import type { createEsmHooks as createEsmHooksFn } from './esm';
import { Extensions } from './file-extensions';
export { TSCommon };
export { createRepl, CreateReplOptions, ReplService, EvalAwarePartialHost } from './repl';
export type { TranspilerModule, TranspilerFactory, CreateTranspilerOptions, TranspileOutput, TranspileOptions, Transpiler, } from './transpilers/types';
export type { NodeLoaderHooksAPI1, NodeLoaderHooksAPI2, NodeLoaderHooksFormat } from './esm';
/**
 * Registered `ts-node` instance information.
 */
export declare const REGISTER_INSTANCE: unique symbol;
/**
 * Expose `REGISTER_INSTANCE` information on node.js `process`.
 */
declare global {
    namespace NodeJS {
        interface Process {
            [REGISTER_INSTANCE]?: Service;
        }
    }
}
/** @internal */
export declare const env: ProcessEnv;
/**
 * Declare all env vars, to aid discoverability.
 * If an env var affects ts-node's behavior, it should not be buried somewhere in our codebase.
 * @internal
 */
export interface ProcessEnv {
    TS_NODE_DEBUG?: string;
    TS_NODE_CWD?: string;
    /** @deprecated */
    TS_NODE_DIR?: string;
    TS_NODE_EMIT?: string;
    TS_NODE_SCOPE?: string;
    TS_NODE_SCOPE_DIR?: string;
    TS_NODE_FILES?: string;
    TS_NODE_PRETTY?: string;
    TS_NODE_COMPILER?: string;
    TS_NODE_COMPILER_OPTIONS?: string;
    TS_NODE_IGNORE?: string;
    TS_NODE_PROJECT?: string;
    TS_NODE_SKIP_PROJECT?: string;
    TS_NODE_SKIP_IGNORE?: string;
    TS_NODE_PREFER_TS_EXTS?: string;
    TS_NODE_IGNORE_DIAGNOSTICS?: string;
    TS_NODE_TRANSPILE_ONLY?: string;
    TS_NODE_TYPE_CHECK?: string;
    TS_NODE_COMPILER_HOST?: string;
    TS_NODE_LOG_ERROR?: string;
    TS_NODE_HISTORY?: string;
    TS_NODE_EXPERIMENTAL_REPL_AWAIT?: string;
    NODE_NO_READLINE?: string;
}
/**
 * @internal
 */
export declare const INSPECT_CUSTOM: symbol;
/** @internal */
export declare const debug: (...args: any) => void;
/**
 * Export the current version.
 */
export declare const VERSION: any;
/**
 * Options for creating a new TypeScript compiler instance.

 * @category Basic
 */
export interface CreateOptions {
    /**
     * Behave as if invoked within this working directory.  Roughly equivalent to `cd $dir && ts-node ...`
     *
     * @default process.cwd()
     */
    cwd?: string;
    /**
     * Legacy alias for `cwd`
     *
     * @deprecated use `projectSearchDir` or `cwd`
     */
    dir?: string;
    /**
     * Emit output files into `.ts-node` directory.
     *
     * @default false
     */
    emit?: boolean;
    /**
     * Scope compiler to files within `scopeDir`.
     *
     * @default false
     */
    scope?: boolean;
    /**
     * @default First of: `tsconfig.json` "rootDir" if specified, directory containing `tsconfig.json`, or cwd if no `tsconfig.json` is loaded.
     */
    scopeDir?: string;
    /**
     * Use pretty diagnostic formatter.
     *
     * @default false
     */
    pretty?: boolean;
    /**
     * Use TypeScript's faster `transpileModule`.
     *
     * @default false
     */
    transpileOnly?: boolean;
    /**
     * **DEPRECATED** Specify type-check is enabled (e.g. `transpileOnly == false`).
     *
     * @default true
     */
    typeCheck?: boolean;
    /**
     * Use TypeScript's compiler host API instead of the language service API.
     *
     * @default false
     */
    compilerHost?: boolean;
    /**
     * Logs TypeScript errors to stderr instead of throwing exceptions.
     *
     * @default false
     */
    logError?: boolean;
    /**
     * Load "files" and "include" from `tsconfig.json` on startup.
     *
     * Default is to override `tsconfig.json` "files" and "include" to only include the entrypoint script.
     *
     * @default false
     */
    files?: boolean;
    /**
     * Specify a custom TypeScript compiler.
     *
     * @default "typescript"
     */
    compiler?: string;
    /**
     * Specify a custom transpiler for use with transpileOnly
     */
    transpiler?: string | [string, object];
    /**
     * Transpile with swc instead of the TypeScript compiler, and skip typechecking.
     *
     * Equivalent to setting both `transpileOnly: true` and `transpiler: 'ts-node/transpilers/swc'`
     *
     * For complete instructions: https://typestrong.org/ts-node/docs/transpilers
     */
    swc?: boolean;
    /**
     * Paths which should not be compiled.
     *
     * Each string in the array is converted to a regular expression via `new RegExp()` and tested against source paths prior to compilation.
     *
     * Source paths are normalized to posix-style separators, relative to the directory containing `tsconfig.json` or to cwd if no `tsconfig.json` is loaded.
     *
     * Default is to ignore all node_modules subdirectories.
     *
     * @default ["(?:^|/)node_modules/"]
     */
    ignore?: string[];
    /**
     * Path to TypeScript config file or directory containing a `tsconfig.json`.
     * Similar to the `tsc --project` flag: https://www.typescriptlang.org/docs/handbook/compiler-options.html
     */
    project?: string;
    /**
     * Search for TypeScript config file (`tsconfig.json`) in this or parent directories.
     */
    projectSearchDir?: string;
    /**
     * Skip project config resolution and loading.
     *
     * @default false
     */
    skipProject?: boolean;
    /**
     * Skip ignore check, so that compilation will be attempted for all files with matching extensions.
     *
     * @default false
     */
    skipIgnore?: boolean;
    /**
     * JSON object to merge with TypeScript `compilerOptions`.
     *
     * @allOf [{"$ref": "https://schemastore.azurewebsites.net/schemas/json/tsconfig.json#definitions/compilerOptionsDefinition/properties/compilerOptions"}]
     */
    compilerOptions?: object;
    /**
     * Ignore TypeScript warnings by diagnostic code.
     */
    ignoreDiagnostics?: Array<number | string>;
    /**
     * Modules to require, like node's `--require` flag.
     *
     * If specified in `tsconfig.json`, the modules will be resolved relative to the `tsconfig.json` file.
     *
     * If specified programmatically, each input string should be pre-resolved to an absolute path for
     * best results.
     */
    require?: Array<string>;
    readFile?: (path: string) => string | undefined;
    fileExists?: (path: string) => boolean;
    transformers?: _ts.CustomTransformers | ((p: _ts.Program) => _ts.CustomTransformers);
    /**
     * Allows the usage of top level await in REPL.
     *
     * Uses node's implementation which accomplishes this with an AST syntax transformation.
     *
     * Enabled by default when tsconfig target is es2018 or above. Set to false to disable.
     *
     * **Note**: setting to `true` when tsconfig target is too low will throw an Error.  Leave as `undefined`
     * to get default, automatic behavior.
     */
    experimentalReplAwait?: boolean;
    /**
     * Override certain paths to be compiled and executed as CommonJS or ECMAScript modules.
     * When overridden, the tsconfig "module" and package.json "type" fields are overridden, and
     * the file extension is ignored.
     * This is useful if you cannot use .mts, .cts, .mjs, or .cjs file extensions;
     * it achieves the same effect.
     *
     * Each key is a glob pattern following the same rules as tsconfig's "include" array.
     * When multiple patterns match the same file, the last pattern takes precedence.
     *
     * `cjs` overrides matches files to compile and execute as CommonJS.
     * `esm` overrides matches files to compile and execute as native ECMAScript modules.
     * `package` overrides either of the above to default behavior, which obeys package.json "type" and
     * tsconfig.json "module" options.
     */
    moduleTypes?: ModuleTypes;
    /**
     * @internal
     * Set by our configuration loader whenever a config file contains options that
     * are relative to the config file they came from, *and* when other logic needs
     * to know this.  Some options can be eagerly resolved to absolute paths by
     * the configuration loader, so it is *not* necessary for their source to be set here.
     */
    optionBasePaths?: OptionBasePaths;
    /**
     * A function to collect trace messages from the TypeScript compiler, for example when `traceResolution` is enabled.
     *
     * @default console.log
     */
    tsTrace?: (str: string) => void;
    /**
     * Enable native ESM support.
     *
     * For details, see https://typestrong.org/ts-node/docs/imports#native-ecmascript-modules
     */
    esm?: boolean;
    /**
     * Re-order file extensions so that TypeScript imports are preferred.
     *
     * For example, when both `index.js` and `index.ts` exist, enabling this option causes `require('./index')` to resolve to `index.ts` instead of `index.js`
     *
     * @default false
     */
    preferTsExts?: boolean;
    /**
     * Like node's `--experimental-specifier-resolution`, , but can also be set in your `tsconfig.json` for convenience.
     *
     * For details, see https://nodejs.org/dist/latest-v18.x/docs/api/esm.html#customizing-esm-specifier-resolution-algorithm
     */
    experimentalSpecifierResolution?: 'node' | 'explicit';
    /**
     * Allow using voluntary `.ts` file extension in import specifiers.
     *
     * Typically, in ESM projects, import specifiers must have an emit extension, `.js`, `.cjs`, or `.mjs`,
     * and we automatically map to the corresponding `.ts`, `.cts`, or `.mts` source file.  This is the
     * recommended approach.
     *
     * However, if you really want to use `.ts` in import specifiers, and are aware that this may
     * break tooling, you can enable this flag.
     */
    experimentalTsImportSpecifiers?: boolean;
}
export type ModuleTypes = Record<string, ModuleTypeOverride>;
export type ModuleTypeOverride = 'cjs' | 'esm' | 'package';
/** @internal */
export interface OptionBasePaths {
    moduleTypes?: string;
    transpiler?: string;
    compiler?: string;
    swc?: string;
}
/**
 * Options for registering a TypeScript compiler instance globally.

 * @category Basic
 */
export interface RegisterOptions extends CreateOptions {
    /**
     * Enable experimental features that re-map imports and require calls to support:
     * `baseUrl`, `paths`, `rootDirs`, `.js` to `.ts` file extension mappings,
     * `outDir` to `rootDir` mappings for composite projects and monorepos.
     *
     * For details, see https://github.com/TypeStrong/ts-node/issues/1514
     */
    experimentalResolver?: boolean;
}
export type ExperimentalSpecifierResolution = 'node' | 'explicit';
/**
 * Must be an interface to support `typescript-json-schema`.
 */
export interface TsConfigOptions extends Omit<RegisterOptions, 'transformers' | 'readFile' | 'fileExists' | 'skipProject' | 'project' | 'dir' | 'cwd' | 'projectSearchDir' | 'optionBasePaths' | 'tsTrace'> {
}
/**
 * Information retrieved from type info check.
 */
export interface TypeInfo {
    name: string;
    comment: string;
}
/**
 * Default register options, including values specified via environment
 * variables.
 * @internal
 */
export declare const DEFAULTS: RegisterOptions;
/**
 * TypeScript diagnostics error.
 */
export declare class TSError extends BaseError {
    [x: symbol]: () => string;
    diagnosticCodes: number[];
    name: string;
    diagnosticText: string;
    diagnostics: ReadonlyArray<_ts.Diagnostic>;
    constructor(diagnosticText: string, diagnosticCodes: number[], diagnostics?: ReadonlyArray<_ts.Diagnostic>);
}
declare const TS_NODE_SERVICE_BRAND: unique symbol;
/**
 * Primary ts-node service, which wraps the TypeScript API and can compile TypeScript to JavaScript
 */
export interface Service {
    /** @internal */
    [TS_NODE_SERVICE_BRAND]: true;
    ts: TSCommon;
    /** @internal */
    compilerPath: string;
    config: _ts.ParsedCommandLine;
    options: RegisterOptions;
    enabled(enabled?: boolean): boolean;
    ignored(fileName: string): boolean;
    compile(code: string, fileName: string, lineOffset?: number): string;
    getTypeInfo(code: string, fileName: string, position: number): TypeInfo;
    /** @internal */
    configFilePath: string | undefined;
    /** @internal */
    moduleTypeClassifier: ModuleTypeClassifier;
    /** @internal */
    readonly shouldReplAwait: boolean;
    /** @internal */
    addDiagnosticFilter(filter: DiagnosticFilter): void;
    /** @internal */
    installSourceMapSupport(): void;
    /** @internal */
    transpileOnly: boolean;
    /** @internal */
    projectLocalResolveHelper: ProjectLocalResolveHelper;
    /** @internal */
    getNodeEsmResolver: () => ReturnType<typeof import('../dist-raw/node-internal-modules-esm-resolve').createResolve>;
    /** @internal */
    getNodeEsmGetFormat: () => ReturnType<typeof import('../dist-raw/node-internal-modules-esm-get_format').createGetFormat>;
    /** @internal */
    getNodeCjsLoader: () => ReturnType<typeof import('../dist-raw/node-internal-modules-cjs-loader').createCjsLoader>;
    /** @internal */
    extensions: Extensions;
}
/**
 * Re-export of `Service` interface for backwards-compatibility
 * @deprecated use `Service` instead
 * @see {Service}
 */
export type Register = Service;
/** @internal */
export interface DiagnosticFilter {
    /** if true, filter applies to all files */
    appliesToAllFiles: boolean;
    /** Filter applies onto to these filenames.  Only used if appliesToAllFiles is false */
    filenamesAbsolute: string[];
    /** these diagnostic codes are ignored */
    diagnosticsIgnored: number[];
}
/**
 * Create a new TypeScript compiler instance and register it onto node.js
 *
 * @category Basic
 */
export declare function register(opts?: RegisterOptions): Service;
/**
 * Register TypeScript compiler instance onto node.js

 * @category Basic
 */
export declare function register(service: Service): Service;
/**
 * Create TypeScript compiler instance.
 *
 * @category Basic
 */
export declare function create(rawOptions?: CreateOptions): Service;
/** @internal */
export declare function createFromPreloadedConfig(foundConfigResult: ReturnType<typeof findAndReadConfig>): Service;
/**
 * Create an implementation of node's ESM loader hooks.
 *
 * This may be useful if you
 * want to wrap or compose the loader hooks to add additional functionality or
 * combine with another loader.
 *
 * Node changed the hooks API, so there are two possible APIs.  This function
 * detects your node version and returns the appropriate API.
 *
 * @category ESM Loader
 */
export declare const createEsmHooks: typeof createEsmHooksFn;
/**
 * When using `module: nodenext` or `module: node12`, there are two possible styles of emit depending in file extension or package.json "type":
 *
 * - CommonJS with dynamic imports preserved (not transformed into `require()` calls)
 * - ECMAScript modules with `import foo = require()` transformed into `require = createRequire(); const foo = require()`
 */
export type NodeModuleEmitKind = 'nodeesm' | 'nodecjs';
//# sourceMappingURL=index.d.ts.map