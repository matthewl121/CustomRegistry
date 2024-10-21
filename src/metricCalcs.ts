import { clone, checkout } from 'isomorphic-git';
import * as fs from 'fs';
import http from 'isomorphic-git/http/node';
import { ContributorResponse, ClosedIssueNode, PullRequestNode, OpenIssueNode } from "./types";
import { hasLicenseHeading, writeFile } from "./utils/utils";
import { fetchContributorActivity, fetchRepoData, getReadmeDetails, checkFolderExists } from "./api/githubApi";
import { ApiResponse, GraphQLResponse } from './types';
import { runWorker } from './index';
import { Metrics, WorkerResult } from './types'
import * as path from 'path';
import { logToFile } from './utils/log';


export const calcBusFactorScore = (contributorActivity: ContributorResponse[]): number => {
    if (!contributorActivity) {
        return 0;
    }

    let totalCommits = 0;
    let totalContributors = 0;
    for (const contributor of contributorActivity) {
        totalCommits += contributor.total
        ++totalContributors
    }

    const threshold = Math.ceil(totalCommits * 0.5); // 50% of commits

    let curr = 0;
    let busFactor = 0;

    // contributorActivity default sorting is least to greatest, so iterate R to L 
    for (let i = contributorActivity.length - 1; i >= 0; i--) {
        curr += contributorActivity[i].total;
        busFactor++;

        if (curr >= threshold) {
            break;
        }
    }

    const averageBusFactor = 3;
    // if bus factor is 10+, thats more than enough
    if (busFactor > 9) {
        return 1;
    }

    // scale bus factor values using sigmoid function
    return 1 - Math.exp(-(busFactor ** 2) / (2 * averageBusFactor ** 2));
}

export const calcCorrectnessScore = (totalOpenIssuesCount: number, totalClosedIssuesCount: number): number => {
    const totalIssues = totalOpenIssuesCount + totalClosedIssuesCount;
    if (totalIssues == 0) {
        return 1;
    }

    return totalClosedIssuesCount / totalIssues;
}

export const calcResponsivenessScore = (
    closedIssues: ClosedIssueNode[], 
    openIssues: OpenIssueNode[], 
    pullRequests: PullRequestNode[],
    sinceDate: Date,
    isArchived: boolean
): number => {
    if (isArchived) {
        // repo is no longer maintained
        return 0;
    }

    let openIssueCount = 0;
    let closedIssueCount = 0;
    let openPRCount = 0;
    let closedPRCount = 0;

    for (let i = 0; i < Math.max(pullRequests.length, openIssues.length, closedIssues.length); ++i) {
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && !pullRequests[i].closedAt) {
            openPRCount++;
        }
        if (i < pullRequests.length && new Date(pullRequests[i].createdAt) >= sinceDate && pullRequests[i].closedAt) {
            closedPRCount++;
        }
        if (i < openIssues.length && new Date(openIssues[i].createdAt) >= sinceDate) {
            openIssueCount++;
        }
        if (i < closedIssues.length && new Date(closedIssues[i].createdAt) >= sinceDate) {
            closedIssueCount++;
        }
    }

    const totalRecentIssues = openIssueCount + closedIssueCount;
    const totalRecentPRs = openPRCount + closedPRCount;

    const issueCloseRatio = totalRecentIssues > 0 
        ? closedIssueCount / totalRecentIssues 
        : 0;
    const prCloseRatio = totalRecentPRs > 0 
        ? closedPRCount / totalRecentPRs 
        : 0;
    
    return 0.5 * issueCloseRatio + 0.5 * prCloseRatio
};

export const calcLicenseScore = async (repoUrl: string, localDir: string): Promise<number> => {

    await clone({
        fs,
        http,
        dir: localDir,
        url: repoUrl,
        singleBranch: true,
        depth: 1,
        
    });
  
    const licenseFilePath = `${localDir}/LICENSE`;
    const readmeFilePath = `${localDir}/README.md`;
    const packageJsonPath = `${localDir}/package.json`;

    if (fs.existsSync(licenseFilePath)) {
        return 1;
    }
  
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.license) {
            return 1;
        }
    }

    if (fs.existsSync(readmeFilePath)) {
        const readmeText = fs.readFileSync(readmeFilePath, 'utf8');
        return hasLicenseHeading(readmeText) ? 1 : 0;
    }
  
    return 0;
};

