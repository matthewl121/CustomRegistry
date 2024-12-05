"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
// Type syntax to prove its compiled, though the import above should also
// prove the same
const a = null;
console.log(JSON.stringify({ execArgv: process.execArgv, argv: process.argv }));
if (process.env.generation !== 'grandchild') {
    const nextGeneration = process.env.generation === 'child' ? 'grandchild' : 'child';
    (0, child_process_1.fork)(__filename, process.argv.slice(2), {
        env: { ...process.env, generation: nextGeneration },
        stdio: 'inherit',
    });
}
//# sourceMappingURL=index.js.map