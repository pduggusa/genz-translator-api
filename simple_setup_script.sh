#!/bin/bash

# Gen Z Translator API - Quick Setup Script
echo "🚀 Setting up Gen Z Translator API project..."

# Change these variables to your info
YOUR_USERNAME="pduggusa"  
YOUR_EMAIL="patrick@dugganusa.com"   


# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p .github/workflows .github/ISSUE_TEMPLATE
mkdir -p docs src/extractors src/middleware src/utils
mkdir -p public/assets/css public/assets/js
mkdir -p tests/unit tests/integration tests/e2e
mkdir -p docker scripts nginx logs

# Create Node.js version file
echo "18.17.0" > .nvmrc

echo "📝 Creating configuration files..."

# Create package.json
cat > package.json << EOF
{
  "name": "genz-translator-api",
  "version": "3.0.0",
  "description": "Advanced content extraction API with browser emulation and popup handling",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --passWithNoTests",
    "azure:start": "node src/server.js"
  },
  "author": "$YOUR_USERNAME <$YOUR_EMAIL>",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "puppeteer": "^21.5.2",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "puppeteer-extra-plugin-adblocker": "^2.13.6",
    "@mozilla/readability": "^0.4.4",
    "jsdom": "^23.0.1",
    "cheerio": "^1.0.0-rc.12",
    "turndown": "^7.1.2",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
EOF

# Create .gitignore
cat > .gitignore << EOF
node_modules/
npm-debug.log*
.env
.env.local
coverage/
logs/
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
downloads/
EOF

# Create .env.example
cat > .env.example << EOF
PORT=3000
NODE_ENV=development
BROWSER_TIMEOUT=30000
MAX_CONCURRENT_BROWSERS=3
RATE_LIMIT_MAX_REQUESTS=100
AZURE_RATE_LIMIT=50
LOG_LEVEL=info
EOF

# Create basic README.md
cat > README.md << EOF
# 🚀 Gen Z Translator API

Advanced content extraction API with browser emulation, popup handling, and structured data output.

## Features

