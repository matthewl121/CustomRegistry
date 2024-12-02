/**
* utils.ts
* Utility functions for file operations and text analysis
*/

import { promises as fs } from 'fs';

/**
* Writes formatted JSON data to file
*/
export const writeFile = async (data: any, filename: string) => {
   const dataString = JSON.stringify(data, null, 2);
   await fs.writeFile(filename, dataString);
}

/**
* Checks if readme contains License heading using regex
*/ 
export const hasLicenseHeading = (readmeText: string): boolean => {
   const licenseHeadingRegex = /^(#+)\s*License\b/m;
   const match = licenseHeadingRegex.exec(readmeText);
   return match !== null;
};