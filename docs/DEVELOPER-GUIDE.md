# 🛠️ Developer Guide - Cannabis Extractor API

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js** >= 18.0.0 (20.x recommended for production)
- **NPM** >= 8.0.0
- **Docker** (for container development)
- **Azure CLI** (for deployment)
- **Git** with SSH keys configured

### 🔄 Quick Setup
```bash
# Clone the repository
git clone https://github.com/pduggusa/genz-translator-api.git
cd genz-translator-api

# Install dependencies with security validation
npm install

# Run initial security check
npm run deploy:security-gate

# Start development server
npm run dev
```

---

## 🛡️ Security-First Development

### 🚨 **Security Validation Pipeline**

#### **Pre-commit Validation**
```bash
# Run complete security validation before committing
npm run deploy:security-gate

# Individual security checks
npm run security:audit          # NPM dependency audit
npm run test:security:checkov   # Secret detection
npm run test:security          # Security test suite
npm run lint:security          # Security-focused linting
```

#### **Security Test Categories**
```bash
# Run specific security test types
npm run test:security           # All security tests
npm run test:unit              # Core functionality tests
npm run test:integration       # API endpoint tests
npm run test:cannabis          # Cannabis-specific tests
npm run test:e2e               # Browser automation tests
```

### 🔍 **Security Tools Integration**

#### **Secrets Detection**
- **TruffleHog** - Git history scanning
- **Checkov** - Static analysis for secrets
- **Custom patterns** - API keys, tokens, credentials

```bash
# Manual secret detection
checkov --framework secrets --directory . --output cli
```

#### **SAST (Static Application Security Testing)**
- **Semgrep** - Multi-language static analysis
- **ESLint Security** - JavaScript security rules
- **NodeJSScan** - Node.js specific vulnerabilities

```bash
# Manual SAST scanning
semgrep --config=auto --config=security-audit .
npm run lint:security
```

#### **Dependency Security**
- **NPM Audit** - Known vulnerability detection
- **Snyk** - Advanced vulnerability scanning
- **Retire.js** - JavaScript library vulnerabilities

```bash
# Manual dependency scanning
npm audit --audit-level moderate
npx retire --js --outputformat json
```

---

## 🧪 Testing Framework

### 📊 **Test Structure**
```
tests/
├── security.test.js           # Security validation tests
├── unit/                      # Unit tests
│   └── extraction.test.js
├── integration/               # API integration tests
│   └── api.test.js
├── e2e/                       # End-to-end tests
│   └── browser.test.js
├── cannabis-extraction.test.js # Cannabis-specific tests
├── setup.js                   # Global test setup
├── security-setup.js          # Security test utilities
└── security-test-sequencer.js # Custom test ordering
```

### 🎯 **Test Execution Order**
1. **Security Tests** (Priority 1) - Must pass first
2. **Unit Tests** (Priority 2) - Core functionality
3. **Integration Tests** (Priority 3) - API endpoints
4. **Cannabis Tests** (Priority 4) - Cannabis functionality
5. **E2E Tests** (Priority 5) - Full browser automation

### 🔧 **Jest Configuration**
```javascript
// jest.config.js highlights
{
  // Security-first test sequencer
  testSequencer: '<rootDir>/tests/security-test-sequencer.js',

  // Coverage thresholds
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70 },
    './src/extractors/': { branches: 80, functions: 80 },
    './src/middleware/': { branches: 90, functions: 90 }
  },

  // Multiple test environments
  projects: [
    { displayName: '🛡️ Security Tests' },
    { displayName: '🧪 Unit Tests' },
    { displayName: '🔗 Integration Tests' },
    { displayName: '🎭 E2E Tests' },
    { displayName: '🌿 Cannabis Tests' }
  ]
}
```

### 🛡️ **Security Test Examples**

#### **Input Validation Testing**
```javascript
describe('🚫 Input Validation & Sanitization', () => {
  test('should reject malicious payloads', async () => {
    const maliciousPayloads = [
      'javascript:alert(1)',
      '<script>alert("xss")</script>',
      '../../etc/passwd'
    ];

    for (const payload of maliciousPayloads) {
      const response = await request(server)
        .post('/extract')
        .send({ url: payload })
        .expect(400);

      expect(response.body.error).toMatch(/invalid|malformed|unsafe/i);
    }
  });
});
```

#### **Rate Limiting Testing**
```javascript
describe('🚦 Rate Limiting', () => {
  test('should enforce rate limits', async () => {
    const requests = Array(20).fill().map(() =>
      request(server).post('/extract').send({ url: 'https://example.com' })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(res => res.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

## 🐳 Container Development

### 🔨 **Docker Configuration**

#### **Dockerfile.containerapp**
```dockerfile
FROM node:20-slim

# Install Firefox and security tools
RUN apt-get update && apt-get install -y \
    firefox-esr \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Application setup
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/

# Security configuration
USER appuser
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
```

#### **Local Container Development**
```bash
# Build container
docker build -f Dockerfile.containerapp -t cannabis-extractor:dev .

