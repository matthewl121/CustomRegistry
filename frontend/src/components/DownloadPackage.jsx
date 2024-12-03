import React, { useState } from 'react';
import { CustomTextInput } from './index.js';
import { apiGet } from '../api/api.ts';

const DownloadPackage = () => {
    const [pkg, setPkg] = useState("");
    const [version, setVersion] = useState("");
    const [metadata, setMetadata] = useState(null);
    const [fileContent, setFileContent] = useState("");

    const handleDownload = async () => {
        if (!pkg || !version) {
            console.error("Package name and version are required.");
            return;
        }
    
        const packageId = `${pkg}--${version}`;
        try {
            const data = await apiGet(`/package/${packageId}`);
            console.log('Received data:', data);  // Add this to inspect the data
    
            const { metadata, data: packageData } = data;
    
            setMetadata(metadata);
            setFileContent(packageData.Content);  // Ensure packageData.Content exists
        } catch (error) {
            console.error('Error retrieving package:', error);
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
                </div>
            )}
        </div>
    );
};

export default DownloadPackage;
