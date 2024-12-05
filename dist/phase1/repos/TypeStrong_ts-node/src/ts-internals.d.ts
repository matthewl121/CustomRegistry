import type * as _ts from 'typescript';
import type { TSCommon } from './ts-compiler-types';
/** @internal */
export declare const createTsInternals: (arg: TSCommon) => {
    getExtendsConfigPath: (extendedConfig: string, host: _ts.ParseConfigHost, basePath: string, errors: _ts.Push<_ts.Diagnostic>, createDiagnostic: (message: _ts.DiagnosticMessage, arg1?: string) => _ts.Diagnostic) => string | undefined;
};
/**
 * @internal
 * See also: getRegularExpressionForWildcard, which seems to do almost the same thing
 */
export declare function getPatternFromSpec(spec: string, basePath: string): string;
export declare function getUseDefineForClassFields(compilerOptions: _ts.CompilerOptions): boolean;
export declare function getEmitScriptTarget(compilerOptions: {
    module?: _ts.CompilerOptions['module'];
    target?: _ts.CompilerOptions['target'];
}): _ts.ScriptTarget;
//# sourceMappingURL=ts-internals.d.ts.map