- 🤖 Full browser emulation with Puppeteer
- 🚫 Comprehensive popup handling (age verification, cookies, newsletters)
- 🏪 E-commerce product extraction with pricing data
- 📊 Structured JSON output for price tracking
- 🔗 Deep link following with intelligent prioritization

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
\`\`\`

## API Endpoints

- \`GET/POST /api/fetch-url\` - Universal content extraction
- \`GET /api/product\` - Specialized product extraction  
- \`POST /api/track-products\` - Batch product tracking
- \`GET /health\` - Health check

## Deployment

Optimized for Azure App Service with resource management and automatic popup handling.

## License

MIT License
EOF

# Create web.config for Azure
cat > web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="src/server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="src/server.js"/>
        </rule>
      </rules>
    </rewrite>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
  <appSettings>
    <add key="NODE_ENV" value="production" />
    <add key="WEBSITE_NODE_DEFAULT_VERSION" value="18.17.0" />
  </appSettings>
</configuration>
EOF

# Create basic frontend
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gen Z Translator API</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        .api-form { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        input[type="url"] { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007cba; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #005a87; }
        .results { background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .loading { color: #666; font-style: italic; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .feature-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007cba; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Gen Z Translator API</h1>
        <p>Advanced content extraction with browser emulation, popup handling, and structured data output for price tracking and competitive intelligence.</p>
        
        <div class="feature-list">
            <div class="feature-card">
                <h3>🤖 Browser Emulation</h3>
                <p>Full Chromium automation with popup handling for age verification, cookie consent, and newsletter dismissal.</p>
            </div>
            <div class="feature-card">
                <h3>🏪 E-commerce Ready</h3>
                <p>Extract product data with pricing, availability, variants, and reviews for price tracking applications.</p>
            </div>
            <div class="feature-card">
                <h3>📊 Structured Output</h3>
                <p>Clean JSON with semantic content tagging, perfect for automation and data analysis.</p>
            </div>
            <div class="feature-card">
                <h3>🔗 Smart Deep Linking</h3>
                <p>Intelligent link following with e-commerce prioritization for comprehensive data collection.</p>
            </div>
        </div>

        <div class="api-form">
            <h3>🧪 Test Content Extraction</h3>
            <input type="url" id="urlInput" placeholder="https://amazon.com/dp/PRODUCT_ID" value="https://example.com">
            <br>
            <label><input type="checkbox" id="browserMode" checked> 🤖 Use Browser Emulation (handles popups)</label>
            <br>
            <label><input type="checkbox" id="followLinks"> 🔗 Follow Links (one level deep)</label>
            <br><br>
            <button onclick="extractContent()">🚀 Extract Content</button>
        </div>
        
        <div id="results" class="results" style="display: none;"></div>
        
        <h3>📖 API Documentation</h3>
        <ul>
            <li><a href="/api">📋 API Overview</a> - Service information and capabilities</li>
            <li><a href="/api/examples">🎯 Usage Examples</a> - Real-world implementation examples</li>
            <li><a href="/api/stats">📊 Statistics</a> - Usage metrics and performance data</li>
            <li><a href="/health">💊 Health Check</a> - System status and diagnostics</li>
        </ul>

        <h3>🔧 API Endpoints</h3>
        <ul>
            <li><code>GET/POST /api/fetch-url</code> - Universal content extraction</li>
            <li><code>GET /api/product</code> - Specialized product page extraction</li>
            <li><code>POST /api/track-products</code> - Batch product monitoring</li>
            <li><code>GET /api/stats</code> - Usage statistics and metrics</li>
            <li><code>GET /health</code> - Health check and system status</li>
        </ul>
    </div>

    <script>
        async function extractContent() {
            const url = document.getElementById('urlInput').value;
            const browser = document.getElementById('browserMode').checked;
            const followLinks = document.getElementById('followLinks').checked;
            const results = document.getElementById('results');
            
            if (!url) {
                alert('Please enter a URL');
                return;
            }
            
            results.style.display = 'block';
            results.innerHTML = '<div class="loading">🔄 Extracting content... This may take a few seconds.</div>';
            
            try {
                const response = await fetch('/api/fetch-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        url, 
                        browser, 
                        followLinks,
                        structured: true 
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    results.innerHTML = `
                        <h3 class="success">✅ Extraction Successful</h3>
                        <p><strong>🏷️ Content Type:</strong> ${data.contentType || 'generic'}</p>
                        <p><strong>📝 Title:</strong> ${data.data?.title || 'No title'}</p>
                        <p><strong>⚙️ Method:</strong> ${data.extractionMethod || 'unknown'}</p>
                        <p><strong>⏱️ Processing Time:</strong> ${data.processingTime || 0}ms</p>
                        ${data.browserMetrics ? `<p><strong>🚫 Popups Handled:</strong> ${data.browserMetrics.popupsHandled}</p>` : ''}
                        ${data.data?.pricing ? `
                            <div style="background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 10px 0;">
                                <h4>💰 Product Pricing</h4>
                                <p><strong>Price:</strong> ${data.data.pricing.currency}${data.data.pricing.currentPrice}</p>
                                <p><strong>Availability:</strong> ${data.data.pricing.availability}</p>
                                ${data.data.pricing.discount ? `<p><strong>Discount:</strong> ${data.data.pricing.discount.percentage}% OFF</p>` : ''}
                            </div>
                        ` : ''}
                        ${data.linkedPages ? `<p><strong>🔗 Linked Pages:</strong> ${data.linkedPages.length} pages found</p>` : ''}
                        <details>
                            <summary>🔍 View Raw JSON Data</summary>
                            <pre>${JSON.stringify(data, null, 2)}</pre>
                        </details>
                    `;
                } else {
                    results.innerHTML = `
                        <h3 class="error">❌ Extraction Failed</h3>
                        <p><strong>Error:</strong> ${data.error}</p>
                        ${data.suggestion ? `<p><strong>💡 Suggestion:</strong> ${data.suggestion}</p>` : ''}
                        <details>
                            <summary>🔍 View Error Details</summary>
                            <pre>${JSON.stringify(data, null, 2)}</pre>
                        </details>
                    `;
                }
            } catch (error) {
                results.innerHTML = `
                    <h3 class="error">❌ Request Failed</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>💡 Suggestion:</strong> Make sure the server is running and try again.</p>
                `;
            }
        }
        
        // Auto-focus on URL input
        document.getElementById('urlInput').focus();
    </script>
</body>
</html>
EOF

# Create basic server.js starter
cat > src/server.js << 'EOF'
// Basic server setup - TODO: Replace with full Azure-optimized version
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        environment: process.env.NODE_ENV || 'development',
        message: 'Basic setup - Add full implementation'
    });
});

app.get('/api', (req, res) => {
    res.json({
        service: 'Gen Z Translator API',
        version: '3.0.0',
        status: 'Basic setup - Ready for full implementation',
        features: [
            'Browser emulation with Puppeteer (pending)',
            'Popup handling (pending)', 
            'E-commerce extraction (pending)',
            'Price tracking output (pending)'
        ],
        endpoints: {
            'GET /health': 'Health check',
            'GET /api': 'API information',
            'POST /api/fetch-url': 'Content extraction (pending implementation)'
        },
        nextSteps: [
            'Add full Azure-optimized server code',
            'Add browser emulation modules',
            'Add structured extraction logic',
            'Test with real websites'
        ]
    });
});

app.get('/api/examples', (req, res) => {
    res.json({
        service: 'Gen Z Translator API - Examples',
        message: 'Full examples pending - add complete implementation',
        basicUsage: {
            description: 'Once implemented, extract content like this:',
            curl: `curl -X POST "${req.protocol}://${req.get('host')}/api/fetch-url" -H "Content-Type: application/json" -d '{"url": "https://example.com", "browser": true}'`
        }
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        service: 'Statistics',
        message: 'Stats tracking pending - add full implementation',
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    });
});

// TODO: Implement full extraction logic
app.post('/api/fetch-url', (req, res) => {
    const { url, browser, followLinks } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL parameter is required',
            usage: '{"url": "https://example.com", "browser": true}'
        });
    }
    
    res.json({
        success: false,
        error: 'Full implementation pending',
        message: 'Replace this basic server with the complete Azure-optimized version',
        received: { url, browser, followLinks },
        todo: [
            'Add browser emulation with Puppeteer',
            'Add popup handling logic',
            'Add structured content extraction',
            'Add e-commerce product detection'
        ]
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        available: ['/', '/health', '/api', '/api/examples', '/api/stats']
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Gen Z Translator API running on port ${PORT}`);
    console.log(`📝 Basic setup complete - Ready for full implementation`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`💊 Health: http://localhost:${PORT}/health`);
    console.log(`📖 API: http://localhost:${PORT}/api`);
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Replace src/server.js with full Azure-optimized version');
    console.log('2. Add extraction modules to src/extractors/');
    console.log('3. Test with: npm run dev');
});

