"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslog_1 = require("tslog");
new tslog_1.Logger().info('hi');
console.log(require.resolve('source-map-support') === require.resolve('@cspotcode/source-map-support'));
console.log(require.resolve('source-map-support/register') === require.resolve('@cspotcode/source-map-support/register'));
console.log(new Error().stack.split('\n')[1]);
new tslog_1.Logger().info('hi');
//# sourceMappingURL=index.js.map