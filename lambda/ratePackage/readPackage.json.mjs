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
        const unzipped = await gunzipAsync(buffer);
        
        return new Promise((resolve, reject) => {
            const extract = tar.extract();
            let found = false;
            
            extract.on('entry', (header, stream, next) => {
                // Look for package.json in any directory level
                if (header.name.endsWith('package.json')) {
                    found = true;
                    let data = '';
                    
                    stream.on('data', chunk => data += chunk);
                    
                    stream.on('end', () => {
                        try {
                            const packageJson = JSON.parse(data);
                            resolve(packageJson);
                        } catch (err) {
                            reject(new Error(`Failed to parse package.json: ${err.message}`));
                        }
                    });
                    
                    stream.on('error', err => {
                        reject(new Error(`Error reading package.json stream: ${err.message}`));
                    });
                } else {
                    stream.resume();
                    next();
                }
            });

            extract.on('finish', () => {
                if (!found) {
                    reject(new Error('No package.json found in the content'));
                }
            });

            extract.on('error', err => {
                reject(new Error(`Failed to extract tar content: ${err.message}`));
            });

            Readable.from(unzipped).pipe(extract);
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
        const bugsUrl = packageJson.bugs.url;
        if (bugsUrl.includes('github.com')) {
            return bugsUrl.replace('/issues', '');
        }
        return bugsUrl;
    }

    return null;
}

function normalizeGitUrl(url) {
    if (!url) return null;
    
    let normalizedUrl = url;
    
    // Remove git+ prefix if present
    normalizedUrl = normalizedUrl.replace(/^git\+/, '');
    
    // Convert git:// to https://
    normalizedUrl = normalizedUrl.replace(/^git:\/\//, 'https://');
    
    // Convert SSH format to HTTPS
    normalizedUrl = normalizedUrl.replace(/^git@github\.com:/, 'https://github.com/');
    normalizedUrl = normalizedUrl.replace(/^git@gitlab\.com:/, 'https://gitlab.com/');
    normalizedUrl = normalizedUrl.replace(/^git@bitbucket\.org:/, 'https://bitbucket.org/');
    
    // Remove .git suffix if present
    normalizedUrl = normalizedUrl.replace(/\.git$/, '');
    
    // Validate URL format
    try {
        new URL(normalizedUrl);
        return normalizedUrl;
    } catch {
        return null;
    }
}

export async function getRepoUrlFromPackage(base64Content) {
    try {
        if (!base64Content) {
            console.error('No content provided to getRepoUrlFromPackage');
            return null;
        }

        const packageJson = await readPackageJsonFromBase64(base64Content);
        if (!packageJson) {
            console.error('Failed to read package.json from content');
            return null;
        }

        const repoUrl = getRepoUrlFromPackageJson(packageJson);
        if (!repoUrl) {
            console.error('No repository URL found in package.json');
            return null;
        }

        return repoUrl;
    } catch (error) {
        console.error('Failed to get repository URL:', error);
        return null;
    }
}