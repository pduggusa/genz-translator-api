# 🔗 Integration Instructions

## 📁 **Files You Now Have:**

### **1. Complete Server (`src/server.js`)**
✅ **Status**: Ready and functional
✅ **Features**: Azure optimization, rate limiting, health checks
✅ **Needs**: Integration with extraction modules

### **2. Browser Emulation (`src/extractors/browser-emulation.js`)**
✅ **Puppeteer integration** with stealth mode
✅ **Comprehensive popup handling** (age verification, cookies, newsletters)
✅ **Azure optimization** with resource management
✅ **Auto-scrolling** and lazy loading support

### **3. Structured Extraction (`src/extractors/structured-extractor.js`)**
✅ **E-commerce product detection** with pricing extraction
✅ **Article content** with readability
✅ **Multiple content types** (product, article, listing, generic)
✅ **Rich metadata** extraction (brand, SKU, reviews)

---

## 🔧 **Integration Steps:**

### **Step 1: Add Import Statements to Server.js**

Add these imports to the top of your `src/server.js` file (after the existing imports):

```javascript
// Add these imports after the existing ones
const { 
    extractStructuredContent, 
    detectContentType 
} = require('./extractors/structured-extractor');

const {
    fetchPageWithBrowser,
    extractLinksFromHtml,
    prioritizeEcommerceLinks,
    handlePopupsAndOverlays,
    getBrowserInstance
} = require('./extractors/browser-emulation');
```

### **Step 2: Replace the Mock `handleFetchUrl` Function**

Replace the current `handleFetchUrl` function in your server.js with this real implementation:

```javascript
async function handleFetchUrl(req, res) {
    const startTime = Date.now();
    
    // Track request stats
    requestStats.total++;
    const useBrowser = req.query.browser !== 'false' && req.body?.browser !== false;
    if (useBrowser) {
        requestStats.browserRequests++;
    } else {
        requestStats.httpRequests++;
    }
    
    try {
        // Extract parameters
        const url = req.query.url || req.body?.url;
        const followLinks = req.query.followLinks === 'true' || req.body?.followLinks === true;
        const maxLinks = Math.min(parseInt(req.query.maxLinks || req.body?.maxLinks || '5'), IS_AZURE ? 3 : 10);
        const linkFilter = req.query.linkFilter || req.body?.linkFilter || 'same-domain';
        const takeScreenshot = req.query.screenshot === 'true' || req.body?.screenshot === true;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter is required',
                usage: {
                    GET: '/api/fetch-url?url=https://example.com&browser=true',
                    POST: '{"url": "https://example.com", "browser": true, "followLinks": true}',
                    parameters: {
                        url: 'Target URL (required)',
                        browser: 'Enable browser emulation (default: true)',
                        followLinks: 'Follow links one level deep (default: false)',
                        maxLinks: `Maximum links to follow (default: 5, max: ${IS_AZURE ? 3 : 10})`,
                        linkFilter: 'Link filtering: same-domain, same-site, all (default: same-domain)',
                        screenshot: 'Take page screenshot (default: false)'
                    }
                },
                environment: IS_AZURE ? 'Azure App Service' : 'Self-hosted'
            });
        }

        // Validate URL
        let targetUrl;
        try {
            targetUrl = new URL(url);
            if (!['http:', 'https:'].includes(targetUrl.protocol)) {
                throw new Error('Only HTTP and HTTPS URLs are allowed');
            }
        } catch (urlError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format',
                details: urlError.message,
                example: 'https://example.com/page'
            });
        }

        // Azure resource check for browser emulation
        if (useBrowser && IS_AZURE) {
            const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
            if (memoryUsage > 1200) {
                console.warn(`⚠️ High memory usage (${memoryUsage.toFixed(0)}MB), disabling browser emulation`);
                
                return res.status(503).json({
                    success: false,
                    error: 'Browser emulation temporarily unavailable due to resource constraints',
                    suggestion: 'Try again in a few minutes or use browser=false for HTTP-only extraction',
                    memoryUsage: memoryUsage.toFixed(0) + 'MB',
                    alternative: `${req.protocol}://${req.get('host')}/api/fetch-url?url=${encodeURIComponent(url)}&browser=false`
                });
            }
        }

        console.log(`🌐 Processing: ${url} (browser: ${useBrowser}, links: ${followLinks}, Azure: ${IS_AZURE})`);

        // Extract main page content
        let mainContent;
        if (useBrowser) {
            // Use browser emulation with Azure-specific settings
            const browserResult = await fetchPageWithBrowser(url, {
                takeScreenshot: takeScreenshot,
                waitTime: IS_AZURE ? 3000 : 5000,
                handlePopups: true,
                scrollToBottom: true,
                timeout: IS_AZURE ? 25000 : 30000
            });
            
            if (browserResult.success) {
                // Use the structured extraction on the browser-rendered HTML
                const structuredContent = extractStructuredContent(browserResult.html, url);
                
                mainContent = {
                    ...structuredContent,
                    extractionMethod: 'browser-rendered',
                    browserMetrics: browserResult.metrics,
                    renderingInfo: {
                        jsEnabled: true,
                        popupsHandled: browserResult.metrics.popupsHandled,
                        renderTime: browserResult.metrics.renderTime,
                        finalUrl: browserResult.url
                    },
                    rawHtml: browserResult.html
                };
            } else {
                return res.status(500).json({
                    success: false,
                    error: browserResult.error,
                    url: url,
                    suggestion: 'Try browser=false for HTTP-only extraction',
                    extractionMethod: 'browser-failed'
                });
            }
        } else {
            // Use HTTP-only extraction
            const httpResult = await fetchStructuredPageContentHTTP(url);
            if (httpResult.success) {
                mainContent = {
                    ...httpResult.data,
                    extractionMethod: 'http-only'
                };
            } else {
                return res.status(httpResult.status || 500).json({
                    success: false,
                    error: httpResult.error,
                    url: url,
                    suggestion: 'Try enabling browser emulation for better results'
                });
            }
        }

        // Build response
        let response = {
            success: true,
            url: url,
            contentType: mainContent.contentType,
            data: mainContent,
            timestamp: new Date().toISOString(),
            extractionMethod: mainContent.extractionMethod,
            browserEnabled: useBrowser,
            processingTime: Date.now() - startTime,
            environment: IS_AZURE ? 'Azure App Service' : 'Self-hosted'
        };

        // Add Azure-specific metadata
        if (IS_AZURE) {
            response.azure = {
                resourceOptimized: true,
                memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
                maxConcurrentBrowsers: IS_AZURE ? 2 : 3
            };
        }

        // Add browser-specific metadata
        if (mainContent.browserMetrics) {
            response.browserMetrics = mainContent.browserMetrics;
            response.renderingInfo = mainContent.renderingInfo;
        }

        // Handle deep linking
        if (followLinks) {
            console.log(`🔗 Following up to ${maxLinks} links...`);
            
            const linkedContent = await followLinksWithEnhancedExtraction({
                html: mainContent.rawHtml || '',
                baseUrl: url,
                maxLinks,
                linkFilter,
                useBrowser
            });

            response.linkedPages = linkedContent.pages;
            response.linkSummary = linkedContent.summary;
        }

        // Track successful response
        requestStats.successful++;
        if (mainContent.contentType === 'product') requestStats.productPages++;
        if (mainContent.contentType === 'article') requestStats.articlePages++;

        res.json(response);
        console.log(`✅ Successfully processed ${url} in ${Date.now() - startTime}ms`);

    } catch (error) {
        console.error('❌ Request processing failed:', error);
        requestStats.failed++;
        
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return res.status(408).json({
                success: false,
                error: 'Request timeout',
                details: IS_AZURE ? 'Azure App Service timeout (consider shorter timeouts)' : 'Request took too long to complete',
                suggestion: 'Try with a simpler page or disable browser emulation'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message,
            type: error.name,
            environment: IS_AZURE ? 'Azure App Service' : 'Self-hosted'
        });
    }
}

