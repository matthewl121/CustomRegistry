import React, { useState } from 'react';
import { CustomTextInput } from '.';
import { apiGet } from '../api/api.ts';

const PackageCost = () => {
    const [pkgId, setPkgId] = useState("");
    const [includeDependencies, setIncludeDependencies] = useState(false);
    const [cost, setCost] = useState(null);
    const [error, setError] = useState("");

    const handleCost = async () => {
        if (!pkgId) {
            console.error("Package ID is required.");
            return;
        }

        try {
            // Make the API call to fetch the cost, including dependency if selected
            const { data } = await apiGet(`/package/${pkgId}/cost`, {
                params: { dependency: includeDependencies },
            });

            setCost(data[pkgId]?.totalCost || 'N/A'); // Assuming the package cost is under the provided ID
            setError("");  // Clear any previous errors
        } catch (err) {
            setError('Error fetching cost: ' + err.message);  // Handle errors
            setCost(null);  // Clear previous cost on error
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CustomTextInput
                    placeholder="Enter Package ID"
                    input={pkgId}
                    setInput={setPkgId}
                />
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={includeDependencies}
                            onChange={() => setIncludeDependencies(!includeDependencies)}
                        />
                        Include Dependencies
                    </label>
                </div>
            </div>

            <button onClick={handleCost}>Get Cost</button>

            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>{error}</strong>
                </div>
            )}

            {cost !== null && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Package Cost:</h3>
                    <p>Total Cost: ${cost}</p>
                </div>
            )}
        </div>
    );
};

export default PackageCost;
