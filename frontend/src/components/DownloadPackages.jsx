import React, { useState } from 'react';
import { apiPost } from '../api/api.ts'; // Assuming you have an apiPost method for POST requests
import { CustomTextInput } from './index.js';

const DownloadPackages = () => {
    const [pkgQuery, setPkgQuery] = useState(""); // Default query is "*"
    const [version, setVersion] = useState(""); // Store version input
    const [packages, setPackages] = useState([]); // Store the list of packages

    const handleSearch = async () => {
        if (!pkgQuery || !version) {
            console.error("Package query and version are required.");
            return;
        }

        const body = [
            {
                Version: version,
                Name: pkgQuery,
            },
        ];

        try {
            const response = await apiPost('/packages', { body });
            console.log(response)

            setPackages(response); // Set the list of packages
        } catch (error) {
            console.error('Error retrieving packages:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CustomTextInput
                    placeholder="Package Query"
                    input={pkgQuery}
                    setInput={setPkgQuery}
                />
                <CustomTextInput
                    placeholder="Version"
                    input={version}
                    setInput={setVersion}
                />
                <button onClick={handleSearch}>Search Packages</button>
            </div>

            <div style={{ marginTop: '20px' }}>
                {packages.length > 0 && (
                    <div>
                        <h3>Packages:</h3>
                        <ul>
                            {packages.map(pkg => (
                                <li key={pkg.ID}>
                                    <strong>{pkg.Name}</strong> - Version: {pkg.Version}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DownloadPackages;
