"use strict";
// ESM loader hook tests
// TODO: at the time of writing, other ESM loader hook tests have not been moved into this file.
// Should consolidate them here.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testlib_1 = require("./testlib");
const semver = require("semver");
const helpers_1 = require("./helpers");
const path_1 = require("path");
const expect = __importStar(require("expect"));
const url_1 = require("url");
const test = (0, testlib_1.context)(helpers_1.ctxTsNode);
const exec = (0, helpers_1.createExec)({
    cwd: helpers_1.TEST_DIR,
});
const spawn = (0, helpers_1.createSpawn)({
    cwd: helpers_1.TEST_DIR,
});
test.suite('esm', (test) => {
    test('should compile and execute as ESM', async () => {
        const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} index.ts`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm'),
        });
        expect(r.err).toBe(null);
        expect(r.stdout).toBe('foo bar baz biff libfoo\n');
    });
    test('should use source maps', async (t) => {
        const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} "throw error.ts"`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm'),
        });
        expect(r.err).not.toBe(null);
        const expectedModuleUrl = (0, url_1.pathToFileURL)((0, path_1.join)(helpers_1.TEST_DIR, './esm/throw error.ts')).toString();
        expect(r.err.message).toMatch([
            `${expectedModuleUrl}:100`,
            "  bar() { throw new Error('this is a demo'); }",
            '                ^',
            'Error: this is a demo',
            `    at Foo.bar (${expectedModuleUrl}:100:17)`,
        ].join('\n'));
    });
    test.suite('supports experimental-specifier-resolution=node', (test) => {
        test('via --experimental-specifier-resolution', async () => {
            const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} --experimental-specifier-resolution=node index.ts`, {
                cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-node-resolver'),
            });
            expect(r.err).toBe(null);
            expect(r.stdout).toBe('foo bar baz biff libfoo\n');
        });
        test('via NODE_OPTIONS', async () => {
            const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} index.ts`, {
                cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-node-resolver'),
                env: {
                    ...process.env,
                    NODE_OPTIONS: `--experimental-specifier-resolution=node`,
                },
            });
            expect(r.err).toBe(null);
            expect(r.stdout).toBe('foo bar baz biff libfoo\n');
        });
    });
    test('throws ERR_REQUIRE_ESM when attempting to require() an ESM script when ESM loader is enabled', async () => {
        const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} ./index.js`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-err-require-esm'),
        });
        expect(r.err).not.toBe(null);
        expect(r.stderr).toMatch('Error [ERR_REQUIRE_ESM]: Must use import to load ES Module:');
    });
    test('defers to fallback loaders when URL should not be handled by ts-node', async () => {
        const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} index.mjs`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-import-http-url'),
        });
        expect(r.err).not.toBe(null);
        // expect error from node's default resolver
        expect(r.stderr).toMatch(/Error \[ERR_UNSUPPORTED_ESM_URL_SCHEME\]:.*(?:\n.*){0,2}\n *at (defaultResolve|defaultLoad)/);
    });
    test('should bypass import cache when changing search params', async () => {
        const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} index.ts`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-import-cache'),
        });
        expect(r.err).toBe(null);
        expect(r.stdout).toBe('log1\nlog2\nlog2\n');
    });
    test('should support transpile only mode via dedicated loader entrypoint', async () => {
        const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT}/transpile-only index.ts`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-transpile-only'),
        });
        expect(r.err).toBe(null);
        expect(r.stdout).toBe('');
    });
    test('should throw type errors without transpile-only enabled', async () => {
        const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} index.ts`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-transpile-only'),
        });
        if (r.err === null) {
            throw new Error('Command was expected to fail, but it succeeded.');
        }
        expect(r.err.message).toMatch('Unable to compile TypeScript');
        expect(r.err.message).toMatch(new RegExp("TS2345: Argument of type '(?:number|1101)' is not assignable to parameter of type 'string'\\."));
        expect(r.err.message).toMatch(new RegExp("TS2322: Type '(?:\"hello world\"|string)' is not assignable to type 'number'\\."));
        expect(r.stdout).toBe('');
    });
    test.suite('moduleTypes', (test) => {
        suite('with vanilla ts transpilation', 'tsconfig.json');
        suite('with third-party-transpiler', 'tsconfig-swc.json');
        function suite(name, tsconfig) {
            test.suite(name, (test) => {
                test('supports CJS webpack.config.ts in an otherwise ESM project', async (t) => {
                    // A notable case where you can use ts-node's CommonJS loader, not the ESM loader, in an ESM project:
                    // when loading a webpack.config.ts or similar config
                    const r = await exec(`${helpers_1.CMD_TS_NODE_WITHOUT_PROJECT_FLAG} --project ./module-types/override-to-cjs/${tsconfig} ./module-types/override-to-cjs/test-webpack-config.cjs`);
                    expect(r.err).toBe(null);
                    expect(r.stdout).toBe(``);
                });
                test('should allow importing CJS in an otherwise ESM project', async (t) => {
                    await run('override-to-cjs', tsconfig, 'cjs');
                    if (semver.gte(process.version, '14.13.1'))
                        await run('override-to-cjs', tsconfig, 'mjs');
                });
                test('should allow importing ESM in an otherwise CJS project', async (t) => {
                    await run('override-to-esm', tsconfig, 'cjs');
                    // Node 14.13.0 has a bug(?) where it checks for ESM-only syntax *before* we transform the code.
                    if (semver.gte(process.version, '14.13.1'))
                        await run('override-to-esm', tsconfig, 'mjs');
                });
            });
        }
        async function run(project, config, ext) {
            const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} ./module-types/${project}/test.${ext}`, {
                env: {
                    ...process.env,
                    TS_NODE_PROJECT: `./module-types/${project}/${config}`,
                },
            });
            expect(r.err).toBe(null);
            expect(r.stdout).toBe(`Failures: 0\n`);
        }
    });
    test.suite('createEsmHooks()', (test) => {
        test('should create proper hooks with provided instance', async () => {
            const r = await exec(`node --loader ./loader.mjs index.ts`, {
                cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-custom-loader'),
            });
            if (r.err === null) {
                throw new Error('Command was expected to fail, but it succeeded.');
            }
            expect(r.err.message).toMatch(/TS6133:\s+'unusedVar'/);
        });
    });
    test.suite('unit test hooks', ({ contextEach }) => {
        const test = contextEach(async (t) => {
            const service = t.context.tsNodeUnderTest.create({
                cwd: helpers_1.TEST_DIR,
            });
            t.teardown(() => {
                (0, helpers_1.resetNodeEnvironment)();
            });
            return {
                service,
                hooks: t.context.tsNodeUnderTest.createEsmHooks(service),
            };
        });
        test.suite('data URIs', (test) => {
            test.if(helpers_1.nodeUsesNewHooksApi);
            test('Correctly determines format of data URIs', async (t) => {
                const { hooks } = t.context;
                const url = 'data:text/javascript,console.log("hello world");';
                const result = await hooks.load(url, { format: undefined }, async (url, context, _ignored) => {
                    return { format: context.format, source: '' };
                });
                expect(result.format).toBe('module');
            });
        });
    });
    test.suite('supports import assertions', (test) => {
        test.if(helpers_1.nodeSupportsImportAssertions && helpers_1.tsSupportsImportAssertions);
        const macro = test.macro((flags) => async (t) => {
            const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} ${flags} ./importJson.ts`, {
                cwd: (0, path_1.resolve)(helpers_1.TEST_DIR, 'esm-import-assertions'),
            });
            expect(r.err).toBe(null);
            expect(r.stdout.trim()).toBe('A fuchsia car has 2 seats and the doors are open.\nDone!');
        });
        test.suite('when node does not require --experimental-json-modules', (test) => {
            test.if(helpers_1.nodeSupportsUnflaggedJsonImports);
            test('Can import JSON modules with appropriate assertion', macro, '');
        });
        test.suite('when node requires --experimental-json-modules', (test) => {
            test.if(!helpers_1.nodeSupportsUnflaggedJsonImports);
            test('Can import JSON using the appropriate flag and assertion', macro, '--experimental-json-modules');
        });
    });
    test.suite('Entrypoint resolution falls back to CommonJS resolver and format', (test) => {
        test('extensionless entrypoint', async (t) => {
            const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} ./esm-loader-entrypoint-cjs-fallback/extensionless-entrypoint`);
            expect(r.err).toBe(null);
            expect(r.stdout.trim()).toBe('Hello world!');
        });
        test('relies upon CommonJS resolution', async (t) => {
            const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} ./esm-loader-entrypoint-cjs-fallback/relies-upon-cjs-resolution`);
            expect(r.err).toBe(null);
            expect(r.stdout.trim()).toBe('Hello world!');
        });
        test('fails as expected when entrypoint does not exist at all', async (t) => {
            const r = await exec(`${helpers_1.CMD_ESM_LOADER_WITHOUT_PROJECT} ./esm-loader-entrypoint-cjs-fallback/does-not-exist`);
            expect(r.err).toBeDefined();
            expect(r.stderr).toContain(`Cannot find module `);
        });
    });
    test.suite('spawns child process', async (test) => {
        basic('ts-node-esm executable', () => exec(`${helpers_1.BIN_ESM_PATH} ./esm-child-process/via-flag/index.ts foo bar`));
        basic('ts-node --esm flag', () => exec(`${helpers_1.BIN_PATH} --esm ./esm-child-process/via-flag/index.ts foo bar`));
        basic('ts-node w/tsconfig esm:true', () => exec(`${helpers_1.BIN_PATH} --esm ./esm-child-process/via-tsconfig/index.ts foo bar`));
        function basic(title, cb) {
            test(title, async (t) => {
                const r = await cb();
                expect(r.err).toBe(null);
                expect(r.stdout.trim()).toBe('CLI args: foo bar');
                expect(r.stderr).toBe('');
            });
        }
        test('extensionless entrypoint, regression test for #1943', async (t) => {
            const r = await exec(`${helpers_1.BIN_ESM_PATH} ./esm-loader-entrypoint-cjs-fallback/extensionless-entrypoint`);
            expect(r.err).toBe(null);
            expect(r.stdout.trim()).toBe('Hello world!');
        });
        test.suite('parent passes signals to child', (test) => {
            signalTest('SIGINT');
            signalTest('SIGTERM');
            function signalTest(signal) {
                test(signal, async (t) => {
                    const childP = spawn([
                        // exec lets us run the shims on windows; spawn does not
                        process.execPath,
                        helpers_1.BIN_PATH_JS,
                        `./esm-child-process/via-tsconfig/sleep.ts`,
                    ]);
                    try {
                        await childP.stdout.wait('child registered signal handlers');
                        process.kill(childP.child.pid, signal);
                        await childP;
                        const stdout = await childP.stdout;
                        const stderr = await childP.stderr;
                        if (process.platform === 'win32') {
                            // Windows doesn't have signals, and node attempts an imperfect facsimile.
                            // In Windows, SIGINT and SIGTERM kill the process immediately with exit
                            // code 1, and the process can't catch or prevent this.
                            expect(childP.code).toBe(1);
                            expect(stdout.trim()).toBe(`child registered signal handlers`);
                        }
                        else {
                            expect(childP.code).toBe(123);
                            expect(stdout.trim()).toBe(`child registered signal handlers\nchild received signal: ${signal}\nchild exiting`);
                        }
                        expect(stderr).toBe('');
                    }
                    finally {
                        t.log({
                            stdout: await childP.stdout,
                            stderr: await childP.stderr,
                            code: childP.code,
                        });
                    }
                });
            }
        });
        test.suite('esm child process working directory', (test) => {
            test('should have the correct working directory in the user entry-point', async () => {
                const r = await exec(`${helpers_1.BIN_PATH} --esm --cwd ./esm/ index.ts`, {
                    cwd: (0, path_1.resolve)(helpers_1.TEST_DIR, 'working-dir'),
                });
                expect(r.err).toBe(null);
                expect(r.stdout.trim()).toBe('Passing');
                expect(r.stderr).toBe('');
            });
        });
        test.suite('esm child process and forking', (test) => {
            const macro = test.macro((command) => async (t) => {
                const r = await exec(command);
                expect(r.err).toBe(null);
                expect(r.stdout.trim()).toBe('Passing: from main');
                expect(r.stderr).toBe('');
            });
            test('should be able to fork vanilla NodeJS script', macro, `${helpers_1.BIN_PATH} --esm --cwd ./esm-child-process/ ./process-forking-js/index.ts`);
            test('should be able to fork TypeScript script', macro, `${helpers_1.BIN_PATH} --esm --cwd ./esm-child-process/ ./process-forking-ts/index.ts`);
            test('should be able to fork TypeScript script by absolute path', macro, `${helpers_1.BIN_PATH} --esm --cwd ./esm-child-process/ ./process-forking-ts-abs/index.ts`);
        });
    });
    test('throws ERR_REQUIRE_ESM when attempting to require() an ESM script when ESM loader is *not* enabled', async () => {
        // Node versions >= 12 support package.json "type" field and so will throw an error when attempting to load ESM as CJS
        const r = await exec(`${helpers_1.BIN_PATH} ./index.js`, {
            cwd: (0, path_1.join)(helpers_1.TEST_DIR, './esm-err-require-esm'),
        });
        expect(r.err).not.toBe(null);
        expect(r.stderr).toMatch('Error [ERR_REQUIRE_ESM]: Must use import to load ES Module:');
    });
});
test.suite("Catch unexpected changes to node's loader context", (test) => {
    // loader context includes import assertions, therefore this test requires support for import assertions
    test.if(helpers_1.nodeSupportsImportAssertions);
    /*
     * This does not test ts-node.
     * Rather, it is meant to alert us to potentially breaking changes in node's
     * loader API.  If node starts returning more or less properties on `context`
     * objects, we want to know, because it may indicate that our loader code
     * should be updated to accomodate the new properties, either by proxying them,
     * modifying them, or suppressing them.
     */
    test('Ensure context passed to loader by node has only expected properties', async (t) => {
        const r = await exec(`node --loader ./esm-loader-context/loader.mjs --experimental-json-modules ./esm-loader-context/index.mjs`);
        const rows = r.stdout.split('\n').filter((v) => v[0] === '{');
        expect(rows.length).toBe(14);
        rows.forEach((row) => {
            const json = JSON.parse(row);
            if (json.resolveContextKeys) {
                expect(json.resolveContextKeys).toEqual(['conditions', 'importAssertions', 'parentURL']);
            }
            else if (json.loadContextKeys) {
                expect(json.loadContextKeys).toEqual(['format', 'importAssertions']);
            }
            else {
                throw new Error('Unexpected stdout in test.');
            }
        });
    });
});
//# sourceMappingURL=esm-loader.spec.js.map