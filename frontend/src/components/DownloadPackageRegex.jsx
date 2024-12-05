import React, { useState } from 'react';
import { CustomTextInput } from './index.js';
import { apiPost } from '../api/api.ts';

const DownloadPackageRegex = () => {
    const [regex, setRegex] = useState("");
    const [packages, setPackages] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!regex) {
            // If the regex is empty, set an error message
            setError("Regular Expression is required.");
            return;
        }

        setLoading(true);
        setError(""); // Clear previous errors

        try {
            const response = await apiPost('/package/byRegEx', {
                body: { RegEx: regex },
            });

            console.log("data:", response);

            setPackages(response);
            setError(""); // Clear error on success
        } catch (err) {
            setError('Error fetching packages: ' + err.message);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPackage = (packageId) => {
        // Handle package download
        console.log(`Downloading package with ID: ${packageId}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h1>Download Package by Regular Expression</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CustomTextInput
                    placeholder="Enter Regular Expression"
                    input={regex}
                    setInput={setRegex}
                />
            </div>

            <button onClick={handleDownload} disabled={loading}>
                {loading ? 'Loading...' : 'Search Packages'}
            </button>

            {/* Error message display */}
            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>{error}</strong>
                </div>
            )}

            {/* Display packages if available */}
            {packages && packages.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Matching Packages:</h3>
                    <ul>
                        {packages.map((pkg) => (
                            <li key={pkg.ID}>
                                <p>{pkg.Name} - {pkg.Version}</p>
                                <button onClick={() => handleDownloadPackage(pkg.ID)}>
                                    Download
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DownloadPackageRegex;