# Run with development settings
docker run -p 3000:3000 \
  -e NODE_ENV=development \
  -e SECURITY_TESTING=true \
  -v $(pwd)/src:/app/src \
  cannabis-extractor:dev

# Security scan container
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image cannabis-extractor:dev
```

### 🛡️ **Container Security**

#### **Security Hardening**
- **Non-root execution** - All processes run as `appuser`
- **Minimal base image** - Node.js slim for reduced attack surface
- **Health checks** - Built-in monitoring and restart capability
- **Security labels** - Comprehensive metadata for tracking
- **Resource limits** - CPU and memory constraints

#### **Security Scanning**
```bash
# Trivy vulnerability scanning
trivy image --format json cannabis-extractor:dev

# Docker bench security
docker run --rm --net host --pid host --userns host --cap-add audit_control \
  -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
  -v /var/lib:/var/lib:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --label docker_bench_security \
  docker/docker-bench-security
```

---

## 🔄 CI/CD Pipeline

### 🛡️ **5-Stage Security Pipeline**

#### **Stage 1: Security Gate**
```yaml
# .github/workflows/container-apps-security-pipeline.yml
security-gate:
  name: 🚨 Security Gate - DEPLOYMENT BLOCKER
  steps:
    - name: Secrets Detection
    - name: SAST Analysis
    - name: Dependency Security
    - name: License Compliance
    - name: Supply Chain Security
```

#### **Stage 2: Comprehensive Testing**
```yaml
comprehensive-testing:
  needs: security-gate
  strategy:
    matrix:
      node-version: [18.x, 20.x]
      test-type: [unit, integration]
```

#### **Stage 3: Secure Container Build**
```yaml
secure-container-build:
  needs: [security-gate, comprehensive-testing]
  steps:
    - name: Container Vulnerability Scanning
    - name: Security Metadata Labeling
    - name: Registry Push with Validation
```

#### **Stage 4: Secure Deployment**
```yaml
secure-deployment:
  needs: secure-container-build
  environment: production
  steps:
    - name: Pre-deployment Security Check
    - name: Container Apps Deployment
    - name: Post-deployment Validation
```

#### **Stage 5: Failure Handling**
```yaml
failure-handling:
  if: failure()
  steps:
    - name: Automatic Rollback
    - name: Incident Response
    - name: Failure Analysis
```

### 🚀 **Deployment Environments**

#### **Development**
- **Branch:** `develop`
- **Environment:** Local/Dev Container Apps
- **Security:** Basic validation
- **Testing:** All test suites

#### **Staging**
- **Branch:** `main` (PR)
- **Environment:** Staging Container Apps
- **Security:** Full 5-stage pipeline
- **Testing:** Complete validation

#### **Production**
- **Branch:** `main` (merged)
- **Environment:** Production Container Apps
- **Security:** Zero-tolerance validation
- **Testing:** Comprehensive + security

---

## 🌿 Cannabis Functionality

### 🎯 **Cannabis Detection Logic**

#### **Detection Patterns**
```javascript
// src/extractors/cannabis-extractor.js
const cannabisKeywords = [
  'marijuana', 'cannabis', 'weed', 'hemp', 'thc', 'cbd',
  'dispensary', 'strain', 'indica', 'sativa', 'edibles',
  'gummies', 'vape', 'cartridge', 'flower', 'bud'
];

const cannabisDomains = [
  'leafly.com', 'weedmaps.com', 'dispensary',
  'cannabis', 'marijuana', 'hemp'
];
```

#### **Browser Emulation Trigger**
```javascript
function isCannabisContent(url, content = '') {
  const urlLower = url.toLowerCase();
  const contentLower = content.toLowerCase();

  // Domain-based detection
  const hasCannabisyDomain = cannabisDomains.some(domain =>
    urlLower.includes(domain)
  );

  // Content-based detection
  const hasCannabisKeywords = cannabisKeywords.some(keyword =>
    contentLower.includes(keyword)
  );

  return hasCannabisyDomain || hasCannabisKeywords;
}
```

### 🎭 **Browser Automation**

#### **Playwright Configuration**
```javascript
// src/azure-config.js
const browserConfig = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--memory-pressure-off'
  ],
  timeout: 30000,
  maxConcurrent: 2
};
```

#### **Popup Handling**
```javascript
// Age verification, cookie consent, GDPR
async function handlePopups(page) {
  const popupSelectors = [
    'button[aria-label*="18"]',
    'button[aria-label*="21"]',
    'button:has-text("I am 21")',
    'button:has-text("Accept")',
    'button:has-text("Continue")'
  ];

  for (const selector of popupSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
    } catch (e) {
      // Continue if popup not found
    }
  }
}
```

### 🔒 **Security Considerations**

#### **Content Sanitization**
```javascript
function sanitizeContent(content) {
  // Remove potentially dangerous content
  const sanitized = content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/eval\s*\(/gi, '');

  return sanitized;
}
```

#### **URL Validation**
```javascript
function validateUrl(url) {
  try {
    const parsed = new URL(url);

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP/HTTPS protocols allowed');
    }

    // Block localhost/internal IPs
    if (parsed.hostname === 'localhost' ||
        parsed.hostname.startsWith('127.') ||
        parsed.hostname.startsWith('192.168.')) {
      throw new Error('Internal URLs not allowed');
    }

    return true;
  } catch (error) {
    return false;
  }
}
```

---

## 📊 Performance Optimization

### ⚡ **Response Time Targets**
- **Health endpoint:** <200ms
- **Fast HTTP extraction:** <1s
- **Cannabis browser extraction:** <3s
- **Complex cannabis sites:** <5s

### 🔧 **Optimization Techniques**

#### **Caching Strategy**
```javascript
// Response caching for frequently accessed content
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

