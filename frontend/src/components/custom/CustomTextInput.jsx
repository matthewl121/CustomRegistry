import React from 'react';

const CustomTextInput = ({ placeholder, input, setInput }) => {
    return (
        <input
            style={{
                border: 'none',
                borderBottom: '2px solid var(--text-color)',
                padding: '8px 0',
                outline: 'none',
                fontSize: '16px',
                width: '100%',
                color: 'var(--text-color)',
                backgroundColor: 'var(--background-color)',
                transition: 'border-color 0.15s ease',
                margin: "15px 0px"
            }}
            type="text"
            value={input}
            placeholder={placeholder}
            onChange={(e) => setInput(e.target.value)}
            onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent-color-2)'}
            onBlur={(e) => e.target.style.borderBottomColor = 'var(--text-color)'}
        />
    );
};

export default CustomTextInput;
