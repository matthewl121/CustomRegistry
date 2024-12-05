import type * as ts from 'typescript';
import type * as swcWasm from '@swc/wasm';
import type * as swcTypes from '@swc/core';
import type { CreateTranspilerOptions, Transpiler } from './types';
import type { NodeModuleEmitKind } from '..';
type SwcInstance = typeof swcTypes;
export interface SwcTranspilerOptions extends CreateTranspilerOptions {
    /**
     * swc compiler to use for compilation
     * Set to '@swc/wasm' to use swc's WASM compiler
     * Default: '@swc/core', falling back to '@swc/wasm'
     */
    swc?: string | typeof swcWasm;
}
export declare function create(createOptions: SwcTranspilerOptions): Transpiler;
/** @internal */
export declare const targetMapping: Map<ts.ScriptTarget, "es5" | "es2020" | "esnext" | "es3" | "es2015" | "es2016" | "es2017" | "es2018" | "es2019" | "es2021" | "es2022">;
/**
 * Prepare SWC options derived from typescript compiler options.
 * @internal exported for testing
 */
export declare function createSwcOptions(compilerOptions: ts.CompilerOptions, nodeModuleEmitKind: NodeModuleEmitKind | undefined, swcInstance: SwcInstance, swcDepName: string): {
    nonTsxOptions: swcTypes.Options;
    tsxOptions: swcTypes.Options;
};
export {};
//# sourceMappingURL=swc.d.ts.map