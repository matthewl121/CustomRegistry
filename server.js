import express from 'express';
import http from 'http';
import cors from 'cors';
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
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
    const response = { message: "Hello from server" };
    console.log(response);
    return res.json(response);
});

// Package download endpoint
app.get('/package/:id', async (req, res) => {
    console.log("Package download endpoint.")
    const { id } = req.params;
    console.log(`Request ID: ${id}`);
    try {
        const response = await downloadPackageHandler(id);
        // console.log("Response:", JSON.stringify(response));
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error("Error retrieving package:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Package upload endpoint
app.post('/package', async (req, res) => {
    console.log("Package upload endpoint.")
    console.log(`Request: ${req.body}`);
    let packageData = {
        JSProgram: req.body?.JSProgram, // Always present
    };

    // Check if uploading via Content
    if (req.body.Content) {
        packageData.Content = req.body.Content;
        packageData.Name = req.body.Name || null; // Optional field
        packageData.debloat = req.body.debloat || null; // Optional field
    }

    // Check if uploading via URL
    if (req.body.URL) {
        packageData.URL = req.body.URL;
    }

    try {
        // Call the handler function (assuming uploadPackageHandler is async)
        const response = await uploadPackageHandler(packageData);

        // Handle the response from the handler
        console.log("Response:", JSON.stringify(response));
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error("Error uploading package:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Package by regex endpoint
app.post('/package/byRegEx', async (req, res) => {
    try {
        console.log("Package by regex endpoint.")
        // Create the event object from the request body
        const event = {
            RegEx: req.body.RegEx,
        };

        console.log(`Request regex: ${event.RegEx}`)

        // Call the handler function and get the response
        const response = await getPackageByRegexHandler(event);

        // Return the response from the handler to the frontend
        console.log("Response:", JSON.stringify(response));
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

// Packages query endpoint
app.post('/packages', async (req, res) => {
    try {
        console.log("Packages query endpoint (postPackages).")
        const queries = req.body; // Extract the PackageQuery from the request body
        
        console.log("Request queries:", queries);
        // Create the event object to pass to the handler
        const event = {
            queries,
        };

        // Call the handler function and get the response
        const response = await postPackagesHandler(event);

        console.log("Response:", JSON.stringify(response));

        // Return the response from the handler to the frontend
        return res.status(response.statusCode).json(JSON.parse(response.body));
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
});

// Package update endpoint
app.post('/package/:id', async (req, res) => {
    try {
        console.log("Package update endpoint.")
        const { metadata, data } = req.body;
        console.log("Request data: ", data);
        console.log("Request metadata: ", metadata);

        const event = {
            metadata: {
                Name: metadata.Name,
                Version: metadata.Version,
                ID: metadata.ID,
            },
            data: {
                Name: data.Name,
                Content: data.Content || null,
                URL: data.URL || null,
                debloat: data.debloat || false,
                JSProgram: data.JSProgram || '',
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
        console.log("Tracks endpoint.")
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
    console.log("Package rate endpoint.")
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
    console.log("Package cost endpoint")
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
        console.log("Reset registry endpoint")
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