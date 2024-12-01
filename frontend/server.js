import express, { response } from 'express';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import { downloadPackageHandler } from './lambda/index.js';

const app = express();
app.use(cors());

const privateKey = fs.readFileSync('key_no_passphrase.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Package download endpoint
app.get('/package/:id', async (req, res) => {
    const { id } = req.params;
    response = await downloadPackageHandler(id);

    console.log(response)
    return response;
});

// Start the HTTPS server on port 5000
https.createServer(credentials, app).listen(5000, () => {
    console.log('Server is running on https://ec2-34-205-19-248.compute-1.amazonaws.com:5000');
});
