const { parentPort } = require('worker_threads');
const { logToFile } = require('./log');
const { calcBusFactor, calcCorrectness, calcResponsiveness, calcLicense, calcRampUp } = require('../metricCalcs');


// Worker function that computes something
parentPort?.on('message', async (params) => {
    const begin = Date.now();

    // PARSE PARAMETERS
    const { owner, repo, token, repoURL, repoData, metric } = params;
    logToFile(`Worker: ${owner}, ${repo}, ${repoURL}, ${metric}`, 2);
    
    // COMPUTE SOMETHING
    let result;
    if (metric == "busFactor") {
        result = await calcBusFactor(owner, repo, token);
    } else if (metric == "correctness") {
        result = calcCorrectness(repoData);
    } else if (metric == "rampUp") {
        result = await calcRampUp(repoData);
    } else if (metric == "responsiveness") {
        result = calcResponsiveness(repoData);
    } else { // license
        result = await calcLicense(owner, repo, repoURL);
    }

    const end = Date.now();
    // RETURN SOMETHING
    parentPort?.postMessage({
        score: result,
        latency: (end - begin) / 1000 // in seconds
    });
});