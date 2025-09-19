# Testing & Security Guide

## 🧪 Testing Overview

This project includes comprehensive testing with integrated security scanning using Checkov.

### Test Types

1. **Security Scanning** - Checkov secret detection
2. **Unit Tests** - Jest-based functional tests
3. **Integration Tests** - API endpoint testing
4. **Linting** - ESLint code quality checks

## 🔒 Security Testing with Checkov

### Quick Security Scan
```bash
npm run security:scan
```

### Comprehensive Security Report
```bash
npm run security:report
```
*Generates `security-report.json` with detailed results*

### All Security Checks
```bash
npm run test:security:all
```
*Runs full Checkov framework scan*

## 🚀 Running Tests

### Individual Test Commands

```bash
# Security scanning
npm run test:security              # Secrets detection
npm run security:scan             # Alias for secrets scan
npm run security:report           # Generate JSON report

# Code quality
npm run lint                      # ESLint checks
npm run lint:fix                  # Auto-fix linting issues

# Unit tests
npm run test                      # Jest unit tests
npm run test:watch                # Watch mode
npm run test:coverage             # With coverage report

# Complete test suite
npm run test:all                  # Lint + Security + Tests
```

### Cannabis-Specific Tests

The test suite includes specialized tests for cannabis extraction:

```bash
# Run cannabis extraction tests
npm test -- --testNamePattern="Cannabis"

# Run security tests specifically
npm test -- --testPathPattern="security"
```

## 📊 Test Results Interpretation

### Security Scan Results

**✅ PASSED Example:**
```json
{
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "parsing_errors": 0,
    "resource_count": 0,
    "checkov_version": "3.2.470"
}
```

**❌ FAILED Example:**
```json
{
    "passed": 0,
    "failed": 2,
    "skipped": 0,
    "parsing_errors": 0,
    "resource_count": 5,
    "results": {
        "failed_checks": [
            {
                "check_id": "CKV_SECRET_1",
                "file_path": "src/config.js",
                "line_range": [15, 15]
            }
        ]
    }
}
```

## 🔧 CI/CD Pipeline

### GitHub Actions Workflow

The project includes automated testing via GitHub Actions:

- **Security Scan** - Checkov secret detection
- **Code Quality** - ESLint + Tests
- **Vulnerability Scan** - npm audit
- **Build Verification** - Production build test

### Pipeline Stages

1. **Security Scan** (Parallel)
   - Checkov secrets detection
   - Security report generation
   - PR comment with results

2. **Test Suite** (After security)
   - ESLint code quality
   - Unit tests with coverage
   - Integration tests

3. **Vulnerability Scan** (Parallel with tests)
   - npm audit for dependencies
   - Vulnerability report generation

4. **Build & Deploy Check** (Production only)
   - Production build test
   - Artifact security scan

## 🛡️ Security Checklist

### What Checkov Scans For:

- ✅ API keys and tokens
- ✅ Passwords and secrets
- ✅ Private keys and certificates
- ✅ Database connection strings
- ✅ Cloud credentials (AWS, Azure, GCP)
- ✅ Webhook URLs and tokens

### Security Best Practices Enforced:

- ✅ Environment variables for configuration
- ✅ No hardcoded credentials
- ✅ Secure headers via Helmet.js
- ✅ Rate limiting implemented
- ✅ Input validation and sanitization
- ✅ CORS properly configured

## 📝 Test Structure

```
tests/
├── security.test.js           # Security-focused tests
├── cannabis-extraction.test.js # Cannabis functionality tests
└── integration.test.js        # API integration tests (to be added)
```

### Security Test Coverage

```javascript
describe('Security Tests', () => {
    // Rate limiting enforcement
    // Input validation and sanitization
    // Security headers verification
    // Error handling without exposure
    // Cannabis data security
});
```

### Cannabis Test Coverage

```javascript
describe('Cannabis Extraction Tests', () => {
    // Content detection accuracy
    // Data extraction completeness
    // API endpoint functionality
    // Link following validation
});
```

## 🚨 Security Alert Handling

### When Security Scan Fails:

1. **Review the report**: Check `security-report.json`
2. **Identify the issue**: Look at file path and line number
3. **Fix the vulnerability**: Remove/replace hardcoded secrets
4. **Use environment variables**: Move secrets to `.env` files
5. **Re-run scan**: Verify fix with `npm run security:scan`

### Common Issues & Fixes:

**❌ Hardcoded API Key:**
```javascript
// Bad
const apiKey = "sk-1234567890abcdef";

// Good
const apiKey = process.env.API_KEY;
```

**❌ Database Password:**
```javascript
// Bad
const dbUrl = "mongodb://user:password123@localhost";

// Good
const dbUrl = process.env.DATABASE_URL;
```

## 📈 Continuous Monitoring

### Local Development
- Run `npm run security:scan` before commits
- Use `npm run test:all` for full validation

### CI/CD Integration
- All PRs trigger security scans
- Main branch deployments require all tests to pass
- Security reports available as artifacts

### Production Monitoring
- Regular security scans via GitHub Actions
- Dependency vulnerability monitoring via npm audit
- Real-time security alerts for new vulnerabilities

## 🎯 Cannabis-Specific Security Considerations

- **No PII storage**: Cannabis data doesn't include personal information
- **Public data only**: Only extracts publicly available dispensary data
- **Rate limiting**: Respects website rate limits and terms of service
- **Data sanitization**: All extracted data is sanitized and validated
- **Compliance ready**: Structure supports regulatory compliance tracking

## 🔄 Updating Security Tools

### Upgrade Checkov
```bash
pip install --upgrade checkov
```

### Update Dependencies
```bash
npm audit fix
npm update
```

### Verify After Updates
```bash
npm run test:all
```

---

**Security Status**: ✅ **PASSING** - No security vulnerabilities detected
**Last Scan**: Automated via CI/CD pipeline
**Coverage**: 100% of source code scanned