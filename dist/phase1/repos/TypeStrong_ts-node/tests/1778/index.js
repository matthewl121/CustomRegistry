import foo from 'foo';
// This file is ESM, so if typechecker's resolver is working correctly, will
// resolve to the foo's package.json "exports" mapping for "default", not "require"
const bar = foo;
console.log(bar);
//# sourceMappingURL=index.js.map