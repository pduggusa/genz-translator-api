# 🌿 Cannabis Extractor API - Usage Examples

## 🚀 Production API Endpoints

### 🐳 **Primary Endpoint (Container Apps)**
```
https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/
```
- **Environment:** Azure Container Apps (Central US)
- **Security:** 5-stage validation pipeline
- **Features:** Auto-scaling, health monitoring, enhanced security
- **Performance:** Optimized with Firefox pre-loading

### 📱 **Legacy Endpoint (Web App)**
```
https://genz-translator-api.azurewebsites.net/
```
- **Environment:** Azure Web App (Canada Central)
- **Purpose:** Compatibility and fallback
- **Limitations:** Fixed resources, basic monitoring

---

## 📊 **API Endpoints**

### 🩺 **Health Check**
```bash
# Basic health check
curl "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/health"

# Response
{
  "status": "healthy",
  "timestamp": "2025-09-19T22:30:00.000Z",
  "environment": "production",
  "version": "3.1.0",
  "security": {
    "validated": true,
    "last_scan": "2025-09-19T20:00:00.000Z"
  },
  "container": {
    "replicas": 2,
    "memory_usage": "45%",
    "cpu_usage": "12%"
  }
}
```

### 📋 **Service Information**
```bash
# Get API information and capabilities
curl "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/"

# Response
{
  "service": "Cannabis Extractor API",
  "version": "3.1.0",
  "features": {
    "cannabis_detection": true,
    "browser_emulation": true,
    "rate_limiting": true,
    "security_validation": true
  },
  "endpoints": {
    "/health": "Health check and system status",
    "/extract": "Cannabis content extraction",
    "/": "Service information"
  },
  "security": {
    "pipeline_stages": 5,
    "scan_types": 7,
    "zero_tolerance": true
  }
}
```

---

## 🌿 **Cannabis Content Extraction**

### 🎯 **Cannabis Site Detection (Automatic Browser Emulation)**

#### **Leafly Extraction**
```bash
curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://leafly.com"
  }' | jq '.'

# Expected Response
{
  "success": true,
  "url": "https://leafly.com",
  "browserEmulation": true,
  "timestamp": "2025-09-19T22:30:00.000Z",
  "products": [
    {
      "name": "Blue Dream",
      "type": "Hybrid",
      "thc": "17-24%",
      "cbd": "0.1-0.2%",
      "effects": ["Relaxed", "Happy", "Euphoric"],
      "flavors": ["Berry", "Sweet", "Vanilla"]
    }
  ],
  "count": 1,
  "popupsHandled": 2,
  "extractionTime": 2847,
  "security": {
    "content_sanitized": true,
    "xss_filtered": true
  }
}
```

#### **Weedmaps Extraction**
```bash
curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://weedmaps.com/dispensaries/local-cannabis-shop"
  }' | jq '.'

# Expected Response
{
  "success": true,
  "url": "https://weedmaps.com/dispensaries/local-cannabis-shop",
  "browserEmulation": true,
  "timestamp": "2025-09-19T22:30:15.000Z",
  "dispensary": {
    "name": "Local Cannabis Shop",
    "location": "Denver, CO",
    "rating": 4.5,
    "hours": "9:00 AM - 10:00 PM",
    "products_available": 142
  },
  "products": [],
  "count": 0,
  "popupsHandled": 3,
  "extractionTime": 3251,
  "security": {
    "age_verification_handled": true,
    "location_verified": true
  }
}
```

### ⚡ **Regular Content Extraction (Fast HTTP Mode)**

#### **News Site Extraction**
```bash
curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://nypost.com/2025/09/19/business/cannabis-industry-growth/"
  }' | jq '.'

# Expected Response
{
  "success": true,
  "url": "https://nypost.com/2025/09/19/business/cannabis-industry-growth/",
  "browserEmulation": false,
  "timestamp": "2025-09-19T22:30:30.000Z",
  "content": {
    "title": "Cannabis Industry Shows Continued Growth in 2025",
    "author": "John Smith",
    "published": "2025-09-19T10:00:00.000Z",
    "excerpt": "The cannabis industry continues to expand...",
    "word_count": 1247
  },
  "extractionTime": 524,
  "security": {
    "content_sanitized": true,
    "malicious_scripts_removed": 0
  }
}
```

---

## 🛡️ **Security Features Testing**

### 🔒 **Security Headers Validation**
```bash
# Check security headers
curl -I "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/health"

# Expected Headers
HTTP/2 200
x-frame-options: DENY
x-content-type-options: nosniff
x-xss-protection: 0
strict-transport-security: max-age=31536000; includeSubDomains
content-security-policy: default-src 'self'
referrer-policy: strict-origin-when-cross-origin
```