export async function calcBusFactor(owner: string, repo: string, token: string): Promise<number> {
    let busFactor;
    const contributorActivity = await fetchContributorActivity(owner, repo, token);
    if (!contributorActivity?.data || !Array.isArray(contributorActivity.data)) {
        busFactor = -1
    } else {
        busFactor = calcBusFactorScore(contributorActivity.data);
    }

    return busFactor;
}

export function calcCorrectness(repoData: ApiResponse<GraphQLResponse | null>): number {
    const totalOpenIssues = repoData.data?.data.repository.openIssues;
    const totalClosedIssues = repoData.data?.data.repository.closedIssues;

    if (!totalOpenIssues || !totalClosedIssues) {
        return -1;
    }
    const correctness = calcCorrectnessScore(totalOpenIssues.totalCount, totalClosedIssues.totalCount);

    return correctness;
}

export function calcResponsiveness(repoData: ApiResponse<GraphQLResponse | null>): number {
    const recentPullRequests = repoData.data?.data.repository.pullRequests;
    const isArchived = repoData.data?.data.repository.isArchived;
    const totalOpenIssues = repoData.data?.data.repository.openIssues;
    const totalClosedIssues = repoData.data?.data.repository.closedIssues;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    if (!recentPullRequests?.nodes || !totalClosedIssues?.nodes || !totalOpenIssues?.nodes) {
        return -1;
    }
    const responsiveness = calcResponsivenessScore(totalClosedIssues.nodes, totalOpenIssues.nodes, recentPullRequests.nodes, oneMonthAgo, isArchived ?? false);

    return responsiveness;
}

export async function calcLicense(owner: string, repo: string, repoURL: string): Promise<number> {
    const localDir = path.join("./repos", `${owner}_${repo}`);
    const license = await calcLicenseScore(repoURL, localDir);

    return license;
}

