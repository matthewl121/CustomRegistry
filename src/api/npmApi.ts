import { ApiResponse, NpmApiResponse } from '../types';
import { apiGetRequest } from './apiUtils';

const NPM_BASE_URL: string = "https://registry.npmjs.org";

export const fetchGithubUrlFromNpm = async (packageName: string): Promise<ApiResponse<string | null>> => {
    const url = `${NPM_BASE_URL}/${packageName}`;
    const response = await apiGetRequest<NpmApiResponse>(url);

    if (response.error || !response.data || !response.data.repository || !response.data.repository.url) {
        return { data: null, error: 'Repository URL not found' };
    }

    let repoUrl: string = response.data.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
    if (repoUrl.startsWith('ssh://')) {
        repoUrl = repoUrl.replace('ssh://git@', 'https://');
    } else if (repoUrl.startsWith('git@')) {
        repoUrl = repoUrl.replace('git@', 'https://').replace('.com:', '.com/');
    } else if(repoUrl.startsWith('git://')) {
        repoUrl = repoUrl.replace('git://', 'https://');
    }

    return { data: repoUrl, error: null };
};
