import React, { useState } from 'react';
import { CustomTextInput } from '.';
import { apiGet } from '../api/api.ts';

const DownloadPackage = () => {
    const [pkg, setPkg] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [fileName, setFileName] = useState("");

    const handleDownload = async () => {
        if (!pkg) return;
        
        try {
            const data = await apiGet(`/package/${pkg}`);
            console.log('Package retrieved successfully:', data);

            setFileContent(data.fileContent);
            setFileName(pkg);
        } catch (error) {
            console.error('Error retrieving package:', error);
        }
    };

    const handleFileDownload = () => {
        const link = document.createElement('a');
        link.href = `data:application/octet-stream;base64,${fileContent}`;
        link.download = fileName || 'downloaded_file';
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

            {fileContent && (
                <div style={{ marginTop: '10px' }}>
                    <p>{fileName} file content (Base64):</p>
                    <textarea 
                        rows="4" 
                        cols="50" 
                        value={fileContent.substring(0, 200) + "..."} 
                        readOnly 
                    />
                    <button onClick={handleFileDownload}>Download File</button>
                </div>
            )}
        </div>
    );
};

export default DownloadPackage;
