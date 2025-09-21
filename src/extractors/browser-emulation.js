// src/extractors/browser-emulation.js
// Enhanced Browser Emulation with Popup Handling

const { firefox } = require('playwright');

// Browser instance management
let browserInstance = null;

// Detect Azure environment
const IS_AZURE = !!(
  process.env.WEBSITE_SITE_NAME ||
    process.env.APPSETTING_WEBSITE_SITE_NAME ||
    process.env.WEBSITE_RESOURCE_GROUP
);

async function getBrowserInstance () {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🚀 Starting new Firefox browser instance...');

    // For Azure environment, ensure Firefox is available
    if (IS_AZURE) {
      const { execSync } = require('child_process');
      try {
        console.log('📦 Checking Firefox installation...');

        // Try to find Firefox binary in common locations
        const possibleFirefoxPaths = [
          '/root/.cache/ms-playwright/firefox-*/firefox/firefox',
          '/home/.cache/ms-playwright/firefox-*/firefox/firefox',
          '/usr/bin/firefox',
          '/usr/bin/firefox-esr'
        ];

        let firefoxFound = false;
        for (const pathPattern of possibleFirefoxPaths) {
          try {
            if (pathPattern.includes('*')) {
              // Use find for wildcard patterns
              const result = execSync(`find ${pathPattern.split('*')[0]} -name firefox -type f 2>/dev/null | head -1`, {
                stdio: 'pipe',
                encoding: 'utf8'
              });
              if (result.trim()) {
                console.log(`✅ Firefox binary found at: ${result.trim()}`);
                firefoxFound = true;
                break;
              }
            } else {
              execSync(`ls -la ${pathPattern}`, { stdio: 'pipe' });
              console.log(`✅ Firefox binary found at: ${pathPattern}`);
              firefoxFound = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!firefoxFound) {
          console.log('🔄 Installing Firefox browser...');
          try {
            // Install Firefox browser with dependencies
            execSync('npx playwright install firefox --with-deps', {
              stdio: 'inherit',
              timeout: 180000 // 3 minutes timeout
            });
            console.log('✅ Firefox installation completed');
          } catch (installError) {
            console.error('❌ Firefox installation failed:', installError.message);
            throw new Error(`Firefox installation failed: ${installError.message}`);
          }
        }
      } catch (setupError) {
        console.error('❌ Firefox setup failed:', setupError.message);
        throw new Error(`Firefox setup failed: ${setupError.message}`);
      }
    }

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        // Azure-specific optimizations
        ...(IS_AZURE
          ? [
              '--memory-pressure-off'
            ]
          : [])
      ]
    };

    browserInstance = await firefox.launch(launchOptions);

    console.log('✅ Firefox browser instance ready');
  }
  return browserInstance;
}

// Enhanced page setup with realistic browser behavior for Playwright
async function setupPage (browser) {
  // Create browser context with realistic user agent and settings
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    // Additional anti-detection measures
    hasTouch: false,
    isMobile: false,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    // Simulate real browser permissions
    permissions: ['geolocation'],
    // Add realistic screen info
    screen: { width: 1920, height: 1080 },
    // Block some tracking
    bypassCSP: true
  });

  const page = await context.newPage();

  // Set extra headers
  await page.setExtraHTTPHeaders({
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    DNT: '1',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });

  // Set geolocation (US-based)
  await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

  // Enhanced anti-detection script
  await page.addInitScript(() => {
    // Remove webdriver property completely
    delete Object.getPrototypeOf(navigator).webdriver;

    // Mock Firefox-specific objects and properties
    window.InstallTrigger = {};

    // Mock realistic navigator properties
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    // Mock plugins with realistic Firefox plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => ({
        length: 5,
        0: { name: 'PDF Viewer', filename: 'internal-pdf-viewer' },
        1: { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer' },
        2: { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer' },
        3: { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer' },
        4: { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer' }
      })
    });

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });

    // Mock realistic hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8
    });

    // Mock realistic device memory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8
    });

    // Override permission query to appear more realistic
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );

    // Mock realistic screen properties
    Object.defineProperty(window.screen, 'availWidth', { get: () => 1920 });
    Object.defineProperty(window.screen, 'availHeight', { get: () => 1040 });
    Object.defineProperty(window.screen, 'width', { get: () => 1920 });
    Object.defineProperty(window.screen, 'height', { get: () => 1080 });
    Object.defineProperty(window.screen, 'colorDepth', { get: () => 24 });
    Object.defineProperty(window.screen, 'pixelDepth', { get: () => 24 });

    // Mock realistic timing for performance
    if (window.performance && window.performance.now) {
      const originalNow = window.performance.now;
      const startTime = originalNow.call(window.performance);
      window.performance.now = () => {
        return originalNow.call(window.performance) - startTime + Math.random() * 0.1;
      };
    }

    // Add some human-like mouse movement simulation
    let mouseX = 0, mouseY = 0;
    const updateMouse = () => {
      mouseX += (Math.random() - 0.5) * 2;
      mouseY += (Math.random() - 0.5) * 2;
      mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
      mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));
    };
    setInterval(updateMouse, 100);
  });

  return page;
}

