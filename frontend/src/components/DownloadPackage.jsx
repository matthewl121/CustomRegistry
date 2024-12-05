import React, { useState } from 'react';
import { CustomTextInput } from './index.js';
import { apiGet } from '../api/api.ts';

const DownloadPackage = () => {
    const [pkg, setPkg] = useState("");
    const [version, setVersion] = useState("");
    const [metadata, setMetadata] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [error, setError] = useState("");  // State to hold error message

    const handleDownload = async () => {
        if (!pkg || !version) {
            setError("Package name and version are required.");
            return;
        }
    
        const packageId = `${pkg}--${version}`;
        try {
            setError("");  // Clear any previous errors
            const data = await apiGet(`/package/${packageId}`);
            console.log('Received data:', data);
    
            const { metadata, data: packageData } = data;
    
            setMetadata(metadata);
            setFileContent(packageData.Content);  // Ensure packageData.Content exists
        } catch (error) {
            console.error('Error retrieving package:', error);
            setError("Error retrieving package: " + error.message);  // Display error message
        }
    };

    // Function to download the file as a zip
    const downloadZip = () => {
        if (fileContent) {
            // Create a Blob from the base64 content
            const byteCharacters = atob(fileContent);
            const byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
                const slice = byteCharacters.slice(offset, offset + 1024);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, { type: 'application/zip' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${pkg}-${version}.zip`;  // Set the filename
            link.click();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CustomTextInput
                    placeholder="Package Name"
                    input={pkg}
                    setInput={setPkg}
                />
                <CustomTextInput
                    placeholder="Version"
                    input={version}
                    setInput={setVersion}
                />
                <button onClick={handleDownload}>Download</button>
            </div>

            {error && (
                <div style={{ color: 'red', marginTop: '20px' }}>
                    <strong>{error}</strong>
                </div>
            )}

            {metadata && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Package Metadata:</h3>
                    <pre>{JSON.stringify(metadata, null, 2)}</pre>
                </div>
            )}

            {fileContent && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Package Data:</h3>
                    <p><strong>Base64 Content:</strong></p>
                    <pre>{fileContent.substring(0, 100)}... (truncated)</pre>
                    <button onClick={downloadZip}>Download ZIP</button> {/* Button to download ZIP */}
                </div>
            )}
        </div>
    );
};

export default DownloadPackage;
