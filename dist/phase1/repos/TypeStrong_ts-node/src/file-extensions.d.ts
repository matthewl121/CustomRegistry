import type * as _ts from 'typescript';
import type { RegisterOptions } from '.';
/**
 * Centralized specification of how we deal with file extensions based on
 * project options:
 * which ones we do/don't support, in what situations, etc.  These rules drive
 * logic elsewhere.
 * @internal
 * */
export type Extensions = ReturnType<typeof getExtensions>;
export declare function tsSupportsMtsCtsExts(tsVersion: string): boolean;
/**
 * [MUST_UPDATE_FOR_NEW_FILE_EXTENSIONS]
 * @internal
 */
export declare function getExtensions(config: _ts.ParsedCommandLine, options: RegisterOptions, tsVersion: string): {
    /** All file extensions we transform, ordered by resolution preference according to preferTsExts */
    compiled: string[];
    /** Resolved extensions that vanilla node will not understand; we should handle them */
    nodeDoesNotUnderstand: readonly string[];
    /** Like the above, but only the ones we're compiling */
    compiledNodeDoesNotUnderstand: string[];
    /**
     * Mapping from extensions understood by tsc to the equivalent for node,
     * as far as getFormat is concerned.
     */
    nodeEquivalents: Map<string, string>;
    /**
     * Mapping from extensions rejected by TSC in import specifiers, to the
     * possible alternatives that TS's resolver will accept.
     *
     * When we allow users to opt-in to .ts extensions in import specifiers, TS's
     * resolver requires us to replace the .ts extensions with .js alternatives.
     * Otherwise, resolution fails.
     *
     * Note TS's resolver is only used by, and only required for, typechecking.
     * This is separate from node's resolver, which we hook separately and which
     * does not require this mapping.
     */
    tsResolverEquivalents: Map<string, readonly string[]>;
    /**
     * Extensions that we can support if the user upgrades their typescript version.
     * Used when raising hints.
     */
    requiresHigherTypescriptVersion: string[];
    /**
     * --experimental-specifier-resolution=node will add these extensions.
     */
    experimentalSpecifierResolutionAddsIfOmitted: string[];
    /**
     * ESM loader will add these extensions to package.json "main" field
     */
    legacyMainResolveAddsIfOmitted: string[];
    replacementsForMjs: string[];
    replacementsForCjs: string[];
    replacementsForJsx: string[];
    replacementsForJs: string[];
};
//# sourceMappingURL=file-extensions.d.ts.map