import React, { useState } from 'react';

const CustomText = ({ text, isActive, setActiveText }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <h3
            style={{
                color: isActive ? "var(--accent-color-2)" : isHovered ? "var(--accent-color-1)" : "var(--text-color)",
                borderBottom: isActive ? "2px solid var(--accent-color-2)" : "none",
                padding: '5px 15px',
                transition: "color 0.15s ease",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setActiveText(text)}
        >
            {text}
        </h3>
    );
}

export default CustomText;
