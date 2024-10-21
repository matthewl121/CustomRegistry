import { apiGetRequest, apiPostRequest } from './apiUtils'
import { ApiResponse, GraphQLResponse } from '../types';
import { ContributorResponse } from '../types';
import { getRepoDataQuery } from './graphqlQueries';
import { writeFile } from '../utils/utils';
import { StringLiteral } from 'typescript';

const GITHUB_BASE_URL: string = "https://api.github.com"

/*  Fetches contributor commit activity for the given repository.
    Metrics Used: Bus Factor 

    Example 200 response:
    data: {
        total: number; // total number of commits by author
        weeks: []; // not needed
        author: {
            login: string; // author's github username
        },
    }
*/
export const fetchContributorActivity = async (
    owner: string, 
    repo: string, 
    token: string
): Promise<ApiResponse<ContributorResponse[] | null>> => {
    const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/stats/contributors`;
    const response = await apiGetRequest<ContributorResponse[]>(url, token);

    if (response.error) {
        console.error('Error fetching contributor commit activity', response.error);
        return { data: null, error: response.error };
    }

    return { data: response.data, error: null };
}

export const fetchRepoData = async (
    owner: string,
    repo: string,
    token: string
): Promise<ApiResponse<GraphQLResponse | null>> => {
    const url = `${GITHUB_BASE_URL}/graphql`;
    const query = getRepoDataQuery(owner, repo);
    const body = JSON.stringify({ query });

    const response = await apiPostRequest<GraphQLResponse>(url, body, token);
    // await writeFile(response, "response1.json")

    if (response.error || !response.data) {
        console.error('Error fetching repository data:', response.error);
        return { data: null, error: response.error };
    }

    return { data: response.data, error: null };
};

// /*  Fetches 100 most recent issues for the given repository filtered by state (open/closed).
//     Metrics Used: Correctness, Responsive Maintainer

//     Example 200 response:
//     data: {
//         total_count: number; // total issues matching the query state
//         items: [
//             {
//                 created_at: string; // issue creation date
//                 updated_at: string; // last update date
//                 closed_at: string | null; // issue closing date (null if open)
//             },
//         ],
//     }
// */
// export const fetchRecentIssuesByState = async (
//     owner: string, 
//     repo: string, 
//     state: string, 
//     token: string
// ): Promise<ApiResponse<IssueSearchResponse | null>> => {
//     const q = `repo:${owner}/${repo}+type:issue+state:${state}&per_page=100`;
//     const url = `${GITHUB_BASE_URL}/search/issues?q=${q}`;
//     const response = await apiGetRequest<IssueSearchResponse>(url, token);

//     if (response.error) {
//         console.error('Error fetching issues:', response.error);
//         return { data: null, error: response.error };
//     }

//     return { data: response.data, error: null };
// }

// /*  Fetches 100 most recent pull requests for the given repository, sorted by the most recently updated.
//     Metrics Used: Responsive Maintainer

//     Example 200 response:
//     data: {
//         total_count: number; // total number of pull requests
//         items: [
//             {
//                 created_at: string; // pull request creation date
//                 updated_at: string; // last update date
//                 closed_at: string | null; // pull request closing date (null if open)
//             },
//         ],
//     }
// */
// export const fetchRecentPullRequests = async (
//     owner: string, 
//     repo: string, 
//     token: string
// ): Promise<ApiResponse<IssueSearchResponse | null>> => {
//     const q = `repo:${owner}/${repo}+type:pr&sort=updated&order=desc&per_page=100`
//     const url = `${GITHUB_BASE_URL}/search/issues?q=${q}`;
//     const response = await apiGetRequest<IssueSearchResponse>(url, token);

//     if (response.error || !response.data) {
//         console.error('Error fetching recent pull requests:', response.error);
//         return { data: null, error: response.error };
//     }

//     return { data: response.data, error: null };
// };

// /*  Fetches the license information for the given repository.
//     Metrics Used: License

//     Example 200 response:
//     data: {
//         license: {
//             key: string; // license identifier (e.g., 'mit')
//             name: string; // full license name (e.g., 'MIT License')
//             spdx_id: string; // SPDX identifier (e.g., 'MIT')
//             url: string; // URL to the license text
//         },
//     }
// */
// export const fetchLicense = async (
//     owner: string, 
//     repo: string, 
//     token: string
// ): Promise<ApiResponse<LicenseResponse>> => {
//     const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/license`;
//     const response = await apiGetRequest<LicenseResponse>(url, token);

//     await writeFile(response, "licenserep.json");

//     if (response.error) {
//         if (response.error === "Not Found") {
//             return { data: { license: null, hasLicense: false }, error: null };
//         }
//         console.error('Error fetching licenses:', response.error);
//         return { data: null, error: response.error };
//     }

//     const data = response.data ?? { license: null, hasLicense: false };
//     return { data: { ...data, hasLicense: true }, error: null };
// };

// export const fetchReadme = async (
//     owner: string,
//     repo: string,
//     token: string
// ): Promise<ApiResponse<ReadmeResponse | null>> => {
//     const url = `${GITHUB_BASE_URL}/repos/${owner}/${repo}/readme`;
//     const response = await apiGetRequest<ReadmeResponse>(url, token)

//     if (response.error || !response.data?.content) {
//         console.error('Error fetching issues:', response.error);
//         return { data: null, error: response.error };
//     }
    
//     return { data: response.data, error: null};
// };
// export const fetchReadMe = async (
//     owner: string, 
//     repo: string, 
//     token: string
// ): Promise<ApiResponse<IssueSearchResponse | null>> => {
//     const q = `repo:${owner}/${repo}+filename:readme`;
//     const url = `${GITHUB_BASE_URL}/search/code?q=${q}`;
//     const response = await apiGetRequest_NoOutput<IssueSearchResponse>(url, token);

//     if (response.error) {
//         console.error('Error fetching readme file:', response.error);
//         return { data: null, error: response.error };
//     }

//     return { data: response.data, error: null };
// }

export const checkFolderExists = async (
    owner: string,
    repo: string,
    token?: string
  ): Promise<boolean> => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/examples`;
    
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }
  
    try {
      const response = await fetch(url, { headers });
      
      if (response.status === 200) {
        return true
      } else if (response.status === 404) {
        // console.log("Folder does not exist.");
        return false
      } else {
        // console.log(`Error: ${response.status} - ${response.statusText}`);
        return false
      }
    } catch (error) {
      console.error("Request failed:", error);
      return false
    }
}

export const getReadmeDetails = async (
    readMe: string,
    examplesFolder: any
): Promise<number> => {
    try {
        const linesLength= readMe.split('\n').length;
        if(linesLength > 75) {
            if(readMe.includes('documentation') && examplesFolder != null) {
                return 0.1;
            } else if(readMe.includes('documentation')) {
                return 0.2;
            } else if(examplesFolder != null) {
                return 0.2;  
            } else {
                return 0.5;
            }
        } else if(readMe.includes('documentation') && examplesFolder != null) {
            return 0.2;
        } else if(readMe.includes('documentation')) {
            return 0.3;
        } else if(examplesFolder != null && examplesFolder.entries.length > 15) {
            return 0.3;
        } else if(examplesFolder != null && examplesFolder.entries.length <= 15) {
            return 0.4;  
        } else if(linesLength <= 5) {
            return 0.9;
        } else if(linesLength > 5 && linesLength <= 20) {
            return 0.8;
        } else if (linesLength > 20 && linesLength <= 35) {
            return 0.7;
        } else if (linesLength > 35 && linesLength <= 50) {
            return 0.6;
        } else {
            return 0.5;
        }
    } catch (error) {
        console.error(error)
        return -1;
    }
}