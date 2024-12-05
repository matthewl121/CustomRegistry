"use strict";
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
const expect = __importStar(require("expect"));
const helpers_1 = require("./helpers");
const testlib_1 = require("./testlib");
const test = (0, testlib_1.context)(helpers_1.ctxTsNode);
const exec = (0, helpers_1.createExecTester)({
    cmd: helpers_1.CMD_TS_NODE_WITH_PROJECT_FLAG,
    exec: (0, helpers_1.createExec)({
        cwd: helpers_1.TEST_DIR,
    }),
});
test('Redirects source-map-support to @cspotcode/source-map-support so that third-party libraries get correct source-mapped locations', async () => {
    const r = await exec({
        flags: `./legacy-source-map-support-interop/index.ts`,
    });
    expect(r.err).toBeNull();
    expect(r.stdout.split('\n')).toMatchObject([
        expect.stringContaining('.ts:2 '),
        'true',
        'true',
        expect.stringContaining('.ts:100:'),
        expect.stringContaining('.ts:101 '),
        '',
    ]);
});
//# sourceMappingURL=sourcemaps.spec.js.map