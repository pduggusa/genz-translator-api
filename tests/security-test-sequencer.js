// Security-first test sequencer
// This ensures security tests run before other tests

const { DefaultSequencer } = require('@jest/test-sequencer');

class SecurityFirstSequencer extends DefaultSequencer {
  /**
   * Sort test paths to prioritize security tests
   * @param {Array} tests - Array of test objects
   * @returns {Array} - Sorted array with security tests first
   */
  sort(tests) {
    // Define test priorities (lower number = higher priority)
    const testPriorities = {
      security: 1,
      unit: 2,
      integration: 3,
      cannabis: 4,
      e2e: 5,
      other: 6
    };

    // Determine test type based on path
    const getTestType = (testPath) => {
      if (testPath.includes('security')) return 'security';
      if (testPath.includes('unit')) return 'unit';
      if (testPath.includes('integration')) return 'integration';
      if (testPath.includes('cannabis')) return 'cannabis';
      if (testPath.includes('e2e')) return 'e2e';
      return 'other';
    };

    // Sort tests by priority, then by path
    const sortedTests = tests.sort((testA, testB) => {
      const typeA = getTestType(testA.path);
      const typeB = getTestType(testB.path);

      const priorityA = testPriorities[typeA] || testPriorities.other;
      const priorityB = testPriorities[typeB] || testPriorities.other;

      // First sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Then sort by path (alphabetical)
      return testA.path.localeCompare(testB.path);
    });

    // Log test execution order in verbose mode
    if (process.env.VERBOSE_TESTS) {
      console.log('\n🧪 Test Execution Order:');
      sortedTests.forEach((test, index) => {
        const testType = getTestType(test.path);
        const fileName = test.path.split('/').pop();
        console.log(`  ${index + 1}. [${testType.toUpperCase()}] ${fileName}`);
      });
      console.log('');
    }

    return sortedTests;
  }
}

module.exports = SecurityFirstSequencer;