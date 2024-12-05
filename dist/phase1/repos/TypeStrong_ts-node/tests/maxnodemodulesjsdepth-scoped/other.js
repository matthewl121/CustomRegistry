"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import as values, forcing internal classification.  All files are typechecked
const a_1 = require("@scoped/a");
// `a_bar` has type information because it has been reclassified as internal
const shouldBeBoolean2 = a_1.bar;
// `b_bar` is missing type information, so this is not an error
const shouldBeBoolean4 = null;
//# sourceMappingURL=other.js.map