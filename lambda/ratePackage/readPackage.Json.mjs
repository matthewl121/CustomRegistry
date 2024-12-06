import { gunzip } from 'zlib';
import { promisify } from 'util';
import tar from 'tar';
import { Readable } from 'stream';

const gunzipAsync = promisify(gunzip);

async function readPackageJsonFromBase64(base64Content) {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Decompress the gzipped content
    const unzippedBuffer = await gunzipAsync(buffer);
    
    // Create a readable stream from the unzipped buffer
    const stream = Readable.from(unzippedBuffer);
    
    // Variable to store package.json content
    let packageJson = null;
    
    // Create a promise to handle the tar extraction
    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      
      extract.on('entry', (header, stream, next) => {
        // Look for package.json in the root or first level directory
        if (header.name.match(/(^|\/)package\.json$/)) {
          let data = '';
          
          stream.on('data', chunk => data += chunk);
          
          stream.on('end', () => {
            try {
              packageJson = JSON.parse(data);
              next();
            } catch (err) {
              reject(new Error(`Failed to parse package.json: ${err.message}`));
            }
          });
          
          stream.on('error', err => {
            reject(new Error(`Error reading package.json stream: ${err.message}`));
          });
        } else {
          // Skip other files
          stream.resume();
          next();
        }
      });

      extract.on('finish', () => {
        if (packageJson) {
          resolve(packageJson);
        } else {
          reject(new Error('No package.json found in the content'));
        }
      });

      extract.on('error', err => {
        reject(new Error(`Failed to extract tar content: ${err.message}`));
      });
      
      stream.pipe(extract);
    });
  } catch (error) {
    throw new Error(`Failed to process base64 content: ${error.message}`);
  }
}

function getRepoUrlFromPackageJson(packageJson) {
  // Try to get URL from repository field
  if (packageJson.repository) {
    if (typeof packageJson.repository === 'string') {
      return normalizeGitUrl(packageJson.repository);
    }
    if (typeof packageJson.repository === 'object' && packageJson.repository.url) {
      return normalizeGitUrl(packageJson.repository.url);
    }
  }

  // Try homepage if repository is not available
  if (packageJson.homepage) {
    return packageJson.homepage;
  }

  // Try bugs URL as last resort
  if (packageJson.bugs && packageJson.bugs.url) {
    // Convert bugs URL to repository URL if it's a GitHub URL
    const bugsUrl = packageJson.bugs.url;
    if (bugsUrl.includes('github.com')) {
      return bugsUrl.replace('/issues', '');
    }
    return bugsUrl;
  }

  return null;
}

function normalizeGitUrl(url) {
  let normalizedUrl = url;
  
  // Remove git+ prefix if present
  normalizedUrl = normalizedUrl.replace(/^git\+/, '');
  
  // Convert git:// to https://
  normalizedUrl = normalizedUrl.replace(/^git:\/\//, 'https://');
  
  // Convert SSH format to HTTPS
  normalizedUrl = normalizedUrl.replace(/^git@github.com:/, 'https://github.com/');
  
  // Remove .git suffix if present
  normalizedUrl = normalizedUrl.replace(/\.git$/, '');
  
  // Convert other git providers if needed
  normalizedUrl = normalizedUrl.replace(/^git@gitlab.com:/, 'https://gitlab.com/');
  normalizedUrl = normalizedUrl.replace(/^git@bitbucket.org:/, 'https://bitbucket.org/');
  
  return normalizedUrl;
}

export async function getRepoUrlFromPackage(base64Content) {
  try {
    const packageJson = await readPackageJsonFromBase64(base64Content);
    const repoUrl = getRepoUrlFromPackageJson(packageJson);
    
    if (!repoUrl) {
      throw new Error('No repository URL found in package.json');
    }
    
    return repoUrl;
  } catch (error) {
    console.error('Failed to get repository URL:', error);
    return null;
  }
}