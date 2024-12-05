import type { ModuleTypes } from '.';
/**
 * Seperate internal type because `auto` is clearer than `package`, but changing
 * the public API is a breaking change.
 * @internal
 */
export type InternalModuleTypeOverride = 'cjs' | 'esm' | 'auto';
/** @internal */
export interface ModuleTypeClassification {
    moduleType: InternalModuleTypeOverride;
}
/** @internal */
export interface ModuleTypeClassifierOptions {
    basePath?: string;
    patterns?: ModuleTypes;
}
/** @internal */
export type ModuleTypeClassifier = ReturnType<typeof createModuleTypeClassifier>;
/**
 * @internal
 * May receive non-normalized options -- basePath and patterns -- and will normalize them
 * internally.
 * However, calls to `classifyModule` must pass pre-normalized paths!
 */
export declare function createModuleTypeClassifier(options: ModuleTypeClassifierOptions): {
    classifyModuleByModuleTypeOverrides: (arg: string) => ModuleTypeClassification;
};
//# sourceMappingURL=module-type-classifier.d.ts.map