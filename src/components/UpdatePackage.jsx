import React, { useState } from 'react';
import { CustomTextInput, DebloatCheckbox } from '.';

export const UpdatePackage = () => {
    const [url, setUrl] = useState('');
    const [version, setVersion] = useState('');
    const [file, setFile] = useState(null);
    const [debloat, setDebloat] = useState(false);

    const handleUpdate = async () => {
        if (!url || !version) return;
        /* API call for updating a package
        ** Endpoint: POST /package/{id} => AWS Lambda fn: updatePackage
        ** Body: { url, version, debloat }
        */
        try {
            const response = await fetch(`/package/${encodeURIComponent(url)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ version, debloat }),
            });
            if (!response.ok) throw new Error('Update failed');
            console.log('Package updated successfully');
        } catch (error) {
            console.error('Error updating package:', error);
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
            <CustomTextInput 
                placeholder="Enter new version (e.g., 2.3.0)" 
                input={version} 
                setInput={setVersion} 
            />
            <DebloatCheckbox
                debloat={debloat}
                setDebloat={setDebloat}
            />
            <button onClick={handleUpdate}>Update</button>
        </div>
    );
};

export default UpdatePackage;
