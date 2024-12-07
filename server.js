import express from 'express';
import http from 'http';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { downloadPackageHandler } from './lambda/download/index.mjs';
import { ratePackageHandler } from './lambda/ratePackage/index.mjs';
import { updatePackageHandler } from './lambda/update/index.mjs';
import { uploadPackageHandler } from './lambda/upload/index.mjs';
import { getPackageByRegexHandler } from './lambda/getPackageByRegex/index.mjs';
import { postPackagesHandler } from './lambda/postPackages/index.mjs';
import { getTracksHandler } from './lambda/getTracks/index.mjs';
import { resetRegistryHandler } from './lambda/resetRegistry/index.mjs';
import { packageCostHandler } from './lambda/costPackage/index.mjs';

const app = express();
const PORT = 5000;

// Get the current directory equivalent to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log file setup
const LOG_FILE = path.join(__dirname, 'server.log');

// Function to write logs to a file
const writeLog = (message) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, { encoding: 'utf8' });
};

// Clear the log file
const clearLogFile = () => {
    fs.writeFileSync(LOG_FILE, '', { encoding: 'utf8' });
};

// Redirect console.log and console.error to the log file
console.log = (...args) => writeLog(args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
console.error = (...args) => writeLog(`ERROR: ${args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ')}`);

// Middleware setup
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
    const response = { message: "Hello from server" };
    console.log(response);
    return res.json(response);
});

// Clear the log file when the /tracks endpoint is hit
app.get('/tracks', async (req, res) => {
    try {
        console.log("\n\nTracks endpoint.");
        clearLogFile();
        console.log("Log file cleared.");

        const response = await getTracksHandler();
        console.log("Response:", JSON.stringify(response));

        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

// Other endpoints (unchanged except for logs redirected to the file)
app.get('/package/:id', async (req, res) => {
    console.log("\n\nPackage download endpoint.");
    const { id } = req.params;
    console.log(`Request ID: ${id}`);
    try {
        const response = await downloadPackageHandler(id);
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error("Error retrieving package:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Upload
app.post('/package', async (req, res) => {
    console.log("\n\nPackage upload endpoint.");
    let packageData = {
        JSProgram: req.body?.JSProgram,
    };

    if (req.body.Content) {
        packageData.Content = req.body.Content;
        packageData.Name = req.body.Name || null;
        packageData.debloat = req.body.debloat || null;
    }

    if (req.body.URL) {
        packageData.URL = req.body.URL;
        packageData.Name = req.body?.Name || null; 
    }

    console.log(`Request body: ${JSON.stringify(packageData)}`);
    
    try {
        const response = await uploadPackageHandler(packageData);
        console.log(`Response body: ${JSON.stringify(response.body)}`);

        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error("Error uploading package:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/package/byRegEx', async (req, res) => {
    try {
        console.log("\n\nPackage by regex endpoint.");
        console.log(`Request body: ${JSON.stringify(req.body)}`);
        const event = { RegEx: req.body.RegEx };
        const response = await getPackageByRegexHandler(event);
        console.log("Response:", JSON.stringify(response));
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/packages', async (req, res) => {
    try {
        console.log("\n\nPackages query endpoint (postPackages).");
        const queries = req.body;
        console.log("Request queries:", queries);
        const event = { queries };
        const response = await postPackagesHandler(event);
        console.log("Response:", JSON.stringify(response));
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Package update endpoint
app.post('/package/:id', async (req, res) => {
    try {
        console.log("\n\nPackage update endpoint.")
        const { metadata, data } = req.body;
        console.log("Request data: ", data);
        console.log("Request metadata: ", metadata);

        const event = {
            metadata: {
                Name: metadata?.Name,
                Version: metadata?.Version,
                ID: metadata?.ID,
            },
            data: {
                Name: data?.Name,
                Content: data?.Content || null,
                URL: data?.URL || null,
                debloat: data?.debloat || false,
                JSProgram: data?.JSProgram || '',
            }
        };

        console.log("Request event:", JSON.stringify(event));

        const response = await updatePackageHandler(event);
        console.log("Response:", JSON.stringify(response));
        return res.status(response.statusCode).json(response.body)
    } catch (error) {
        console.error('Error updating package:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Tracks endpoint
app.get('/tracks', async (req, res) => {
    try {
        console.log("\n\nTracks endpoint.")
        // Call the handler function to get the tracks
        const response = await getTracksHandler();
        console.log("Response:", JSON.stringify(response))

        // Return the response from the handler to the frontend
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

// Package rate endpoint
app.get('/package/:id/rate', async (req, res) => {
    console.log("\n\nPackage rate endpoint.")
    const { id } = req.params;
    console.log(`Request ID: ${id}`);
    try {
        const event = {
            pathParameters: { id },
            requestContext: {
                requestId: req.headers['x-request-id'] || 'test-request'
            }
        };

        console.log(`Request event: ${JSON.stringify(event)}`);

        const response = await ratePackageHandler(event);
        console.log("Response:", JSON.stringify(response));

        return res.status(response.statusCode)
            .set(response.headers)
            .send(response.body);
    } catch (error) {
        console.error("Error rating package:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Package cost endpoint
app.get('/package/:id/cost', async (req, res) => {
    console.log("\n\nPackage cost endpoint")
    try {
        const id = req.params.id;
        const dependency = req.query.dependency === 'true';

        const event = {
            id,
            dependency
        };

        console.log(`Request event: ${JSON.stringify(event)}`);

        const response = await packageCostHandler(event);
        console.log(`Response: ${JSON.stringify(response)}`);

        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

// Reset registry endpoint
app.delete('/reset', async (req, res) => {
    try {
        console.log("\n\nReset registry endpoint")
        const response = await resetRegistryHandler();

        console.log("Response", response)
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error)
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

// Start the HTTP server
http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://ec2-44-206-248-44.compute-1.amazonaws.com:${PORT}`);
});

export default app;