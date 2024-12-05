/**
 * @param {{
 *   nodeEsmResolver: ReturnType<typeof import('./node-internal-modules-esm-resolve').createResolve>,
 *   extensions: import('../src/file-extensions').Extensions,
 *   preferTsExts
 * }} opts
 */
export function createCjsLoader(opts: {
    nodeEsmResolver: ReturnType<typeof import("./node-internal-modules-esm-resolve").createResolve>;
    extensions: import("../src/file-extensions").Extensions;
    preferTsExts: any;
}): {
    Module_findPath: (request: any, paths: any, isMain: any) => any;
    Module_resolveFilename: (request: any, parent: any, isMain: any, options: any) => any;
};
/**
 * copied from Module._extensions['.js']
 * https://github.com/nodejs/node/blob/v15.3.0/lib/internal/modules/cjs/loader.js#L1113-L1120

 * Assert that script can be loaded as CommonJS when we attempt to require it.
 * If it should be loaded as ESM, throw ERR_REQUIRE_ESM like node does.
 *
 * @param {import('../src/index').Service} service
 * @param {NodeJS.Module} module
 * @param {string} filename
 */
export function assertScriptCanLoadAsCJS(service: import("../src/index").Service, module: NodeJS.Module, filename: string): void;
export function readPackageScope(checkPath: any): false | {
    data: any;
    path: any;
};
//# sourceMappingURL=node-internal-modules-cjs-loader.d.ts.map