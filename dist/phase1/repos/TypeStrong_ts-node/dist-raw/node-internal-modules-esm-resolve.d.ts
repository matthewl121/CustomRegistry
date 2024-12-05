/**
 * @param {{
 *  extensions: import('../src/file-extensions').Extensions,
 *  preferTsExts: boolean | undefined;
 *  tsNodeExperimentalSpecifierResolution: import('../src/index').ExperimentalSpecifierResolution | undefined;
 * }} opts
 */
export function createResolve(opts: {
    extensions: import("../src/file-extensions").Extensions;
    preferTsExts: boolean | undefined;
    tsNodeExperimentalSpecifierResolution: import("../src/index").ExperimentalSpecifierResolution | undefined;
}): {
    DEFAULT_CONDITIONS: readonly any[];
    defaultResolve: (specifier: any, context: {} | undefined, defaultResolveUnused: any) => {
        url: any;
    };
    encodedSepRegEx: RegExp;
    getPackageType: (url: any) => any;
    packageExportsResolve: (packageJSONUrl: URL, packageSubpath: string, packageConfig: object, base: string, conditions: Set<string>) => {
        resolved: URL;
        exact: boolean;
    };
    packageImportsResolve: (name: any, base: any, conditions: any) => {
        resolved: any;
        exact: boolean;
    } | undefined;
};
import { URL } from "url";
//# sourceMappingURL=node-internal-modules-esm-resolve.d.ts.map