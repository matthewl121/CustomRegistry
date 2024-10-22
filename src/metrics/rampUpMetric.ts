// src/metrics/rampUpMetric.ts
import { ApiResponse, GraphQLResponse } from '../types';
import { writeFile, getReadmeDetails } from '../utils/utils';

interface ReadmeFile {
    text: string;
}

interface ExampleFolder {
    entries: {
        name: string;
        type: string;
    }[];
}

export async function calcRampUp(repoData: ApiResponse<GraphQLResponse | null>): Promise<number> {
    try {
        await writeFile(repoData, "repoData.json");
        
        // Define all possible README variants
        const readmeVariants: (ReadmeFile | undefined | null)[] = [
            repoData.data?.data.repository.READMEMD,
            repoData.data?.data.repository.READMENOEXT,
            repoData.data?.data.repository.READMETXT,
            repoData.data?.data.repository.READMERDOC,
            repoData.data?.data.repository.READMEHTML,
            repoData.data?.data.repository.READMEADOC,
            repoData.data?.data.repository.READMEMARKDOWN,
            repoData.data?.data.repository.READMEYAML,
            repoData.data?.data.repository.READMERST,
            repoData.data?.data.repository.READMETEXTILE,
            repoData.data?.data.repository.readmemd,
            repoData.data?.data.repository.readmenoext,
            repoData.data?.data.repository.readmetxt,
            repoData.data?.data.repository.readmerdoc,
            repoData.data?.data.repository.readmehtml,
            repoData.data?.data.repository.readmeadoc,
            repoData.data?.data.repository.readmemarkdown,
            repoData.data?.data.repository.readmeyaml,
            repoData.data?.data.repository.readmerst,
            repoData.data?.data.repository.readmetextile,
            repoData.data?.data.repository.readMemd,
            repoData.data?.data.repository.readMenoext,
            repoData.data?.data.repository.readMetxt,
            repoData.data?.data.repository.readMerdoc,
            repoData.data?.data.repository.readMehtml,
            repoData.data?.data.repository.readMeadoc,
            repoData.data?.data.repository.readMemarkdown,
            repoData.data?.data.repository.readMeyaml,
            repoData.data?.data.repository.readMerst,
            repoData.data?.data.repository.readMetextile,
            repoData.data?.data.repository.ReadMemd,
            repoData.data?.data.repository.ReadMenoext,
            repoData.data?.data.repository.ReadMetxt,
            repoData.data?.data.repository.ReadMerdoc,
            repoData.data?.data.repository.ReadMehtml,
            repoData.data?.data.repository.ReadMeadoc,
            repoData.data?.data.repository.ReadMemarkdown,
            repoData.data?.data.repository.ReadMeyaml,
            repoData.data?.data.repository.ReadMerst,
            repoData.data?.data.repository.ReadMetextile,
            repoData.data?.data.repository.Readmemd,
            repoData.data?.data.repository.Readmenoext,
            repoData.data?.data.repository.Readmetxt,
            repoData.data?.data.repository.Readmerdoc,
            repoData.data?.data.repository.Readmehtml,
            repoData.data?.data.repository.Readmeadoc,
            repoData.data?.data.repository.Readmemarkdown,
            repoData.data?.data.repository.Readmeyaml,
            repoData.data?.data.repository.Readmerst,
            repoData.data?.data.repository.Readmetextile
        ];

        // Find first available README
        const readMe = readmeVariants.find(r => r?.text);

        // Check for examples folder
        const exFolder: ExampleFolder | null | undefined = 
            repoData.data?.data.repository.examplesFolder ?? 
            repoData.data?.data.repository.exampleFolder ??
            repoData.data?.data.repository.ExamplesFolder ??
            repoData.data?.data.repository.ExampleFolder;

        // If no README is found, return default score
        if (!readMe?.text) {
            return 0.9;
        }

        // Calculate ramp-up score based on README content and examples
        return await getReadmeDetails(readMe.text, exFolder);
    } catch (error) {
        // If there's any error in the process, return default score
        return 0.9;
    }
}

// Optional: Helper function to analyze README content (if not already in utils)
async function analyzeReadmeContent(content: string): Promise<number> {
    const sections = [
        'installation',
        'getting started',
        'usage',
        'quickstart',
        'documentation',
        'api',
        'examples',
        'tutorial'
    ];
    
    const contentLower = content.toLowerCase();
    let score = 0;
    
    // Check for presence of key sections
    sections.forEach(section => {
        if (contentLower.includes(section)) {
            score += 0.125; // Distribute score across sections
        }
    });
    
    return Math.min(score, 1); // Cap score at 1
}
