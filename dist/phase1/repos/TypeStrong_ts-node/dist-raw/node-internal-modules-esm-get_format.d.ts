/**
 *
 * @param {'node' | 'explicit'} [tsNodeExperimentalSpecifierResolution]
 * @param {ReturnType<
 *  typeof import('../dist-raw/node-internal-modules-esm-resolve').createResolve
 * >} nodeEsmResolver
 */
export function createGetFormat(tsNodeExperimentalSpecifierResolution?: "node" | "explicit", nodeEsmResolver: ReturnType<typeof import("../dist-raw/node-internal-modules-esm-resolve").createResolve>): {
    defaultGetFormat: (url: string, context: {}, defaultGetFormatUnused: any) => ReturnType<import("../src/esm").NodeLoaderHooksAPI1.GetFormatHook>;
};
//# sourceMappingURL=node-internal-modules-esm-get_format.d.ts.map