// HTTP-only extraction function
async function fetchStructuredPageContentHTTP(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), IS_AZURE ? 12000 : 15000);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status
            };
        }

        const html = await response.text();
        const extractedContent = extractStructuredContent(html, url);

        return {
            success: true,
            data: {
                ...extractedContent,
                extractionMethod: 'http-only',
                rawHtml: html
            }
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            type: error.name
        };
    }
}

// Enhanced link following function
async function followLinksWithEnhancedExtraction({ html, baseUrl, maxLinks, linkFilter, useBrowser }) {
    try {
        const links = extractLinksFromHtml(html, baseUrl, linkFilter);
        const prioritizedLinks = prioritizeEcommerceLinks(links, baseUrl);
        const linksToFollow = prioritizedLinks.slice(0, maxLinks);
        
        console.log(`🔗 Following ${linksToFollow.length} links with ${useBrowser ? 'browser' : 'HTTP'} extraction`);

        // Process links with appropriate extraction method
        const linkPromises = linksToFollow.map(async (link, index) => {
            // Stagger requests to be respectful
            await new Promise(resolve => setTimeout(resolve, index * (IS_AZURE ? 2000 : 1200)));
            
            try {
                let content;
                if (useBrowser) {
                    const browserResult = await fetchPageWithBrowser(link.url, {
                        waitTime: 2000,
                        takeScreenshot: false,
                        handlePopups: true
                    });
                    
                    if (browserResult.success) {
                        content = extractStructuredContent(browserResult.html, link.url);
                        content.browserMetrics = browserResult.metrics;
                    } else {
                        content = { error: browserResult.error };
                    }
                } else {
                    const httpResult = await fetchStructuredPageContentHTTP(link.url);
                    content = httpResult.success ? httpResult.data : { error: httpResult.error };
                }
                
                return {
                    url: link.url,
                    linkText: link.text,
                    linkContext: link.context,
                    priority: link.priority,
                    success: !content.error,
                    ...content
                };
                
            } catch (error) {
                return {
                    url: link.url,
                    linkText: link.text,
                    error: error.message,
                    success: false
                };
            }
        });

        const results = await Promise.allSettled(linkPromises);
        const pages = [];
        let successful = 0, failed = 0;

        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                const pageData = result.value;
                pages.push(pageData);
                
                if (pageData.success) {
                    successful++;
                } else {
                    failed++;
                }
            } else {
                failed++;
            }
        });

        return {
            pages,
            summary: {
                totalLinksFound: links.length,
                linksFollowed: linksToFollow.length,
                successfulExtractions: successful,
                failedExtractions: failed,
                extractionMethod: useBrowser ? 'browser' : 'http'
            }
        };

    } catch (error) {
        console.error('❌ Enhanced link following failed:', error);
        return {
            pages: [],
            summary: {
                totalLinksFound: 0,
                linksFollowed: 0,
                successfulExtractions: 0,
                failedExtractions: 0,
                error: error.message
            }
        };
    }
}
```

### **Step 3: Update the Product Endpoint**

Replace the product endpoint with this working version:

```javascript
app.get('/api/product', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL parameter is required',
            usage: 'GET /api/product?url=https://store.example.com/product/123',
            note: IS_AZURE ? 'Optimized for Azure App Service resource limits' : null
        });
    }
    
    try {
        // Always use browser emulation for product pages
        const browserResult = await fetchPageWithBrowser(url, {
            waitTime: IS_AZURE ? 6000 : 8000,
            handlePopups: true,
            scrollToBottom: true
        });
        
        if (!browserResult.success) {
            return res.status(500).json({
                success: false,
                error: browserResult.error,
                url: url,
                suggestion: 'Try the general /api/fetch-url endpoint'
            });
        }
        
        const content = extractStructuredContent(browserResult.html, url);
        
        if (content.contentType !== 'product') {
            return res.status(422).json({
                success: false,
                error: 'URL does not appear to be a product page',
                detectedType: content.contentType,
                suggestion: 'Use /api/fetch-url for general content extraction'
            });
        }
        
        res.json({
            success: true,
            url: url,
            product: content,
            browserMetrics: browserResult.metrics,
            timestamp: new Date().toISOString(),
            optimizedFor: 'product-extraction'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to extract product data',
            details: error.message
        });
    }
});
```

---

## 🚀 **Quick Integration Script**

Save this as `integrate.js` and run it to automatically update your server:

```javascript
const fs = require('fs');
const path = require('path');

