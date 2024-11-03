import React, { useState } from 'react';
import { CustomText, DownloadPackage, PackageCost, RatePackage, UpdatePackage, UploadPackage } from '.';

const Home = () => {
    const [activeText, setActiveText] = useState(null);

    const componentsMap = {
        "Download Package": <DownloadPackage />,
        "Upload Package": <UploadPackage />,
        "Update Package": <UpdatePackage />,
        "Rate Package": <RatePackage />,
        "Package Cost": <PackageCost />
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <h1>Custom Registry</h1>
            <div style={{ display: 'flex' }}>
                {Object.keys(componentsMap).map(text => (
                    <CustomText 
                        key={text} 
                        text={text} 
                        isActive={activeText === text} 
                        setActiveText={setActiveText} 
                    />
                ))}
            </div>
            <div>
                {componentsMap[activeText] || null}
            </div>
        </div>
    );
};

export default Home;
