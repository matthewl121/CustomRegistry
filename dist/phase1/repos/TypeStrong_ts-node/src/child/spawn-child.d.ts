import type { BootstrapState } from '../bin';
/**
 * @internal
 * @param state Bootstrap state to be transferred into the child process.
 * @param targetCwd Working directory to be preserved when transitioning to
 *   the child process.
 */
export declare function callInChild(state: BootstrapState): void;
//# sourceMappingURL=spawn-child.d.ts.map