// Comprehensive popup and overlay handler
async function handlePopupsAndOverlays (page) {
  console.log('🔍 Checking for popups and overlays...');

  try {
    // Wait a moment for any popups to appear
    await page.waitForTimeout(2000);

    // Define common popup selectors with priority order
    const popupSelectors = [
      // Age verification (highest priority)
      {
        selectors: [
          'button[class*="age-confirm"], button[id*="age-confirm"]',
          'input[value*="yes"], input[value*="confirm"], input[value*="enter"]',
          'button:has-text("Yes, I am"), button:has-text("I am 21"), button:has-text("I am 18")',
          'button:has-text("Enter Site"), button:has-text("Continue"), button:has-text("Proceed")',
          '[id*="age"] button, [class*="age"] button',
          // Green Goods specific selectors
          'button:has-text("Yes")', 'input[value="Yes"]',
          'input[type="radio"][value="Yes"]', 'input[type="radio"][value="yes"]',
          '.step-1-only button', '.gf_page button',
          'form button[type="submit"]', 'form input[type="submit"]',
          '.gform_button', '.button',
          // Lake Leaf specific selectors
          '[class*="age-gate"] button', '[id*="age-gate"] button',
          '[class*="verification"] button', '[id*="verification"] button',
          'button:has-text("I am 21+"), button:has-text("I am over 21")',
          'button:has-text("Verify Age"), button:has-text("Enter")',
          '.modal button', '.popup button', '.overlay button',
          '[data-testid*="age"] button', '[data-testid*="verify"] button'
        ],
        type: 'age-verification',
        keywords: ['18', '21', 'yes', 'enter', 'confirm', 'proceed', 'continue']
      },

      // Cookie consent
      {
        selectors: [
          '#onetrust-accept-btn-handler',
          'button[class*="accept"], button[id*="accept"]',
          '.cookie-accept, .cookies-accept',
          'button:has-text("Accept"), button:has-text("Allow"), button:has-text("OK")',
          '[id*="cookie"] button, [class*="cookie"] button'
        ],
        type: 'cookie-consent',
        keywords: ['accept', 'allow', 'ok', 'agree']
      },

      // GDPR consent
      {
        selectors: [
          'button:has-text("Accept All"), button:has-text("Agree")',
          '[class*="gdpr"] button, [id*="gdpr"] button'
        ],
        type: 'gdpr-consent',
        keywords: ['accept all', 'agree', 'consent']
      },

      // Newsletter/Email popups (close these)
      {
        selectors: [
          'button:has-text("No Thanks"), button:has-text("Skip"), button:has-text("Later")',
          'button:has-text("Close"), button[aria-label*="close"], button[title*="close"]',
          '[class*="newsletter"] [class*="close"], [class*="email-popup"] [class*="close"]'
        ],
        type: 'newsletter-close',
        keywords: ['no thanks', 'skip', 'later', 'close', 'dismiss']
      },

      // Location/Geolocation (close these)
      {
        selectors: [
          'button:has-text("Not Now"), button:has-text("Deny")',
          '[class*="location"] button, [class*="geolocation"] button'
        ],
        type: 'location-deny',
        keywords: ['not now', 'deny', 'no', 'skip']
      },

      // General modal close buttons
      {
        selectors: [
          '.modal-close, .close-button, .popup-close',
          'button[aria-label="Close"], button[title="Close"]',
          '[data-dismiss="modal"], [data-close="modal"]',
          '.modal-overlay, .popup-overlay, .backdrop'
        ],
        type: 'modal-close',
        keywords: ['close']
      }
    ];

    let popupsHandled = 0;

    // Try to handle each type of popup
    for (const popupType of popupSelectors) {
      try {
        for (const selector of popupType.selectors) {
          try {
            // Try modern selector methods first
            const elements = await page.locator(selector).all();

            for (const element of elements) {
              const isVisible = await element.isVisible();
              if (isVisible) {
                const elementText = (await element.textContent())?.toLowerCase() || '';

                // Smart clicking based on popup type and text content
                let shouldClick = false;

                if (popupType.type === 'age-verification') {
                  shouldClick = popupType.keywords.some(keyword =>
                    elementText.includes(keyword) || selector.toLowerCase().includes(keyword)
                  );
                } else if (popupType.type === 'cookie-consent' || popupType.type === 'gdpr-consent') {
                  shouldClick = popupType.keywords.some(keyword =>
                    elementText.includes(keyword)
                  );
                } else {
                  // For close buttons, look for close-related text or selectors
                  shouldClick = popupType.keywords.some(keyword =>
                    elementText.includes(keyword) || selector.toLowerCase().includes('close')
                  );
                }

                if (shouldClick) {
                  console.log(`✅ Handling ${popupType.type}: ${elementText.substring(0, 50)}...`);

                  // Click the element
                  await element.click();
                  popupsHandled++;

                  // Wait for any animations or redirects
                  await page.waitForTimeout(1500);

                  // Break out of this selector type after successful click
                  break;
                }
              }
            }

            // If we handled a popup, move to next type
            if (popupsHandled > 0) break;
          } catch (selectorError) {
            // Continue with next selector if this one fails
            continue;
          }
        }
      } catch (typeError) {
        // Continue with next popup type
        continue;
      }
    }

    // Handle JavaScript alerts/confirms/prompts
    page.on('dialog', async (dialog) => {
      console.log(`🔔 Handling dialog: ${dialog.message()}`);

      // Accept age verification dialogs, dismiss others intelligently
      const message = dialog.message().toLowerCase();
      if (message.includes('age') || message.includes('18') || message.includes('21') || message.includes('old')) {
        await dialog.accept();
      } else if (message.includes('location') || message.includes('notification')) {
        await dialog.dismiss();
      } else {
        await dialog.accept(); // Default to accept
      }

      popupsHandled++;
    });

    console.log(`✨ Handled ${popupsHandled} popups/overlays`);

    // Final wait for any remaining animations
    await page.waitForTimeout(1000);

    return popupsHandled;
  } catch (error) {
    console.error('❗ Error handling popups:', error.message);
    return 0;
  }
}

