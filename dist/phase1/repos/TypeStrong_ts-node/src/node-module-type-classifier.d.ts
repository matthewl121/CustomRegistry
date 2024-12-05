/**
 * Determine how to emit a module based on tsconfig "module" and package.json "type"
 *
 * Supports module=nodenext/node16 with transpileOnly, where we cannot ask the
 * TS typechecker to tell us if a file is CJS or ESM.
 *
 * Return values indicate:
 * - cjs
 * - esm
 * - nodecjs == node-flavored cjs where dynamic imports are *not* transformed into `require()`
 * - undefined == emit according to tsconfig `module` config, whatever that is
 * @internal
 */
export declare function classifyModule(nativeFilename: string, isNodeModuleType: boolean): 'nodecjs' | 'cjs' | 'esm' | 'nodeesm' | undefined;
//# sourceMappingURL=node-module-type-classifier.d.ts.map