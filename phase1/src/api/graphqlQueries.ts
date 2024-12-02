/**
* graphqlQueries.ts
* GraphQL query to fetch repository data via GitHub's GraphQL API
*/
export const getRepoDataQuery = (owner: string, repo: string) => `
{
  repository(owner: "${owner}", name: "${repo}") {
    # Fetch open issues
    openIssues: issues(first: 100, states: [OPEN], orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      nodes {
        createdAt
        updatedAt
        closedAt
      }
    }

    # Fetch closed issues
    closedIssues: issues(first: 100, states: [CLOSED], orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      nodes {
        createdAt
        updatedAt
        closedAt
      }
    }

    # Fetch pull requests
    pullRequests(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      nodes {
        createdAt
        updatedAt
        closedAt
      }
    }
    
    # Check if repo is archived
    isArchived

    # Fetch readme with lowercase filename
    readmemd: object(expression: "HEAD:readme.md") {
      ... on Blob {
        text
      }
    }
    
    # Rest of readme variants with lowercase ...
    readmenoext: object(expression: "HEAD:readme") {
      ... on Blob {
        text
      }
    }
    
    readmetxt: object(expression: "HEAD:readme.txt") {
      ... on Blob {
        text
      }
    }
    
    readmerdoc: object(expression: "HEAD:readme.rdoc") { 
      ... on Blob {
        text
      }
    }

    readmehtml: object(expression: "HEAD:readme.html") {
      ... on Blob {
        text
      }
    }

    readmeadoc: object(expression: "HEAD:readme.adoc") {
      ... on Blob {
        text
      }
    }

    readmemarkdown: object(expression: "HEAD:readme.markdown") {
      ... on Blob {
        text
      }
    }

    readmeyaml: object(expression: "HEAD:readme.yaml") {
      ... on Blob {
        text
      }
    }

    readmerst: object(expression: "HEAD:readme.rst") {
      ... on Blob {
        text
      }
    }

    readmetextile: object(expression: "HEAD:readme.textile") {
      ... on Blob {
        text
      }
    }
    
    # Fetch readme with uppercase filename ...
    READMEMD: object(expression: "HEAD:README.md") {
      ... on Blob {
        text
      }
    }

    READMENOEXT: object(expression: "HEAD:README") {
      ... on Blob {
        text
      }
    }
    
    READMETXT: object(expression: "HEAD:README.txt") {
      ... on Blob {
        text
      }
    }

    READMERDOC: object(expression: "HEAD:README.rdoc") { 
      ... on Blob {
        text
      }
    }

    READMEHTML: object(expression: "HEAD:README.html") {
      ... on Blob {
        text
      }
    }

    READMEADOC: object(expression: "HEAD:README.adoc") {
      ... on Blob {
        text
      }
    }

    READMEMARKDOWN: object(expression: "HEAD:README.markdown") {
      ... on Blob {
        text
      }
    }

    READMEYAML: object(expression: "HEAD:README.yaml") {
      ... on Blob {
        text
      }
    }

    READMERST: object(expression: "HEAD:README.rst") {
      ... on Blob {
        text
      }
    }

    READMETEXTILE: object(expression: "HEAD:README.textile") {
      ... on Blob {
        text
      }
    }
    
    # Rest of readme variants with mixed case ...
    readMemd: object(expression: "HEAD:readMe.md") {
      ... on Blob {
        text
      }
    }

    readMenoext: object(expression: "HEAD:readMe") {
      ... on Blob {
        text
      }
    }
    
    readMetxt: object(expression: "HEAD:readMe.txt") {
      ... on Blob {
        text
      }
    }

    readMerdoc: object(expression: "HEAD:readMe.rdoc") { 
      ... on Blob {
        text
      }
    }

    readMehtml: object(expression: "HEAD:readMe.html") {
      ... on Blob {
        text
      }
    }

    readMeadoc: object(expression: "HEAD:readMe.adoc") {
      ... on Blob {
        text
      }
    }

    readMemarkdown: object(expression: "HEAD:readMe.markdown") {
      ... on Blob {
        text
      }
    }

    readMeyaml: object(expression: "HEAD:readMe.yaml") {
      ... on Blob {
        text
      }
    }

    readMerst: object(expression: "HEAD:readMe.rst") {
      ... on Blob {
        text
      }
    }

    readMetextile: object(expression: "HEAD:readMe.textile") {
      ... on Blob {
        text
      }
    }

    ReadMemd: object(expression: "HEAD:ReadMe.md") {
      ... on Blob {
        text
      }
    }

    ReadMenoext: object(expression: "HEAD:ReadMe") {
      ... on Blob {
        text
      }
    }
    
    ReadMetxt: object(expression: "HEAD:ReadMe.txt") {
      ... on Blob {
        text
      }
    }

    ReadMerdoc: object(expression: "HEAD:ReadMe.rdoc") { 
      ... on Blob {
        text
      }
    }

    ReadMehtml: object(expression: "HEAD:ReadMe.html") {
      ... on Blob {
        text
      }
    }

    ReadMeadoc: object(expression: "HEAD:ReadMe.adoc") {
      ... on Blob {
        text
      }
    }

    ReadMemarkdown: object(expression: "HEAD:ReadMe.markdown") {
      ... on Blob {
        text
      }
    }

    ReadMeyaml: object(expression: "HEAD:ReadMe.yaml") {
      ... on Blob {
        text
      }
    }

    ReadMerst: object(expression: "HEAD:ReadMe.rst") {
      ... on Blob {
        text
      }
    }

    ReadMetextile: object(expression: "HEAD:ReadMe.textile") {
      ... on Blob {
        text
      }
    }

    Readmemd: object(expression: "HEAD:Readme.md") {
      ... on Blob {
        text
      }
    }

    Readmenoext: object(expression: "HEAD:Readme") {
      ... on Blob {
        text
      }
    }
    
    Readmetxt: object(expression: "HEAD:Readme.txt") {
      ... on Blob {
        text
      }
    }

    Readmerdoc: object(expression: "HEAD:Readme.rdoc") { 
      ... on Blob {
        text
      }
    }

    Readmehtml: object(expression: "HEAD:Readme.html") {
      ... on Blob {
        text
      }
    }

    Readmeadoc: object(expression: "HEAD:Readme.adoc") {
      ... on Blob {
        text
      }
    }

    Readmemarkdown: object(expression: "HEAD:Readme.markdown") {
      ... on Blob {
        text
      }
    }

    Readmeyaml: object(expression: "HEAD:Readme.yaml") {
      ... on Blob {
        text
      }
    }

    Readmerst: object(expression: "HEAD:Readme.rst") {
      ... on Blob {
        text
      }
    }

    Readmetextile: object(expression: "HEAD:Readme.textile") {
      ... on Blob {
        text
      }
    }

    examplesFolder: object(expression: "HEAD:examples/") {
      ... on Tree {
        entries {
          name
          type
        }
      }
    }

    exampleFolder: object(expression: "HEAD:example/") {
      ... on Tree {
        entries {
          name
          type
        }
      }
    }

    ExampleFolder: object(expression: "HEAD:Example/") {
      ... on Tree {
        entries {
          name
          type
        }
      }
    }

    ExamplesFolder: object(expression: "HEAD:Examples/") {
      ... on Tree {
        entries {
          name
          type
        }
      }
    }
  }
}
`;