#### **Resource Limits**
```javascript
// Azure Container Apps resource configuration
const resourceConfig = {
  cpu: '1.0',
  memory: '2Gi',
  minReplicas: 1,
  maxReplicas: 3,
  scaleRules: [
    {
      name: 'http-scaling',
      http: {
        metadata: { concurrentRequests: '10' }
      }
    }
  ]
};
```

### 📈 **Monitoring & Metrics**

#### **Application Insights**
```javascript
// Performance monitoring
const startTime = Date.now();
const result = await extractContent(url);
const duration = Date.now() - startTime;

// Log performance metrics
console.log(`Extraction completed: ${url} in ${duration}ms`);
```

#### **Health Monitoring**
```javascript
// Health check with detailed metrics
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  };

  res.json(health);
});
```

---

## 🛠️ Development Tools

### 🔧 **Recommended VS Code Extensions**
- **ESLint** - Code quality and security
- **Jest** - Test runner integration
- **Docker** - Container development
- **Thunder Client** - API testing
- **GitLens** - Git integration

### 📝 **Code Standards**

#### **ESLint Configuration**
```javascript
// .eslintrc.security.js
module.exports = {
  extends: ['standard', 'plugin:security/recommended'],
  plugins: ['security'],
  rules: {
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-eval-with-expression': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error'
  }
};
```

#### **Git Hooks**
```bash
# Pre-commit hook (.git/hooks/pre-commit)
#!/bin/sh
npm run lint:security
npm run test:security
npm run security:audit
```

### 🧪 **Testing Best Practices**

#### **Test Structure**
```javascript
describe('🌿 Cannabis Detection', () => {
  beforeEach(() => {
    // Setup test environment
  });

  test('should detect cannabis domains', () => {
    // Arrange
    const cannabisUrl = 'https://leafly.com';

    // Act
    const result = detectCannabisContent(cannabisUrl);

    // Assert
    expect(result.isCannabis).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

#### **Security Test Patterns**
```javascript
// Security test utilities
const securityTestUtils = {
  maliciousPayloads: [
    'javascript:alert(1)',
    '<script>alert("xss")</script>',
    '../../etc/passwd'
  ],

  testMaliciousInput: async (endpoint, payloads) => {
    for (const payload of payloads) {
      const response = await request(app)
        .post(endpoint)
        .send({ url: payload })
        .expect(400);

      expect(response.body.error).toMatch(/invalid|malicious/i);
    }
  }
};
```

---

## 📚 Documentation

### 📋 **Required Documentation**
- **README.md** - Project overview and setup
- **RELEASE-NOTES.md** - Version history and changes
- **API-EXAMPLES.md** - Usage examples and testing
- **DEVELOPER-GUIDE.md** - This comprehensive guide
- **SECURITY-TESTING-IMPLEMENTATION.md** - Security details

### 🔄 **Documentation Updates**
```bash
# Update documentation after changes
npm run docs:generate  # Auto-generate API docs
npm run docs:security  # Update security documentation
npm run docs:examples  # Refresh usage examples
```

---

## 🚨 Troubleshooting

### 🔧 **Common Issues**

#### **Security Validation Failures**
```bash
# Debug security validation
npm run security:validate -- --verbose
npm run test:security -- --verbose

# Check specific security scan results
checkov --framework secrets --directory . --output cli
semgrep --config=auto .
```

#### **Container Build Issues**
```bash
# Debug container build
docker build -f Dockerfile.containerapp -t debug . --no-cache
docker run -it debug /bin/bash

# Check container security
trivy image debug
```

#### **Test Failures**
```bash
# Debug specific test categories
npm run test:security -- --verbose
npm run test:cannabis -- --detectOpenHandles

# Generate detailed coverage report
npm run test:coverage -- --verbose
```

### 🆘 **Getting Help**
- **Security Issues** - Create issue with `security` label
- **Cannabis Functionality** - Create issue with `cannabis` label
- **Performance Issues** - Create issue with `performance` label
- **Documentation** - Create issue with `documentation` label

---

**📅 Last Updated:** September 19, 2025
**🔗 Repository:** https://github.com/pduggusa/genz-translator-api
**📊 Security Documentation:** [SECURITY-TESTING-IMPLEMENTATION.md](../SECURITY-TESTING-IMPLEMENTATION.md)