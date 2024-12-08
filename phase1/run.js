#!/usr/bin/env node
const fs = require('fs');
const {exec, execSync} = require('child_process');

try {
    execSync('npm -v', { stdio: 'ignore' });
} catch (error) {
    console.log('NPM not found. Please install Node.js and NPM before running this script');
    process.exit(1);
}

try {
    execSync('npm install commander', { stdio: 'ignore' });
    // console.log('Commander has been successfully installed');
} catch (installError) {
    // console.error('Error: Failed to install commander. Please try installing it manually.');
    process.exit(1);
}

try {
    // Execute the bash command and capture the output
    const output = execSync('bash -c "set -a; source .env; set +a; env"', { encoding: 'utf-8' });
    
    // Split the output by lines and assign each line to process.env
    output.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key] = value;
        }
    });
} catch (error) {
    console.error('Error: Failed to load environment variables from .env file');
    process.exit(1);
}

const {Command} = require('commander');

const program = new Command();

program
    .command('install')
    .description('install all dependencies')
    .action(() => {
        //npm install --save-dev && tsc --init to terminal
        exec('npm install --save-dev && tsc --init', (error, stdout, stderr) => {
            if (error) {
                console.error(`%cError installing dependencies: ${error}`, `color: red`);
                console.error(`%cError installing dependencies: ${stderr}`, `color: red`);
                process.exit(1);
            }
            //regex to get the number of packages installed
            const addedPackages = stdout.match(/added (\d+) packages?/);
            if (addedPackages && addedPackages[1]) {
                const count = addedPackages[1];
                console.log(`${count} dependencies were installed`);
            } else {
                console.log(`All dependencies are installed and up to date`);
            }
        });
    });

    program
    .argument('<file>', 'file to run')
    .description('process URL of the file to run and output metrics in NDJSON format')
    .action(async (file) => { 
        // Compile all the TypeScript files to JavaScript
        try {
            execSync('tsc src/index.ts', { stdio: 'ignore' });
        } catch (error) {
            continueOnError = true;
        }
        
        // Import the main function from the compiled index.js
        const { main } = require('./src/index');
        
        // Read the file asynchronously
        fs.readFile(file, 'utf8', async (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                process.exit(1);
            }

            // Validate environment variables
            if (!process.env.LOG_FILE) {
                console.error('LOG_FILE environment variable is not set');
                process.exit(1);
            }
            if (!process.env.GITHUB_TOKEN) {
                console.error('GITHUB_TOKEN environment variable is not set');
                process.exit(1);
            }
            if (!process.env.LOG_LEVEL) {
                console.error('LOG_LEVEL environment variable is not set');
                process.exit(1);
            }

            // Process URLs
            const urls = data.split('\n').map(line => line.trim()).filter(line => line !== '');
            try {
                await Promise.all(urls.map(async (url) => {
                    await main(url);
                }));
            } catch (error) {
                console.error('Error processing URLs:', error);
                process.exit(1);
            }

            // Delete the repos directory after processing
            try {
                if (fs.existsSync("repos")) {
                    fs.rmSync("repos", { recursive: true, force: true });
                }
            } catch (error) {
                console.error(`Error deleting repos directory: ${error}`);
                process.exit(1);
            }
        });
    });


program
    .command('test')
    .description('run tests, compile TypeScript, and execute compiled JavaScript')
    .action(() => {
        // compile all the TypeScript files to JavaScript
        try {
            execSync('tsc src/index.ts', { stdio: 'ignore' });
        } catch(error) {
            continueOnError = true;
        }

        //command lines to run the tests
        try {
            // Run Jest tests and output results to a file
            execSync('npx jest --silent > test/jest-output.txt 2>&1', { stdio: 'ignore' });
        } catch (error) {
            continueOnError = true;
        }
        
        try {
            // Compile the TypeScript test file to JavaScript
            execSync('npx tsc test/test_output.ts', { stdio: 'ignore' });
        } catch(error) {
            continueOnError = true;
        }

        try {
            // Execute the compiled JavaScript file
            execSync('node test/test_output.js', { stdio: 'inherit' });
        } catch (error) {
            continueOnError = true;
        }
    });


program.parse(process.argv);