// Enhanced page content extraction with browser emulation
async function fetchPageWithBrowser (url, options = {}) {
  const {
    waitForSelector = null,
    waitTime = IS_AZURE ? 3000 : 5000,
    handlePopups = true,
    scrollToBottom = true,
    takeScreenshot = false,
    timeout = IS_AZURE ? 25000 : 30000
  } = options;

  let browser = null;
  let page = null;

  try {
    console.log(`🌐 Fetching ${url} with browser emulation (Azure: ${IS_AZURE})...`);

    browser = await getBrowserInstance();
    page = await setupPage(browser);

    // Set timeout for page operations
    page.setDefaultTimeout(timeout);

    // Navigate to page with realistic timing
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout
    });

    // Wait for network to be idle
    await page.waitForTimeout(2000);
    console.log('📄 Page loaded successfully');

    // Handle popups and overlays
    let popupsHandled = 0;
    if (handlePopups) {
      popupsHandled = await handlePopupsAndOverlays(page);
    }

    // Enhanced wait for specific cannabis sites
    if (url.includes('risecannabis.com') && url.includes('medical-menu')) {
      console.log('🌿 Detected Rise Cannabis menu page - waiting for product cards...');
      try {
        // Wait for product cards to appear with THC data
        await page.waitForFunction(() => {
          // Look for elements containing THC percentage data like "THC 27.9%"
          const elements = document.querySelectorAll('*');
          let thcCount = 0;
          for (let el of elements) {
            if (el.textContent && el.textContent.match(/THC\s+\d+(\.\d+)?%/)) {
              thcCount++;
            }
          }
          console.log(`Found ${thcCount} elements with THC data`);
          return thcCount >= 10; // Wait for at least 10 product cards to load
        }, { timeout: 30000 });

        console.log('✅ Product cards with THC data loaded');

        // Additional wait for any lazy loading
        await page.waitForTimeout(3000);

        // Scroll to trigger any lazy loading
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await page.waitForTimeout(2000);

        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(2000);

        console.log('✅ Completed scroll and wait for lazy loading');

      } catch (e) {
        console.log('⚠️ Timeout waiting for product cards, proceeding with extraction');
      }
    }

    // Enhanced handling for Lake Leaf Retail
    if (url.includes('lakeleafretail.com')) {
      console.log('🌿 Detected Lake Leaf Retail - using advanced anti-blocking measures...');
      try {
        // Wait longer for initial load
        await page.waitForTimeout(5000);

        // Handle potential age verification or location blocking
        await page.evaluate(() => {
          // Simulate user interaction patterns
          document.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight
          }));
        });

        // Wait for any additional popups to appear after interaction
        await page.waitForTimeout(3000);

        // Try to find and handle any blocking mechanisms
        const blockingElements = await page.locator('body').innerHTML();
        if (blockingElements.includes('verification') ||
            blockingElements.includes('location') ||
            blockingElements.includes('restricted') ||
            blockingElements.includes('blocked')) {
          console.log('🚫 Detected blocking mechanism, attempting bypass...');

          // Try clicking anywhere to trigger potential overlays
          await page.click('body', { force: true });
          await page.waitForTimeout(2000);

          // Look for product elements to confirm content loaded
          await page.waitForFunction(() => {
            const text = document.body.textContent.toLowerCase();
            return text.includes('flower') || text.includes('thc') || text.includes('cannabis') || text.includes('strain');
          }, { timeout: 15000 });
        }

        // Wait for product content to load
        await page.waitForFunction(() => {
          const elements = document.querySelectorAll('*');
          let productCount = 0;
          for (let el of elements) {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('flower') || text.includes('strain') || text.match(/\$\d+/)) {
              productCount++;
            }
          }
          return productCount >= 5; // Wait for at least 5 product-related elements
        }, { timeout: 20000 });

        console.log('✅ Lake Leaf content loaded successfully');

      } catch (e) {
        console.log('⚠️ Lake Leaf special handling failed, proceeding with standard extraction');
      }
    }

    // Wait for specific selector if provided
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
        console.log(`✅ Found selector: ${waitForSelector}`);
      } catch (e) {
        console.log(`⚠️  Selector not found: ${waitForSelector}`);
      }
    }

    // Scroll to bottom to trigger lazy loading
    if (scrollToBottom) {
      await autoScroll(page);
    }

    // Additional wait for content to fully render
    await page.waitForTimeout(waitTime);

    // Extract final HTML content
    const html = await page.content();
    const title = await page.title();
    const finalUrl = page.url();

    // Take screenshot if requested
    let screenshot = null;
    if (takeScreenshot) {
      screenshot = await page.screenshot({
        fullPage: true,
        type: 'jpeg',
        quality: 80
      });
    }

    // Get basic metrics (Playwright doesn't have page.metrics() like Puppeteer)
    const metrics = { TaskDuration: 0, LayoutCount: 0 };

    console.log(`✅ Successfully extracted content from ${finalUrl}`);

    return {
      success: true,
      html,
      title,
      url: finalUrl,
      screenshot,
      metrics: {
        popupsHandled,
        jsEnabled: true,
        renderTime: metrics.TaskDuration || 0,
        layoutCount: metrics.LayoutCount || 0,
        environment: IS_AZURE ? 'Azure App Service' : 'Self-hosted'
      }
    };
  } catch (error) {
    console.error('❌ Browser fetch failed:', error.message);
    return {
      success: false,
      error: error.message,
      url,
      type: error.name
    };
  } finally {
    if (page) {
      try {
        await page.close();
        console.log('📄 Page closed');
      } catch (e) {
        console.error('Error closing page:', e.message);
      }
    }
  }
}

