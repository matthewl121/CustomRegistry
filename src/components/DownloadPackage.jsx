import React, { useState } from 'react';
import { CustomTextInput } from '.';
import { apiGet } from '../api/api.ts';

const DownloadPackage = () => {
    const [pkg, setPkg] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");

    const handleDownload = async () => {
        if (!pkg) return;
        
        try {
            // Get the pre-signed URL from the backend
            const data = await apiGet(`/package/${pkg}`);
            console.log('Pre-signed URL retrieved successfully:', data);

            // Set the download URL from the response
            setDownloadUrl(data.downloadUrl);
        } catch (error) {
            console.error('Error retrieving download link:', error);
        }
    };

    const handleFileDownload = () => {
        if (!downloadUrl) return;

        // Create a link element to download the file directly from S3
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = pkg || 'downloaded_file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CustomTextInput
                    placeholder="Search registry"
                    input={pkg}
                    setInput={setPkg}
                />
                <button onClick={handleDownload}>Download</button>
            </div>

            {downloadUrl && (
                <div style={{ marginTop: '10px' }}>
                    <p>Click below to download the package:</p>
                    <button onClick={handleFileDownload}>Download File</button>
                </div>
            )}
        </div>
    );
};

export default DownloadPackage;