export async function calcRampUp(repoData: ApiResponse<GraphQLResponse | null>): Promise<number> {
    const READMEMD = repoData.data?.data.repository.READMEMD;
    const READMENOEXT = repoData.data?.data.repository.READMENOEXT;
    const READMETXT = repoData.data?.data.repository.READMETXT;
    const READMERDOC = repoData.data?.data.repository.READMERDOC;
    const READMEHTML = repoData.data?.data.repository.READMEHTML;
    const READMEADOC = repoData.data?.data.repository.READMEADOC;
    const READMEMARKDOWN = repoData.data?.data.repository.READMEMARKDOWN;
    const READMEYAML = repoData.data?.data.repository.READMEYAML;
    const READMERST = repoData.data?.data.repository.READMERST;
    const READMETEXTILE = repoData.data?.data.repository.READMETEXTILE;
    const readmemd = repoData.data?.data.repository.readmemd;
    const readmenoext = repoData.data?.data.repository.readmenoext;
    const readmetxt = repoData.data?.data.repository.readmetxt;
    const readmerdoc = repoData.data?.data.repository.readmerdoc;
    const readmehtml = repoData.data?.data.repository.readmehtml;
    const readmeadoc = repoData.data?.data.repository.readmeadoc;
    const readmemarkdown = repoData.data?.data.repository.readmemarkdown;
    const readmeyaml = repoData.data?.data.repository.readmeyaml;
    const readmerst = repoData.data?.data.repository.readmerst;
    const readmetextile = repoData.data?.data.repository.readmetextile;
    const readMemd = repoData.data?.data.repository.readMemd;
    const readMenoext = repoData.data?.data.repository.readMenoext;
    const readMetxt = repoData.data?.data.repository.readMetxt;
    const readMerdoc = repoData.data?.data.repository.readMerdoc;
    const readMehtml = repoData.data?.data.repository.readMehtml;
    const readMeadoc = repoData.data?.data.repository.readMeadoc;
    const readMemarkdown = repoData.data?.data.repository.readMemarkdown;
    const readMeyaml = repoData.data?.data.repository.readMeyaml;
    const readMerst = repoData.data?.data.repository.readMerst;
    const readMetextile = repoData.data?.data.repository.readMetextile;
    const ReadMemd = repoData.data?.data.repository.ReadMemd;
    const ReadMenoext = repoData.data?.data.repository.ReadMenoext;
    const ReadMetxt = repoData.data?.data.repository.ReadMetxt;
    const ReadMerdoc = repoData.data?.data.repository.ReadMerdoc;
    const ReadMehtml = repoData.data?.data.repository.ReadMehtml;
    const ReadMeadoc = repoData.data?.data.repository.ReadMeadoc;
    const ReadMemarkdown = repoData.data?.data.repository.ReadMemarkdown;
    const ReadMeyaml = repoData.data?.data.repository.ReadMeyaml;
    const ReadMerst = repoData.data?.data.repository.ReadMerst;
    const ReadMetextile = repoData.data?.data.repository.ReadMetextile;
    const Readmemd = repoData.data?.data.repository.Readmemd;
    const Readmenoext = repoData.data?.data.repository.Readmenoext;
    const Readmetxt = repoData.data?.data.repository.Readmetxt;
    const Readmerdoc = repoData.data?.data.repository.Readmerdoc;
    const Readmehtml = repoData.data?.data.repository.Readmehtml;
    const Readmeadoc = repoData.data?.data.repository.Readmeadoc;
    const Readmemarkdown = repoData.data?.data.repository.Readmemarkdown;
    const Readmeyaml = repoData.data?.data.repository.Readmeyaml;
    const Readmerst = repoData.data?.data.repository.Readmerst;
    const Readmetextile = repoData.data?.data.repository.Readmetextile;


    const examplesFolder = repoData.data?.data.repository.examplesFolder;
    const exampleFolder = repoData.data?.data.repository.exampleFolder;
    const ExamplesFolder = repoData.data?.data.repository.ExamplesFolder;
    const ExampleFolder = repoData.data?.data.repository.ExampleFolder;
    await writeFile(repoData, "repoData.json");
    
    // Readme
    let readMe = null;
    if(READMEMD?.text) {
        readMe = READMEMD;
    } else if(READMENOEXT?.text) {
        readMe = READMENOEXT;
    } else if(READMETXT?.text) {
        readMe = READMETXT;
    } else if(READMERDOC?.text) {
        readMe = READMERDOC;
    } else if(READMEHTML?.text) {
        readMe = READMEHTML;
    } else if(READMEADOC?.text) {
        readMe = READMEADOC;
    } else if(READMEMARKDOWN?.text) {
        readMe = READMEMARKDOWN;
    } else if(READMEYAML?.text) {
        readMe = READMEYAML;
    } else if(READMERST?.text) {
        readMe = READMERST;
    } else if(READMETEXTILE?.text) {
        readMe = READMETEXTILE;
    } else if(readmemd?.text) {
        readMe = readmemd;
    } else if(readmenoext?.text) {
        readMe = readmenoext;
    } else if(readmetxt?.text) {
        readMe = readmetxt;
    } else if(readmerdoc?.text) {
        readMe = readmerdoc;
    } else if(readmehtml?.text) {
        readMe = readmehtml;
    } else if(readmeadoc?.text) {
        readMe = readmeadoc;
    } else if(readmemarkdown?.text) {
        readMe = readmemarkdown;
    } else if(readmeyaml?.text) {
        readMe = readmeyaml;
    } else if(readmerst?.text) {
        readMe = readmerst;
    } else if(readmetextile?.text) {
        readMe = readmetextile;
    } else if(readMemd?.text) {
        readMe = readMemd;
    } else if(readMenoext?.text) {
        readMe = readMenoext;
    } else if(readMetxt?.text) {
        readMe = readMetxt;
    } else if(readMerdoc?.text) {
        readMe = readMerdoc;
    } else if(readMehtml?.text) {
        readMe = readMehtml;
    } else if(readMeadoc?.text) {
        readMe = readMeadoc;
    } else if(readMemarkdown?.text) {
        readMe = readMemarkdown;
    } else if(readMeyaml?.text) {
        readMe = readMeyaml;
    } else if(readMerst?.text) {
        readMe = readMerst;
    } else if(readMetextile?.text) {
        readMe = readMetextile;
    } else if(ReadMemd?.text) {
        readMe = ReadMemd;
    } else if(ReadMenoext?.text) {
        readMe = ReadMenoext;
    } else if(ReadMetxt?.text) {
        readMe = ReadMetxt;
    } else if(ReadMerdoc?.text) {
        readMe = ReadMerdoc;
    } else if(ReadMehtml?.text) {
        readMe = ReadMehtml;
    } else if(ReadMeadoc?.text) {
        readMe = ReadMeadoc;
    } else if(ReadMemarkdown?.text) {
        readMe = ReadMemarkdown;
    } else if(ReadMeyaml?.text) {
        readMe = ReadMeyaml;
    } else if(ReadMerst?.text) {
        readMe = ReadMerst;
    } else if(ReadMetextile?.text) {
        readMe = ReadMetextile;
    } else if(Readmemd?.text) {
        readMe = Readmemd;
    } else if(Readmenoext?.text) {
        readMe = Readmenoext;
    } else if(Readmetxt?.text) {
        readMe = Readmetxt;
    } else if(Readmerdoc?.text) {
        readMe = Readmerdoc;
    } else if(Readmehtml?.text) {
        readMe = Readmehtml;
    } else if(Readmeadoc?.text) {
        readMe = Readmeadoc;
    } else if(Readmemarkdown?.text) {
        readMe = Readmemarkdown;
    } else if(Readmeyaml?.text) {
        readMe = Readmeyaml;
    } else if(Readmerst?.text) {
        readMe = Readmerst;
    } else if(Readmetextile?.text) {
        readMe = Readmetextile;
    }

    let exFolder = null;
    if(examplesFolder != null) {
        exFolder = examplesFolder;
    } else if(exampleFolder != null) {
        exFolder = exampleFolder;
    } else if(ExamplesFolder != null) {
        exFolder = ExamplesFolder;
    } else if(ExampleFolder != null) {
        exFolder = ExampleFolder;
    }

    let rampUp = null;
    if(!readMe?.text) {
        rampUp = 0.9;
    } else {
        rampUp = await getReadmeDetails(readMe.text, exFolder);
    }

    return rampUp;
}

