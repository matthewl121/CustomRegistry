import React, { useState } from 'react';
import { CustomTextInput } from '.';
import { apiGet } from '../api/api.ts';

export const PackageRating = () => {
    const [pkgId, setPkgId] = useState("");
    const [rating, setRating] = useState(null);
    const [error, setError] = useState("");

    const handleRating = async () => {
        if (!pkgId) {
            console.error("Package ID is required.");
            return;
        }

        try {
            const { data } = await apiGet(`/package/${pkgId}/rate`);
            setRating(data);  // Store the returned rating data
            setError("");  // Clear any previous errors
        } catch (err) {
            setError('Error fetching rating: ' + err.message);  // Handle errors
            setRating(null);  // Clear previous rating on error
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
            </div>
            <button onClick={handleRating}>Get Rating</button>

            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>{error}</strong>
                </div>
            )}

            {rating && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Package Rating:</h3>
                    <pre>{JSON.stringify(rating, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default PackageRating;
