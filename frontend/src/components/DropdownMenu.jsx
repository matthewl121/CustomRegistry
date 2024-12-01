import React from 'react';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

const DropdownMenu = ({ data, input, setPkg }) => {
    return (
        <Dropdown
            
            options={Array.from(
                // set only includes pkgs with input substr
                new Set(data.filter(pkg => pkg.includes(input)).sort((a, b) => {
                    // moves pkgs that start with the curr input to the beginning
                    if (a.startsWith(input) && !b.startsWith(input)) return -1;
                    if (!a.startsWith(input) && b.startsWith(input)) return 1;
                    return 0;
                }))
            )}
            placeholder="Select an option"
            onChange={(option) => setPkg(option.value)}
        />
    );
};

export default DropdownMenu;
