import type { ExecutionContext } from '../testlib';
/**
 * This helpers gives you an empty directory in the OS temp directory, *outside*
 * of the git clone.
 *
 * Some tests must run in a directory that is *outside* of the git clone.
 * When TS and ts-node search for a tsconfig, they traverse up the filesystem.
 * If they run inside our git clone, they will find the root tsconfig.json, and
 * we do not always want that.
 */
export declare function ctxTmpDirOutsideCheckout(t: ExecutionContext): Promise<{
    tmpDir: any;
    fixture: any;
}>;
export declare namespace ctxTmpDirOutsideCheckout {
    type Ctx = Awaited<ReturnType<typeof ctxTmpDirOutsideCheckout>>;
    type T = ExecutionContext<Ctx>;
}
export declare function ctxTmpDir(t: ExecutionContext): Promise<{
    fixture: any;
    tmpDir: any;
}>;
export declare namespace ctxTmpDir {
    type Ctx = Awaited<ReturnType<typeof ctxTmpDirOutsideCheckout>>;
    type T = ExecutionContext<Ctx>;
}
//# sourceMappingURL=ctx-tmp-dir.d.ts.map