// Auto-scroll to trigger lazy loading
async function autoScroll (page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          // Scroll back to top
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });

  console.log('📜 Completed auto-scroll to trigger lazy loading');
}

// Extract links from HTML for deep linking
function extractLinksFromHtml (html, baseUrl, linkFilter = 'same-domain') {
  const links = [];
  const baseUrlObj = new URL(baseUrl);

  // Regex to find all anchor tags with href attributes
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const linkText = match[2].replace(/<[^>]+>/g, '').trim();

    try {
      // Resolve relative URLs
      let fullUrl;
      if (href.startsWith('http://') || href.startsWith('https://')) {
        fullUrl = href;
      } else if (href.startsWith('//')) {
        fullUrl = baseUrlObj.protocol + href;
      } else if (href.startsWith('/')) {
        fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${href}`;
      } else if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue; // Skip anchors, mailto, tel links
      } else {
        // Relative path
        const basePath = baseUrlObj.pathname.endsWith('/') ? baseUrlObj.pathname : baseUrlObj.pathname + '/';
        fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${basePath}${href}`;
      }

      const linkUrlObj = new URL(fullUrl);

      // Apply link filtering
      if (linkFilter === 'same-domain' && linkUrlObj.hostname !== baseUrlObj.hostname) {
        continue;
      }

      if (linkFilter === 'same-site') {
        const baseDomain = baseUrlObj.hostname.split('.').slice(-2).join('.');
        const linkDomain = linkUrlObj.hostname.split('.').slice(-2).join('.');
        if (baseDomain !== linkDomain) {
          continue;
        }
      }

      // Skip common non-content links
      if (isNonContentLink(fullUrl, linkText)) {
        continue;
      }

      // Extract context around the link
      const contextMatch = html.match(new RegExp(`.{0,100}${escapeRegExp(match[0])}.{0,100}`, 'i'));
      const context = contextMatch ? contextMatch[0].replace(/<[^>]+>/g, '').trim() : '';

      links.push({
        url: fullUrl,
        text: linkText,
        context
      });
    } catch (urlError) {
      // Skip invalid URLs
      continue;
    }
  }

  // Remove duplicates and sort by relevance
  const uniqueLinks = links.filter((link, index, self) =>
    index === self.findIndex(l => l.url === link.url)
  );

  return uniqueLinks.slice(0, 50); // Limit to top 50 links
}

