"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const external_1 = require("external");
// `foo` has type information so this is an error
const shouldBeBoolean = external_1.foo;
// `bar` is missing type information, so this is not an error
const shouldBeBoolean2 = external_1.bar;
//# sourceMappingURL=other.js.map