import React, { useState } from 'react';
import { CustomTextInput, DebloatCheckbox } from './index.js';
import { apiPost } from '../api/api.ts';

export const UploadPackage = () => {
    const [uploadMode, setUploadMode] = useState('url');  // State to switch between 'url' and 'content' mode
    const [url, setUrl] = useState('');  // URL input
    const [file, setFile] = useState(null);  // File input
    const [debloat, setDebloat] = useState(false);  // Debloat flag
    const [packageName, setPackageName] = useState('');  // Package name
    const [jsProgram, setJsProgram] = useState('');  // JSProgram input
    const [metadata, setMetadata] = useState(null);  // Store metadata after upload
    const [error, setError] = useState("");  // Store error message

    const handleUpload = async () => {
        if (uploadMode === 'url' && !url) {
            setError("URL must be provided.");
            return;
        }

        if (uploadMode === 'content' && !file) {
            setError("File must be provided.");
            return;
        }
    
        // Prepare package data based on the upload mode
        let packageData = {
            JSProgram: jsProgram,  // Use the input JSProgram
        };
    
        if (uploadMode === 'content') {
            // Convert the file to base64 if a file is selected
            const content = await fileToBase64(file);
            packageData.Content = content;  // Attach content as base64
            packageData.Name = packageName;
            packageData.debloat = debloat;
        }
    
        if (uploadMode === 'url') {
            packageData.URL = url;  // Attach URL if provided
        }
    
        // Ensure Content and URL are not both set simultaneously
        if (packageData.Content && packageData.URL) {
            setError('Both Content and URL cannot be set at the same time.');
            return;
        }
    
        try {
            // Use apiPost function to send the POST request
            const response = await apiPost('/package', {
                body: packageData,
            });

            console.log(response)

            // Save metadata from the response
            setMetadata(response.metadata);  // Save the response (metadata)
            setError("");  // Clear any previous errors
        } catch (err) {
            setError('Error uploading package: ' + err.message);  // Handle errors
            setMetadata(null);  // Clear previous metadata on error
        }
    };

    // Helper function to convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);  // Extract base64 content
            reader.onerror = (error) => reject(error);
        });
    };
    
    // Handle mode change and reset states when switching modes
    const handleUploadModeChange = (mode) => {
        setUploadMode(mode);

        // Reset states when switching modes
        setUrl('');
        setFile(null);
        setPackageName('');
        setJsProgram('');
        setDebloat(false);
        setError("");  // Clear error message on mode change
    };

    return (
        <div>
            <div>
                <button style={{ marginRight: "15px" }} onClick={() => handleUploadModeChange('url')}>Upload by URL</button>
                <button onClick={() => handleUploadModeChange('content')}>Upload by Content</button>
            </div>

            {uploadMode === 'url' && (
                <div style={{ maxWidth: "400px" }}>
                    <CustomTextInput
                        placeholder="Enter npm URL"
                        input={url}
                        setInput={setUrl}
                    />
                    <textarea
                        placeholder="Enter JSProgram"
                        value={jsProgram}
                        onChange={(e) => setJsProgram(e.target.value)}
                        rows="10"
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
            )}

            {uploadMode === 'content' && (
                <div style={{ maxWidth: "400px" }}>
                    <CustomTextInput
                        placeholder="Enter package name"
                        input={packageName}
                        setInput={setPackageName}
                    />
                    <input
                        style={{ marginBottom: "15px" }}
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <DebloatCheckbox
                        debloat={debloat}
                        setDebloat={setDebloat}
                    />
                    <textarea
                        placeholder="Enter JSProgram"
                        value={jsProgram}
                        onChange={(e) => setJsProgram(e.target.value)}
                        rows="10"
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
            )}

            <button onClick={handleUpload}>Upload</button>

            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>{error}</strong>
                </div>
            )}

            {metadata && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Upload Successful!</h3>
                    <p><strong>Package Metadata:</strong></p>
                    <p><strong>Name:</strong> {metadata.Name}</p>
                    <p><strong>Version:</strong> {metadata.Version}</p>
                    <p><strong>ID:</strong> {metadata.ID}</p>
                </div>
            )}
        </div>
    );
};

export default UploadPackage;
