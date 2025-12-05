/**
 * Jest Configuration for JobAio Monorepo
 * Runs all *.test.js files across packages and apps
 */
export default {
  // Use Node.js test environment
  testEnvironment: "node",

  // Find all test files matching *.test.js in packages and apps
  testMatch: [
    "<rootDir>/packages/**/tests/**/*.test.js",
    "<rootDir>/apps/**/tests/**/*.test.js",
  ],

  // Ignore node_modules and build directories
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.next/"],

  // Global setup file (console suppression, env defaults, etc.)
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // File extensions to consider
  moduleFileExtensions: ["js", "mjs", "json"],

  // Verbose output for better debugging
  verbose: true,

  // Collect coverage from source files (optional, enable when needed)
  // collectCoverageFrom: [
  //   "packages/*/src/**/*.js",
  //   "apps/*/src/**/*.js",
  //   "!**/node_modules/**",
  // ],
};
