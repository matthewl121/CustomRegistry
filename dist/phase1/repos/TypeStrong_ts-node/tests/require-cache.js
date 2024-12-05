"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.example2 = exports.example1 = void 0;
const moduleName = require.resolve('./module');
const { example: example1 } = require(moduleName);
exports.example1 = example1;
delete require.cache[moduleName];
const { example: example2 } = require(moduleName);
exports.example2 = example2;
//# sourceMappingURL=require-cache.js.map