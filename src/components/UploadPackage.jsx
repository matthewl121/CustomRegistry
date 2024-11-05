import React, { useState } from 'react';
import { CustomTextInput, DebloatCheckbox } from '.';

export const UploadPackage = () => {
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [debloat, setDebloat] = useState(false);

    const handleUpload = async () => {
        if (!url) return;
        /* API call for uploading a package
        ** Endpoint: POST /package => AWS Lambda fn: uploadPackage
        ** Body: { url, debloat }
        */
        try {
            const response = await fetch('/package', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, debloat }),
            });
            if (!response.ok) throw new Error('Upload failed');
            console.log('Package uploaded successfully');
        } catch (error) {
            console.error('Error uploading package:', error);
        }
    };

    return (
        <div>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <CustomTextInput 
                placeholder="Enter npm URL" 
                input={url} 
                setInput={setUrl} 
            />
            <DebloatCheckbox
                debloat={debloat}
                setDebloat={setDebloat}
            />
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
};

export default UploadPackage;
