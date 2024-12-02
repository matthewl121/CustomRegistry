#!/usr/bin/env node
// run.js
import fs from 'fs';
import { exec, execSync } from 'child_process';
import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { main } from './src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    execSync('npm -v', { stdio: 'ignore' });
} catch (error) {
    console.log('NPM not found. Please install Node.js and NPM');
    process.exit(1);
}

try {
    execSync('npm install commander', { stdio: 'ignore' });
} catch {
    process.exit(1);
}

const program = new Command();

program
    .command('install')
    .description('install all dependencies')
    .action(() => {
        exec('npm install --save-dev && tsc --init', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error installing dependencies: ${error}`);
                console.error(`Error installing dependencies: ${stderr}`);
                process.exit(1);
            }
            const addedPackages = stdout.match(/added (\d+) packages?/);
            console.log(addedPackages?.[1] ? 
                `${addedPackages[1]} dependencies were installed` : 
                'All dependencies are installed and up to date'
            );
        });
    });

program
    .argument('<file>', 'file to run')
    .description('process URL of the file to run and output metrics in NDJSON format')
    .action((file) => {
        try {
            execSync('tsc src/index.ts', { stdio: 'ignore' });
        } catch {}
        
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                process.exit(1);
            }
            if (!process.env.LOG_FILE) {
                console.log('LOG_FILE environment variable is not set');
                process.exit(1);
            }
            if (!process.env.GITHUB_TOKEN) {
                console.log('GITHUB_TOKEN environment variable is not set'); 
                process.exit(1);
            }
            if (!process.env.LOG_LEVEL) {
                console.log('LOG_LEVEL environment variable is not set');
                process.exit(1);
            }
            
            const urls = data.split('\n').filter(line => line.trim());
            urls.forEach(url => main(url));
        });
    });

program
    .command('test')
    .description('run tests, compile TypeScript, and execute compiled JavaScript')
    .action(() => {
        try {
            execSync('npx jest --silent > test/jest-output.txt 2>&1', { stdio: 'ignore' });
        } catch {}

        try {
            execSync('npx tsc test/test_output.ts', { stdio: 'ignore' });
        } catch {}

        try {
            execSync('node test/test_output.js', { stdio: 'inherit' });
        } catch {}
    });

program.parse(process.argv);