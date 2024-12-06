import React, { useState } from 'react';
import { apiPost } from '../api/api.ts'; // Assume apiPost is defined for making POST requests

const Reset = () => {
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState(null);

    const handleReset = async () => {
        setIsResetting(true);
        setError(null);

        try {
            const response = await apiPost('/resetRegistry');

            if (response.status === 200) {
                console.log("Registry successfully reset.");
            } else {
                throw new Error('Failed to reset registry');
            }
        } catch (err) {
            setError('Error resetting registry: ' + err.message);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <button onClick={handleReset} disabled={isResetting}>
                {isResetting ? 'Resetting...' : 'Reset Registry'}
            </button>

            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>{error}</strong>
                </div>
            )}
        </div>
    );
};

export default Reset;
