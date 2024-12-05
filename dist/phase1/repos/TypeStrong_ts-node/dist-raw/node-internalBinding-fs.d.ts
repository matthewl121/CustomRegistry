/**
 * @param {string} path
 * @returns {[] | [string, boolean]}
 */
export function internalModuleReadJSON(path: string): [] | [string, boolean];
/**
 * @param {string} path
 * @returns {number} 0 = file, 1 = dir, negative = error
 */
export declare function internalModuleStat(path: string): number;
//# sourceMappingURL=node-internalBinding-fs.d.ts.map