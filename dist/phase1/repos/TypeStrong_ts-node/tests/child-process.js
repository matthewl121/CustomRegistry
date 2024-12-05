"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_1 = require("child_process");
(0, child_process_1.fork)((0, path_1.join)(__dirname, 'hello-world.ts'));
//# sourceMappingURL=child-process.js.map