/**
 * @internal
 * Copied from https://unpkg.com/yn@3.1.1/index.js
 * Because people get weird when they see you have dependencies. /jk
 * This is a lazy way to make the dep number go down, we haven't touched this
 * dep in ages, and we didn't use all its features, so we stripped them.
 */
export declare function yn(input: string | undefined): boolean | undefined;
/**
 * Like `Object.assign`, but ignores `undefined` properties.
 *
 * @internal
 */
export declare function assign<T extends object>(initialValue: T, ...sources: Array<T>): T;
/**
 * Split a string array of values
 * and remove empty strings from the resulting array.
 * @internal
 */
export declare function split(value: string | undefined): string[] | undefined;
/**
 * Parse a string as JSON.
 * @internal
 */
export declare function parse(value: string | undefined): object | undefined;
/**
 * Replace backslashes with forward slashes.
 * @internal
 */
export declare function normalizeSlashes(value: string): string;
/**
 * Safe `hasOwnProperty`
 * @internal
 */
export declare function hasOwnProperty(object: any, property: string): boolean;
/**
 * Cached fs operation wrapper.
 */
export declare function cachedLookup<T, R>(fn: (arg: T) => R): (arg: T) => R;
/**
 * @internal
 * Require something with v8-compile-cache, which should make subsequent requires faster.
 * Do lots of error-handling so that, worst case, we require without the cache, and users are not blocked.
 */
export declare function attemptRequireWithV8CompileCache(requireFn: typeof require, specifier: string): any;
/**
 * Helper to discover dependencies relative to a user's project, optionally
 * falling back to relative to ts-node.  This supports global installations of
 * ts-node, for example where someone does `#!/usr/bin/env -S ts-node --swc` and
 * we need to fallback to a global install of @swc/core
 * @internal
 */
export declare function createProjectLocalResolveHelper(localDirectory: string): (specifier: string, fallbackToTsNodeRelative: boolean) => string;
/** @internal */
export type ProjectLocalResolveHelper = ReturnType<typeof createProjectLocalResolveHelper>;
/**
 * Used as a reminder of all the factors we must consider when finding project-local dependencies and when a config file
 * on disk may or may not exist.
 * @internal
 */
export declare function getBasePathForProjectLocalDependencyResolution(configFilePath: string | undefined, projectSearchDirOption: string | undefined, projectOption: string | undefined, cwdOption: string): string;
/** @internal */
export declare function once<Fn extends (...args: any[]) => any>(fn: Fn): (...args: Parameters<Fn>) => ReturnType<Fn>;
/** @internal */
export declare function versionGteLt(version: string, gteRequirement: string, ltRequirement?: string): boolean;
//# sourceMappingURL=util.d.ts.map