"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSource = exports.getFormat = exports.load = exports.resolve = void 0;
exports.lateBindHooks = lateBindHooks;
const esm_1 = require("../esm");
let hooks;
/** @internal */
function lateBindHooks(_hooks) {
    hooks = _hooks;
}
const proxy = {
    resolve(...args) {
        return (hooks?.resolve ?? args[2])(...args);
    },
    load(...args) {
        return (hooks?.load ?? args[2])(...args);
    },
    getFormat(...args) {
        return (hooks?.getFormat ?? args[2])(...args);
    },
    transformSource(...args) {
        return (hooks?.transformSource ?? args[2])(...args);
    },
};
/** @internal */
_a = (0, esm_1.filterHooksByAPIVersion)(proxy), exports.resolve = _a.resolve, exports.load = _a.load, exports.getFormat = _a.getFormat, exports.transformSource = _a.transformSource;
//# sourceMappingURL=child-loader.js.map