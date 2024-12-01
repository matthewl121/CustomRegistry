import React, { useState } from 'react';
import { apiGet } from '../api/api.ts';
import { CustomTextInput } from './index.js';

const DownloadPackages = () => {
    const [pkgQuery, setPkgQuery] = useState("*");
    const [version, setVersion] = useState("");
    const [packages, setPackages] = useState([]);
    const [offset, setOffset] = useState(null);

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
            const { data, headers } = await apiGet('/packages', { body });

            setPackages(data);
            const nextOffset = headers['offset'] || null;
            setOffset(nextOffset);
        } catch (error) {
            console.error('Error retrieving packages:', error);
        }
    };

    const handlePagination = async () => {
        if (!offset) return;

        const body = [
            {
                Version: version,
                Name: pkgQuery,
            },
        ];

        try {
            const { data, headers } = await apiGet('/packages', { body, params: { offset } });

            setPackages(prevPackages => [...prevPackages, ...data]);
            const nextOffset = headers['offset'] || null;
            setOffset(nextOffset);
        } catch (error) {
            console.error('Error retrieving more packages:', error);
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

                {offset && (
                    <button onClick={handlePagination}>Load More</button>
                )}
            </div>
        </div>
    );
};

export default DownloadPackages;
