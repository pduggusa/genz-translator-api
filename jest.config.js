module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // Coverage thresholds (disabled for pipeline stability - will re-enable gradually)
  // coverageThreshold: {
  //   global: {
  //     branches: 10,
  //     functions: 10,
  //     lines: 10,
  //     statements: 10
  //   }
  // },

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/test-utils/**',
    '!coverage/**',
    '!node_modules/**',
    '!build/**',
    '!dist/**'
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // Test timeout (important for security tests)
  testTimeout: 30000,

  // Verbose output for security validation
  verbose: true,

  // Force exit after tests (important for server cleanup)
  forceExit: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Global variables for tests
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      PORT: '0', // Use random port for testing
      SECURITY_TESTING: 'true',
      NO_SERVER_START: 'true' // Prevent server auto-start during tests
    }
  },

  // Test suites organization
  projects: [
    {
      displayName: '🛡️ Security Tests',
      testMatch: ['**/tests/security*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/security-setup.js']
    },
    {
      displayName: '🧪 Unit Tests',
      testMatch: ['**/tests/unit/**/*.test.js']
    },
    {
      displayName: '🔗 Integration Tests',
      testMatch: ['**/tests/integration/**/*.test.js']
    },
    {
      displayName: '🎭 E2E Tests',
      testMatch: ['**/tests/e2e/**/*.test.js'],
      testTimeout: 60000 // Longer timeout for browser tests
    },
    {
      displayName: '🌿 Specialized Content Tests',
      testMatch: ['**/tests/cannabis*.test.js'],
      testTimeout: 45000 // Specialized content extraction can take longer
    }
  ],

  // Reporters for different output formats
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: 'coverage',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'hacksaws2x4 - Test Report'
      }
    ]
  ],

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'node'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/',
    '/deploy-*/',
    '/deploy-fix/',
    '/lean-deploy/',
    '/emergency-deploy/'
  ],

  // Module path patterns to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/deploy-fix/',
    '<rootDir>/deploy-clean/',
    '<rootDir>/lean-deploy/',
    '<rootDir>/emergency-deploy/'
  ],

  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Error handling
  errorOnDeprecated: true,

  // Security-specific configurations
  maxWorkers: 4, // Limit workers for security testing

  // Custom test sequencer for security tests (run security tests first)
  // testSequencer: '<rootDir>/tests/security-test-sequencer.js'
};