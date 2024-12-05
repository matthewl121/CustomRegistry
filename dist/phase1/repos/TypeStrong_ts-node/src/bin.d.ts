#!/usr/bin/env node
/**
 * Main `bin` functionality.
 *
 * This file is split into a chain of functions (phases), each one adding to a shared state object.
 * This is done so that the next function can either be invoked in-process or, if necessary, invoked in a child process.
 *
 * The functions are intentionally given uncreative names and left in the same order as the original code, to make a
 * smaller git diff.
 *
 * @internal
 */
export declare function main(argv?: string[], entrypointArgs?: Record<string, any>): void;
/**
 * @internal
 * Describes state of CLI bootstrapping.
 * Can be marshalled when necessary to resume bootstrapping in a child process.
 */
export interface BootstrapState {
    isInChildProcess: boolean;
    shouldUseChildProcess: boolean;
    /**
     * True if bootstrapping the ts-node CLI process or the direct child necessitated by `--esm`.
     * false if bootstrapping a subsequently `fork()`ed child.
     */
    isCli: boolean;
    tsNodeScript: string;
    parseArgvResult: ReturnType<typeof parseArgv>;
    phase2Result?: ReturnType<typeof phase2>;
    phase3Result?: ReturnType<typeof phase3>;
}
/** @internal */
export declare function bootstrap(state: BootstrapState): void;
declare function parseArgv(argv: string[], entrypointArgs: Record<string, any>): {
    argv: string[];
    restArgs: string[];
    cwdArg: string | undefined;
    help: boolean;
    scriptMode: boolean | undefined;
    cwdMode: boolean | undefined;
    version: number;
    showConfig: boolean | undefined;
    argsRequire: string[];
    code: string | undefined;
    print: boolean;
    interactive: boolean;
    files: boolean | undefined;
    compiler: string | undefined;
    compilerOptions: object | undefined;
    project: string | undefined;
    ignoreDiagnostics: string[] | undefined;
    ignore: string[] | undefined;
    transpileOnly: boolean | undefined;
    typeCheck: boolean | undefined;
    transpiler: string | undefined;
    swc: boolean | undefined;
    compilerHost: boolean | undefined;
    pretty: boolean | undefined;
    skipProject: boolean | undefined;
    skipIgnore: boolean | undefined;
    preferTsExts: boolean | undefined;
    logError: boolean | undefined;
    emit: boolean | undefined;
    scope: boolean | undefined;
    scopeDir: string | undefined;
    noExperimentalReplAwait: boolean | undefined;
    experimentalSpecifierResolution: string | undefined;
    esm: boolean | undefined;
};
declare function phase2(payload: BootstrapState): {
    cwd: string;
};
declare function phase3(payload: BootstrapState): {
    preloadedConfig: {
        options: import("./index").RegisterOptions;
        config: import("typescript/lib/typescript").ParsedCommandLine;
        projectLocalResolveDir: string;
        optionBasePaths: import("./index").OptionBasePaths;
        configFilePath: string | undefined;
        cwd: string;
        compiler: string;
    };
};
export {};
//# sourceMappingURL=bin.d.ts.map