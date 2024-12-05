import type { CreateOptions } from '.';
import type { Extensions } from './file-extensions';
import type { TSCommon } from './ts-compiler-types';
import type { ProjectLocalResolveHelper } from './util';
/**
 * @internal
 * In a factory because these are shared across both CompilerHost and LanguageService codepaths
 */
export declare function createResolverFunctions(kwargs: {
    ts: TSCommon;
    host: TSCommon.ModuleResolutionHost;
    cwd: string;
    getCanonicalFileName: (filename: string) => string;
    config: TSCommon.ParsedCommandLine;
    projectLocalResolveHelper: ProjectLocalResolveHelper;
    options: CreateOptions;
    extensions: Extensions;
}): {
    resolveModuleNames: (moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: import("typescript/lib/typescript").ResolvedProjectReference | undefined, options: import("typescript/lib/typescript").CompilerOptions, containingSourceFile?: import("typescript/lib/typescript").SourceFile) => (import("typescript/lib/typescript").ResolvedModule | undefined)[];
    getResolvedModuleWithFailedLookupLocationsFromCache: (modulename: string, containingFile: string, resolutionMode?: import("typescript/lib/typescript").ResolutionMode) => import("typescript/lib/typescript").ResolvedModuleWithFailedLookupLocations | undefined;
    resolveTypeReferenceDirectives: (typeDirectiveNames: string[] | import("typescript/lib/typescript").FileReference[], containingFile: string, redirectedReference: import("typescript/lib/typescript").ResolvedProjectReference | undefined, options: import("typescript/lib/typescript").CompilerOptions, containingFileMode?: import("typescript/lib/typescript").ResolutionMode) => (import("typescript/lib/typescript").ResolvedTypeReferenceDirective | undefined)[];
    isFileKnownToBeInternal: (filename: string) => boolean;
    markBucketOfFilenameInternal: (filename: string) => void;
};
//# sourceMappingURL=resolver-functions.d.ts.map