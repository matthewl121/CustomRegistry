// module.exports = {
//     preset: 'ts-jest',
//     testEnvironment: 'node',
//     // setupFilesAfterEnv: ['/home/shay/a/gscheng/ece461/ECE461/prototype_testing/jest.setup.ts'],
//     testMatch: ['**/*.test.ts'],
//     collectCoverageFrom: [
//         // 'src/index.js',
//         // 'src/metricCalcs.js',
//         // 'src/api/apiUtils.js',
//         // 'src/api/githubApi.js',
//         'src/api/graphqlQueries.js',
//         // 'src/api/npmApi.js',
//         'src/utils/log.js',
//         'src/utils/urlHandler/js',
//         'src/utils/utils.js',
//         'src/worker.js'
//       ],
//     collectCoverage: true, // Enable coverage collection
//     coverageDirectory: 'coverage', // Output directory for coverage reports
//     coverageReporters: ['text'], // Specify the format of the coverage report
//   };

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.mjs'],
  collectCoverageFrom: [
      'src/api/graphqlQueries.js',
      'src/utils/log.js',
      'src/utils/urlHandler/js',
      'src/utils/utils.js',
      'src/worker.js'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text'],
  // Add these specific patterns
  watchPathIgnorePatterns: ['**/cloudinary-*'],
  modulePathIgnorePatterns: ['**/cloudinary-*'],
  testPathIgnorePatterns: ['**/cloudinary-*'],
  // Add this to handle temporary directories
  haste: {
      forceNodeFilesystemAPI: true,
      throwOnModuleCollision: false,
      ignoredFiles: ['**/cloudinary-*/**']
  },
  transform: {},
  extensionsToTreatAsEsm: ['.mjs']
};