import React, { useState } from 'react';
import { CustomTextInput } from '.';
import { apiPost } from '../api/api.ts';

const DownloadPackageRegex = () => {
    const [regex, setRegex] = useState("");
    const [packages, setPackages] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!regex) {
            console.error("Regular Expression is required.");
            return;
        }

        setLoading(true);

        try {
            const response = await apiPost('/package/byRegEx', {
                body: { RegEx: regex },
            });

            console.log("data:", response)

            setPackages(response);
            setError("");
        } catch (err) {
            setError('Error fetching packages: ' + err.message);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPackage = (packageId) => {
        // Function to handle the actual package download
        // You can implement download logic based on how the backend serves the files.
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

            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>{error}</strong>
                </div>
            )}

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