export async function calculateMetrics(owner: string, repo: string, token: string, repoURL: string, repoData: ApiResponse<GraphQLResponse | null>, inputURL: string): Promise<Metrics | null> {
    // concurrently calculate metrics
    const busFactorWorker = runWorker(owner, repo, token, repoURL, repoData, "busFactor");
    const correctnessWorker = runWorker(owner, repo, token, repoURL, repoData, "correctness");
    const rampUpWorker = runWorker(owner, repo, token, repoURL, repoData, "rampUp");
    const responsivenessWorker = runWorker(owner, repo, token, repoURL, repoData, "responsiveness");
    const licenseWorker = runWorker(owner, repo, token, repoURL, repoData, "license");

    const results = await Promise.all([busFactorWorker, correctnessWorker, rampUpWorker, responsivenessWorker, licenseWorker]);

    // parse metric scores and latencies
    let busFactor = results[0].score;
    let correctness = results[1].score;
    let rampUp = results[2].score;
    let responsiveness = results[3].score;
    let license = results[4].score;

    let busFactorLatency = results[0].latency;
    let correctnessLatency = results[1].latency;
    let rampUpLatency = results[2].latency;
    let responsivenessLatency = results[3].latency;
    let licenseLatency = results[4].latency;

    // verify calculations
    if (correctness == -1) {
        logToFile("Unable to calculate correctness", 1);
        return null;
    }
    if (responsiveness == -1) {
        logToFile("Unable to calculate responsiveness", 1);
        return null;
    }

    // calculate net score
    const begin = Date.now();
    const netScore = (busFactor*0.25) + (correctness*0.30) + (rampUp*0.20) + (responsiveness*0.15) + (license*0.10);
    const end = Date.now();

    const metrics: Metrics = {
        URL: inputURL,
        NetScore: netScore,
        NetScore_Latency: (end - begin) / 1000,
        RampUp: rampUp,
        RampUp_Latency: rampUpLatency,
        Correctness: correctness,
        Correctness_Latency: correctnessLatency,
        BusFactor: busFactor,
        BusFactor_Latency: busFactorLatency,
        ResponsiveMaintainer: responsiveness,
        ResponsiveMaintainer_Latency: responsivenessLatency,
        License: license,
        License_Latency: licenseLatency
    };

    return metrics;
}