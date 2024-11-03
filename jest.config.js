module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // setupFilesAfterEnv: ['/home/shay/a/gscheng/ece461/ECE461/prototype_testing/jest.setup.ts'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        'src/index.js',
        'src/types.js',
        // 'src/metricCalcs.js', // dont think we use this file anymore
        'src/api/apiUtils.js',
        'src/api/githubApi.js',
        'src/api/graphqlQueries.js',
        'src/api/npmApi.js',
        //
        'src/metrics/busFactor.js',
        'src/metrics/codeReview.js',
        'src/metrics/correctness.js',
        'src/metrics/dependencyPinning.js',
        'src/metrics/license.js',
        'src/metrics/metric.js',
        'src/metrics/netScore.js',
        'src/metrics/rampUp.js',
        'src/metrics/responsiveMaintainer.js',
        //
        'src/utils/log.js',
        'src/utils/urlHandler.js',
        'src/utils/utils.js',
        'src/worker.js'
      ],
    collectCoverage: true, // Enable coverage collection
    coverageDirectory: 'coverage', // Output directory for coverage reports
    coverageReporters: ['text'], // Specify the format of the coverage report
  };