import React, { useState } from 'react'
import { CustomTextInput, DropdownMenu } from '.'
import { packageNames } from '../data/dummyPackages'

const DownloadPackage = () => {
    const [pkgData, setPkgData] = useState(packageNames)
    const [input, setInput] = useState("")
    const [pkg, setPkg] = useState("")

    
    const handleDownload = async () => {
        if (!pkg) return
        console.log(pkg)
        /* API call for downloading a package
        ** Endpoint: GET /package/{id} => AWS Lambda fn: downloadPackage
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
            <button onClick={handleDownload}>Download</button>
        </div>
    )
}

export default DownloadPackage