console.log('🔗 Integrating extraction modules with server...');

// Read current server.js
const serverPath = path.join(__dirname, 'src', 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Add imports after existing imports
const importSection = `
// Import extraction modules
const { 
    extractStructuredContent, 
    detectContentType 
} = require('./extractors/structured-extractor');

const {
    fetchPageWithBrowser,
    extractLinksFromHtml,
    prioritizeEcommerceLinks,
    handlePopupsAndOverlays,
    getBrowserInstance
} = require('./extractors/browser-emulation');
`;

// Find where to insert imports (after existing requires)
const importInsertPoint = serverContent.indexOf('const app = express();');
if (importInsertPoint !== -1) {
    serverContent = serverContent.slice(0, importInsertPoint) + importSection + '\n' + serverContent.slice(importInsertPoint);
}

// Write updated server
fs.writeFileSync(serverPath, serverContent);

console.log('✅ Server updated with extraction module imports');
console.log('🔧 Next: Replace the handleFetchUrl function with the real implementation');
console.log('📝 Check the integration instructions above for the complete handleFetchUrl function');
```

---

## 🎯 **Testing Your Complete System**

After integration, test these endpoints:

### **1. Test Health Check**
```bash
curl http://localhost:3000/health
```

### **2. Test Basic Content Extraction**
```bash
curl -X POST "http://localhost:3000/api/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "browser": true}'
```

### **3. Test Product Extraction**
```bash
curl "http://localhost:3000/api/product?url=https://amazon.com/dp/PRODUCT_ID"
```

### **4. Test with Age-Restricted Site**
```bash
curl -X POST "http://localhost:3000/api/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://wine-store.com", "browser": true}'
```

### **5. Test Deep Link Following**
```bash
curl -X POST "http://localhost:3000/api/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://store.com", "browser": true, "followLinks": true, "maxLinks": 3}'
```

---

## ✅ **What You'll Have After Integration:**

🚀 **Fully functional content extraction API**  
🤖 **Browser emulation with popup handling**  
🏪 **E-commerce product detection with pricing**  
🔗 **Intelligent deep link following**  
📊 **Structured JSON output for price tracking**  
⚡ **Azure App Service optimization**  
🛡️ **Security and rate limiting**  
💊 **Health checks and monitoring**  

**Your API will be ready for production use on Azure App Service!** 🎉