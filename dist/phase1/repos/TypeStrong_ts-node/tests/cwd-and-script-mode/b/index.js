"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Type assertion to please TS 2.7
const register = process[Symbol.for('ts-node.register.instance')];
console.log(JSON.stringify({
    options: register.options,
    config: register.config,
}));
//# sourceMappingURL=index.js.map