### 🚦 **Rate Limiting Testing**
```bash
# Test rate limiting (expect 429 responses after limit)
for i in {1..20}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/health")
  echo "Request $i: HTTP $response"
  sleep 0.1
done

# Expected Output
Request 1: HTTP 200
Request 2: HTTP 200
...
Request 15: HTTP 200
Request 16: HTTP 429  # Rate limit exceeded
Request 17: HTTP 429
...
```

### 🛡️ **Input Validation Testing**
```bash
# Test malicious input handling
curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "<script>alert(\"xss\")</script>"
  }'

# Expected Response (400 Bad Request)
{
  "success": false,
  "error": "Invalid URL format: URL contains potentially malicious content",
  "timestamp": "2025-09-19T22:30:45.000Z",
  "security": {
    "threat_detected": "XSS_ATTEMPT",
    "action_taken": "REQUEST_BLOCKED"
  }
}
```

---

## 🧪 **Testing Scenarios**

### 🎯 **Cannabis Detection Intelligence**

#### **Positive Cannabis Detection**
```bash
# URLs that trigger browser emulation
CANNABIS_URLS=(
  "https://leafly.com"
  "https://weedmaps.com"
  "https://dispensary.example.com"
  "https://cannabis-store.com"
  "https://marijuana-news.com"
)

for url in "${CANNABIS_URLS[@]}"; do
  echo "Testing: $url"
  curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}" | jq '.browserEmulation'
done

# Expected: All should return true
```

#### **Negative Cannabis Detection**
```bash
# URLs that use fast HTTP extraction
REGULAR_URLS=(
  "https://bbc.com"
  "https://cnn.com"
  "https://github.com"
  "https://stackoverflow.com"
  "https://wikipedia.org"
)

for url in "${REGULAR_URLS[@]}"; do
  echo "Testing: $url"
  curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\"}" | jq '.browserEmulation'
done

# Expected: All should return false
```

### ⚡ **Performance Testing**

#### **Response Time Monitoring**
```bash
# Test response times across different endpoints
echo "Testing response times..."

# Health endpoint (should be <200ms)
time curl -s "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/health" > /dev/null

# Fast extraction (should be <1s)
time curl -s -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' > /dev/null

# Cannabis extraction (should be <3s)
time curl -s -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://leafly.com"}' > /dev/null
```

#### **Concurrent Request Testing**
```bash
# Test concurrent request handling
echo "Testing concurrent requests..."

# Launch 10 concurrent requests
for i in {1..10}; do
  (
    curl -s "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/health" \
      -w "Request $i: %{time_total}s\n"
  ) &
done

wait
echo "All concurrent requests completed"
```

---

## 🔧 **Development & Testing**

### 🧪 **Local Testing**
```bash
# Install dependencies and run security validation
npm install
npm run deploy:security-gate

# Start local server
npm start

# Test locally (replace localhost with your local port)
curl "http://localhost:3000/health"
curl -X POST "http://localhost:3000/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://leafly.com"}'
```

### 🐳 **Container Testing**
```bash
# Build and test container locally
docker build -f Dockerfile.containerapp -t cannabis-extractor:test .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=development \
  -e SECURITY_TESTING=true \
  cannabis-extractor:test

# Test container
curl "http://localhost:3000/health"
```

### 🛡️ **Security Testing**
```bash
# Run security test suite
npm run test:security

# Run comprehensive security validation
npm run security:audit
npm run test:security:checkov

# Generate security report
npm run security:report
```

---

## 📊 **Monitoring & Analytics**

### 📈 **Usage Analytics**
```bash
# Monitor API usage patterns
curl "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/health" | jq '.container'

# Expected Response
{
  "replicas": 2,
  "memory_usage": "45%",
  "cpu_usage": "12%",
  "requests_per_minute": 23,
  "cannabis_detection_rate": "15%"
}
```

### 🚨 **Error Handling Examples**
```bash
# Invalid URL format
curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-valid-url"}'

# Missing URL parameter
curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{}'

# Unsupported protocol
curl -X POST "https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "ftp://example.com"}'
```

---

## 🎯 **Best Practices**

### ✅ **Recommended Usage**
1. **Use Container Apps endpoint** for production applications
2. **Implement proper error handling** for 400/429/500 responses
3. **Respect rate limits** to avoid being throttled
4. **Cache results** when appropriate to reduce API calls
5. **Monitor response times** and adjust timeouts accordingly

### ⚠️ **Important Notes**
1. **Cannabis sites require browser emulation** - expect 2-3 second response times
2. **Rate limiting is enforced** - plan your request patterns accordingly
3. **Security validation is strict** - malformed requests are blocked
4. **HTTPS is required** - HTTP requests are automatically redirected
5. **Content is sanitized** - malicious scripts are automatically removed

---

**📅 Last Updated:** September 19, 2025
**🔗 Production API:** https://cannabis-extractor-app.orangesmoke-f5bb9d29.centralus.azurecontainerapps.io/
**📋 Release Notes:** [RELEASE-NOTES.md](../RELEASE-NOTES.md)