"use strict";
/**
* utils.ts
* Utility functions for file operations and text analysis
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasLicenseHeading = exports.writeFile = void 0;
const fs_1 = require("fs");
/**
* Writes formatted JSON data to file
*/
const writeFile = async (data, filename) => {
    const dataString = JSON.stringify(data, null, 2);
    await fs_1.promises.writeFile(filename, dataString);
};
exports.writeFile = writeFile;
/**
* Checks if readme contains License heading using regex
*/
const hasLicenseHeading = (readmeText) => {
    const licenseHeadingRegex = /^(#+)\s*License\b/m;
    const match = licenseHeadingRegex.exec(readmeText);
    return match !== null;
};
exports.hasLicenseHeading = hasLicenseHeading;
//# sourceMappingURL=utils.js.map