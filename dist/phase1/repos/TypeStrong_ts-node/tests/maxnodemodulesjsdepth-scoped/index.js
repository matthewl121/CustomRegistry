"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import as values, forcing internal classification.  All files are typechecked
const a_1 = require("@scoped/a");
// We must have two .ts files, one without type errors.
// Otherwise, type errors would prevent imports from executing, so external modules would not be reclassified as internal.
a_1.foo;
require("./other");
//# sourceMappingURL=index.js.map