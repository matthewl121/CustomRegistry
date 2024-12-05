"use strict";
// intentional whitespace to prove that sourcemaps are working.  Throw should happen on line 100.
// 100 lines is meant to be far more space than the helper functions would take.
Object.defineProperty(exports, "__esModule", { value: true });
// Space in filename is intentional to ensure we handle this correctly when providing sourcemaps
class Foo {
    constructor() {
        this.bar();
    }
    bar() { throw new Error('this is a demo'); }
}
new Foo();
//# sourceMappingURL=throw%20error.js.map