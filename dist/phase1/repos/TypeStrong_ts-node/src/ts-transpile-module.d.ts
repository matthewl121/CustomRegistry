import type { TranspileOptions, TranspileOutput } from 'typescript';
import type { TSCommon } from './ts-compiler-types';
/** @internal */
export declare function createTsTranspileModule(ts: TSCommon, transpileOptions: Pick<TranspileOptions, 'compilerOptions' | 'reportDiagnostics' | 'transformers'>): (input: string, transpileOptions2: TranspileOptions, packageJsonType?: "module" | "commonjs") => TranspileOutput;
//# sourceMappingURL=ts-transpile-module.d.ts.map