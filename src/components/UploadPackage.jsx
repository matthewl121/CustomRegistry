import React, { useState } from 'react';
import { CustomTextInput, DebloatCheckbox } from '.';

export const UploadPackage = () => {
    const [uploadMode, setUploadMode] = useState('url');  // State to switch between 'url' and 'content' mode
    const [url, setUrl] = useState('');  // URL input
    const [file, setFile] = useState(null);  // File input
    const [debloat, setDebloat] = useState(false);  // Debloat flag
    const [packageName, setPackageName] = useState('');  // Package name
    const [jsProgram, setJsProgram] = useState('');  // JSProgram input
    const [metadata, setMetadata] = useState(null);  // Store metadata after upload

    const handleUpload = async () => {
        if (uploadMode === 'url' && !url) {
            console.error("URL must be provided.");
            return;
        }

        if (uploadMode === 'content' && !file) {
            console.error("File must be provided.");
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
            packageData.Name = packageName
            packageData.debloat = debloat
        }

        if (uploadMode === 'url') {
            packageData.URL = url;  // Attach URL if provided
        }

        // Ensure Content and URL are not both set simultaneously
        if (packageData.Content && packageData.URL) {
            console.error('Both Content and URL cannot be set at the same time.');
            return;
        }

        console.log(packageData)
        return

        try {
            const response = await fetch('/package', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(packageData),
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            console.log('Package uploaded successfully:', data);

            // Save metadata from the response
            setMetadata(data.metadata);
        } catch (error) {
            console.error('Error uploading package:', error);
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

            {metadata && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Upload Successful!</h3>
                    <p><strong>Package Name:</strong> {metadata.Name}</p>
                    <p><strong>Version:</strong> {metadata.Version}</p>
                    <p><strong>Package ID:</strong> {metadata.ID}</p>
                    <p><strong>Package Metadata:</strong></p>
                    <pre>{JSON.stringify(metadata, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default UploadPackage;