module.exports = app;
EOF

# Create placeholder files for the extractors
cat > src/extractors/structured-extractor.js << 'EOF'
// TODO: Add the complete structured extraction implementation
// This should include the Enhanced E-commerce & Structured Content Scraper code

function extractStructuredContent(html, url) {
    return {
        contentType: 'generic',
        title: 'Placeholder - Add full implementation',
        error: 'Full structured extraction implementation needed'
    };
}

function detectContentType(html) {
    return 'generic';
}

module.exports = {
    extractStructuredContent,
    detectContentType
};
EOF

cat > src/extractors/browser-emulation.js << 'EOF'
// TODO: Add the complete browser emulation implementation
// This should include the Enhanced Scraper with Browser Emulation & Popup Handling code

async function fetchPageWithBrowser(url, options = {}) {
    throw new Error('Browser emulation implementation needed - add Puppeteer code');
}

async function extractStructuredContentWithBrowser(url, options = {}) {
    throw new Error('Browser content extraction implementation needed');
}

module.exports = {
    fetchPageWithBrowser,
    extractStructuredContentWithBrowser
};
EOF

# Create Azure config placeholder
cat > src/azure-config.js << 'EOF'
// TODO: Add the complete Azure configuration
// This should include the Azure App Service Configuration code

const azureConfig = {
    port: process.env.PORT || 3000,
    browser: {
        maxConcurrent: 2,
        timeout: 25000
    },
    rateLimiting: {
        windowMs: 15 * 60 * 1000,
        max: 50
    }
};

