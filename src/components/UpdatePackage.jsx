import React, { useState } from 'react';
import { CustomTextInput, DebloatCheckbox } from '.';

export const UpdatePackage = () => {
    const [uploadMode, setUploadMode] = useState('url');  // State to switch between 'url' and 'content' mode
    const [url, setUrl] = useState('');  // URL input
    const [file, setFile] = useState(null);  // File input
    const [version, setVersion] = useState('');  // Version input
    const [debloat, setDebloat] = useState(false);  // Debloat flag
    const [packageName, setPackageName] = useState('');  // Package Name input for content
    const [packageId, setPackageId] = useState('');  // Package ID input for display purposes
    const [jsProgram, setJsProgram] = useState('');  // JSProgram input
    const [metadata, setMetadata] = useState(null);  // Store metadata after update

    const handleUploadModeChange = (mode) => {
        setUploadMode(mode);
        
        // Reset states when switching modes
        setUrl('');
        setFile(null);
        setVersion('');
        setDebloat(false);
        setPackageName('');
        setPackageId('');
        setJsProgram('');
    };

    const handleUpdate = async () => {
        if (!version) {
            console.error("Version must be provided.");
            return;
        }

        // Prepare package data based on the upload mode
        let packageData = {
            metadata: {
                Version: version,  // New version to update
                ID: packageId
            },
            data: {
                JSProgram: jsProgram,  // JavaScript program
            },
        };

        // Handle content or URL-based update
        if (uploadMode === 'content' && file) {
            const content = await fileToBase64(file);  // Convert the file to base64
            packageData.data.Content = content;  // Add the content if it's a file update
            packageData.metadata.Name = packageName
            packageData.data.debloat = debloat
        }

        if (uploadMode === 'url' && url) {
            packageData.data.URL = url;  // Add the URL if it's a URL-based update
            packageData.metadata.Name = url.split('/').pop()
        }

        // Ensure Content and URL are not both set simultaneously
        if (packageData.data.Content && packageData.data.URL) {
            console.error('Both Content and URL cannot be set at the same time.');
            return;
        }

        try {
            const response = await fetch(`/package/${packageData.metadata.ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(packageData),
            });

            if (!response.ok) {
                throw new Error('Update failed');
            }

            const data = await response.json();
            console.log('Package updated successfully:', data);

            // Save metadata from the response
            setMetadata(data.metadata);
        } catch (error) {
            console.error('Error updating package:', error);
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

    return (
        <div>
            <div>
                <button style={{ marginRight: "15px" }} onClick={() => handleUploadModeChange('url')}>Update by URL</button>
                <button onClick={() => handleUploadModeChange('content')}>Update by Content</button>
            </div>

            {uploadMode === 'url' && (
                <div>
                    <CustomTextInput
                        placeholder="Enter package URL"
                        input={url}
                        setInput={setUrl}
                    />
                </div>
            )}

            {uploadMode === 'content' && (
                <div>
                    <CustomTextInput
                        placeholder="Enter package name"
                        input={packageName}
                        setInput={setPackageName}
                    />
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <DebloatCheckbox
                        debloat={debloat}
                        setDebloat={setDebloat}
                    />
                </div>
            )}

            <CustomTextInput
                placeholder="Enter new version (e.g., 2.3.0)"
                input={version}
                setInput={setVersion}
            />

            <CustomTextInput
                placeholder="Package ID"
                input={packageId}
                setInput={setPackageId}
                disabled
            />

            <textarea
                placeholder="Enter JSProgram"
                value={jsProgram}
                onChange={(e) => setJsProgram(e.target.value)}
                rows="10"
                style={{ width: '100%', padding: '8px' }}
            />
            <button onClick={handleUpdate}>Update</button>

            {metadata && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Update Successful!</h3>
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

export default UpdatePackage;
