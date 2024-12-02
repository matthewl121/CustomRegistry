import React, { useState } from 'react';
import { CustomTextInput } from './index.js';
import { apiGet } from '../api/api.ts';

const PackageCost = () => {
    const [pkgId, setPkgId] = useState(""); // Store package ID
    const [includeDependencies, setIncludeDependencies] = useState(false); // Control checkbox for including dependencies
    const [cost, setCost] = useState(null); // Store package cost
    const [error, setError] = useState(""); // Store error message

    const handleCost = async () => {
        if (!pkgId) {
            setError("Package ID is required.");
            setCost(null); // Reset cost if package ID is missing
            return;
        }

        try {
            // Make the API call to fetch the cost, including dependencies if selected
            const response = await apiGet(`/package/${pkgId}/cost`, {
                params: { dependency: includeDependencies.toString() }, // Send dependency as a string ("true" or "false")
            });

            // Update cost state based on the response (use the provided ID for cost lookup)
            if (response[pkgId]) {
                setCost(response[pkgId].totalCost || 'N/A'); // Use total cost if available
            } else {
                setCost('N/A'); // Fallback if no cost is found
            }

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
                            onChange={() => setIncludeDependencies(!includeDependencies)} // Toggle dependencies checkbox
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
