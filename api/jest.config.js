export default {
  testEnvironment: 'node',
  // Jest's default is 'commonjs', so we need to specify this for ESM support.
  // This allows Jest to understand `import` and `export` syntax in .js files.
  moduleFileExtensions: ['js', 'json', 'node'],
  transform: {}, // No babel transformation needed as we are using native ESM
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
};