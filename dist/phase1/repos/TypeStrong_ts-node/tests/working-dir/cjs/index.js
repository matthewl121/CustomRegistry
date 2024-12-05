"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const path_1 = require("path");
// Expect the working directory to be the parent directory.
(0, assert_1.strictEqual)((0, path_1.normalize)(process.cwd()), (0, path_1.normalize)((0, path_1.dirname)(__dirname)));
console.log('Passing');
//# sourceMappingURL=index.js.map