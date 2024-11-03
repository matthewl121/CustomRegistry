import React, { useState } from 'react';
import { CustomTextInput, DropdownMenu } from '.'
import { packageNames } from '../data/dummyPackages';

export const PackageRating = () => {
    const [pkgData, setPkgData] = useState(packageNames)
    const [input, setInput] = useState("")
    const [pkg, setPkg] = useState("")

    const handleRating = async () => {
        if (!pkg) return
        /* API call for rating a package
        ** Endpoint: GET /package/{id}/rate => AWS Lambda fn: ratePackage
        */
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
                <CustomTextInput
                    placeholder={`Search registry`}
                    input={input}
                    setInput={setInput}
                />
                {<DropdownMenu
                    data={pkgData}
                    input={input}
                    setPkg={setPkg}
                />}
            </div>
            <button onClick={handleRating}>Get Rating</button>
        </div>
    )
};

export default PackageRating