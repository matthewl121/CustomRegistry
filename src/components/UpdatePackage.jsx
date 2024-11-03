import React, { useState } from 'react';
import { CustomTextInput, DebloatCheckbox } from '.';

export const UpdatePackage = () => {
    const [url, setUrl] = useState('');
    const [version, setVersion] = useState('');
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
            <CustomTextInput 
                placeholder="Enter npm or GitHub URL" 
                input={url} 
                setInput={setUrl} 
            />
            <CustomTextInput 
                placeholder="Enter new version (e.g., 2.3.0)" 
                input={version} 
                setInput={setVersion} 
            />
            <DebloatCheckbox checked={debloat} onChange={() => setDebloat(!debloat)} />
            <button onClick={handleUpdate}>Update</button>
        </div>
    );
};

export default UpdatePackage;