// Helper function to identify non-content links
function isNonContentLink (url, linkText) {
  const nonContentPatterns = [
    /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar)$/i,
    /\/(?:login|register|signup|signin|logout|privacy|terms|about|contact|support)$/i,
    /(?:javascript:|#|mailto:|tel:)/i
  ];

  const nonContentTexts = [
    /^(?:home|back|next|previous|prev|more|continue|click here|read more|login|register|signup|sign in|log out|privacy|terms|about|contact|support)$/i,
    /^(?:twitter|facebook|instagram|linkedin|youtube|share|like|follow)$/i,
    /^\d+$/, // Just numbers
    /^.{1,2}$/ // Very short text (likely icons/symbols)
  ];

  return nonContentPatterns.some(pattern => pattern.test(url)) ||
           nonContentTexts.some(pattern => pattern.test(linkText.trim()));
}

// Helper function to escape regex special characters
function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Prioritize e-commerce links
function prioritizeEcommerceLinks (links, _baseUrl) {
  return links.map(link => {
    let priority = 'normal';
    let score = 0;

    const url = link.url.toLowerCase();
    const text = link.text.toLowerCase();
    const context = link.context.toLowerCase();

    // High priority indicators (products, categories)
    const highPriorityPatterns = [
      /\/product[s]?\//,
      /\/item[s]?\//,
      /\/category\//,
      /\/collection[s]?\//,
      /\/shop\//,
      /\/store\//,
      /\/buy\//,
      /\/p\//,
      /\/c\//
    ];

    // Product-like text indicators
    const productTextPatterns = [
      /\$\d+|\d+\.\d+/, // Price indicators
      /buy|purchase|shop|order/,
      /product|item|model/,
      /size|color|variant/,
      /in stock|available|add to cart/
    ];

    // Check URL patterns
    if (highPriorityPatterns.some(pattern => pattern.test(url))) {
      score += 100;
      priority = 'high';
    }

    // Check text content
    if (productTextPatterns.some(pattern => pattern.test(text + ' ' + context))) {
      score += 50;
      if (priority !== 'high') priority = 'medium';
    }

    // Boost score for descriptive link text
    if (text.length > 10 && text.length < 100) {
      score += 20;
    }

    return {
      ...link,
      priority,
      score
    };
  }).sort((a, b) => b.score - a.score);
}

module.exports = {
  fetchPageWithBrowser,
  handlePopupsAndOverlays,
  getBrowserInstance,
  extractLinksFromHtml,
  prioritizeEcommerceLinks,
  autoScroll
};