function isAzureEnvironment() {
    return !!(process.env.WEBSITE_SITE_NAME || process.env.APPSETTING_WEBSITE_SITE_NAME);
}

module.exports = {
    azureConfig,
    isAzureEnvironment
};
EOF

# Create GitHub workflow placeholders
mkdir -p .github/workflows
cat > .github/workflows/azure-deploy.yml << 'EOF'
# TODO: Add complete Azure deployment workflow
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    # Add complete deployment steps here
EOF

# Create basic docs
cat > docs/API.md << 'EOF'
# API Documentation

## Endpoints

### GET/POST /api/fetch-url
Extract content from any URL with optional browser emulation.

**Parameters:**
- `url` (required): Target URL
- `browser` (optional): Enable browser emulation
- `followLinks` (optional): Follow links one level deep

**Example:**
```bash
curl -X POST "http://localhost:3000/api/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "browser": true}'
```

TODO: Add complete API documentation
EOF

# Create scripts
mkdir -p scripts
cat > scripts/setup.sh << 'EOF'
#!/bin/bash
echo "🚀 Setting up Gen Z Translator API..."
npm install
cp .env.example .env
echo "✅ Setup complete! Run 'npm run dev' to start"
EOF

cat > scripts/health-check.js << 'EOF'
#!/usr/bin/env node
const http = require('http');

const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/health',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Health check response:', data);
        process.exit(res.statusCode === 200 ? 0 : 1);
    });
});

req.on('error', (error) => {
    console.error('Health check failed:', error.message);
    process.exit(1);
});

req.end();
EOF

# Make scripts executable
chmod +x scripts/*.sh scripts/*.js

# Create basic Docker files
cat > docker/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY public/ ./public/
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Create basic license
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Gen Z Translator API

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

echo "📝 Creating initial commit..."

# Create first commit
git add .
git commit -m "feat: initial project setup

- Basic Express server with health checks
- Azure App Service configuration (web.config)
- Interactive frontend for testing
- Directory structure for full implementation
- Package.json with all required dependencies

Ready for full implementation of:
- Browser emulation with Puppeteer
- Popup handling (age verification, cookies)
- Structured content extraction
- E-commerce product detection
- Price tracking capabilities"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📁 Project created: $(pwd)"
echo ""
echo "🔧 Next steps:"
echo "1. Edit the YOUR_USERNAME variables in package.json and README.md"
echo "2. Add your GitHub remote: git remote add origin https://github.com/YOUR_USERNAME/genz-translator-api.git"
echo "3. Install dependencies: npm install"
echo "4. Copy environment: cp .env.example .env"
echo "5. Start development: npm run dev"
echo "6. Visit: http://localhost:3000"
echo ""
echo "📋 To complete the implementation:"
echo "- Replace src/server.js with the full Azure-optimized server code"
echo "- Add complete extraction modules to src/extractors/"
echo "- Add full interactive frontend to public/index.html"
echo "- Update GitHub workflows in .github/workflows/"
echo ""
echo "🚀 Ready to build an amazing content extraction API!"