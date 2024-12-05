import type Module = require('module');
import type { Service } from '.';
/** @internal */
export type ModuleConstructorWithInternals = typeof Module & {
    _resolveFilename(request: string, parent?: Module, isMain?: boolean, options?: ModuleResolveFilenameOptions, ...rest: any[]): string;
    _preloadModules(requests?: string[]): void;
    _findPath(request: string, paths: string[], isMain: boolean): string;
};
interface ModuleResolveFilenameOptions {
    paths?: Array<string>;
}
/**
 * @internal
 */
export declare function installCommonjsResolveHooksIfNecessary(tsNodeService: Service): void;
export {};
//# sourceMappingURL=cjs-resolve-hooks.d.ts.map