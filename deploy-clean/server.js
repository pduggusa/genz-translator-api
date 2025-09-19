const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { firefox } = require('playwright');

const app = express();
app.use(express.json());

// Browser instance management
let browserInstance = null;

// Detect Azure environment
const IS_AZURE = !!(
  process.env.WEBSITE_SITE_NAME ||
    process.env.APPSETTING_WEBSITE_SITE_NAME ||
    process.env.WEBSITE_RESOURCE_GROUP
);

async function getBrowserInstance() {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('🚀 Starting new Firefox browser instance...');

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        ...(IS_AZURE ? ['--memory-pressure-off'] : [])
      ]
    };

    browserInstance = await firefox.launch(launchOptions);
    console.log('✅ Firefox browser instance ready');
  }
  return browserInstance;
}

async function setupPage(browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York'
  });

  const page = await context.newPage();

  await page.setExtraHTTPHeaders({
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    DNT: '1',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });

  await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

  await page.addInitScript(() => {
    Object.setPrototypeOf(navigator, null);
    window.InstallTrigger = {};
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });

  return page;
}

async function handlePopupsAndOverlays(page) {
  console.log('🔍 Checking for popups and overlays...');

  try {
    await page.waitForTimeout(2000);

    const popupSelectors = [
      {
        selectors: [
          'button[class*="age-confirm"], button[id*="age-confirm"]',
          'input[value*="yes"], input[value*="confirm"], input[value*="enter"]',
          'button:has-text("Yes, I am"), button:has-text("I am 21"), button:has-text("I am 18")',
          'button:has-text("Enter Site"), button:has-text("Continue"), button:has-text("Proceed")',
          '[id*="age"] button, [class*="age"] button'
        ],
        type: 'age-verification',
        keywords: ['18', '21', 'yes', 'enter', 'confirm', 'proceed', 'continue']
      },
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
      }
    ];

    let popupsHandled = 0;

    for (const popupType of popupSelectors) {
      try {
        for (const selector of popupType.selectors) {
          try {
            const elements = await page.locator(selector).all();

            for (const element of elements) {
              const isVisible = await element.isVisible();
              if (isVisible) {
                const elementText = (await element.textContent())?.toLowerCase() || '';

                let shouldClick = false;

                if (popupType.type === 'age-verification') {
                  shouldClick = popupType.keywords.some(keyword =>
                    elementText.includes(keyword) || selector.toLowerCase().includes(keyword)
                  );
                } else if (popupType.type === 'cookie-consent') {
                  shouldClick = popupType.keywords.some(keyword =>
                    elementText.includes(keyword)
                  );
                }

                if (shouldClick) {
                  console.log(`✅ Handling ${popupType.type}: ${elementText.substring(0, 50)}...`);
                  await element.click();
                  popupsHandled++;
                  await page.waitForTimeout(1500);
                  break;
                }
              }
            }

            if (popupsHandled > 0) break;
          } catch (selectorError) {
            continue;
          }
        }
      } catch (typeError) {
        continue;
      }
    }

    page.on('dialog', async (dialog) => {
      console.log(`🔔 Handling dialog: ${dialog.message()}`);
      const message = dialog.message().toLowerCase();
      if (message.includes('age') || message.includes('18') || message.includes('21') || message.includes('old')) {
        await dialog.accept();
      } else if (message.includes('location') || message.includes('notification')) {
        await dialog.dismiss();
      } else {
        await dialog.accept();
      }
      popupsHandled++;
    });

    console.log(`✨ Handled ${popupsHandled} popups/overlays`);
    await page.waitForTimeout(1000);
    return popupsHandled;
  } catch (error) {
    console.error('❗ Error handling popups:', error.message);
    return 0;
  }
}

async function fetchPageWithBrowser(url) {
  let browser = null;
  let page = null;

  try {
    console.log(`🌐 Fetching ${url} with Firefox browser emulation...`);

    browser = await getBrowserInstance();
    page = await setupPage(browser);

    page.setDefaultTimeout(30000);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(2000);
    console.log('📄 Page loaded successfully');

    const popupsHandled = await handlePopupsAndOverlays(page);

    await page.waitForTimeout(3000);

    const html = await page.content();
    const title = await page.title();
    const finalUrl = page.url();

    console.log(`✅ Successfully extracted content from ${finalUrl}`);

    return {
      success: true,
      html,
      title,
      url: finalUrl,
      popupsHandled
    };
  } catch (error) {
    console.error('❌ Browser fetch failed:', error.message);
    return {
      success: false,
      error: error.message,
      url
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// URL autocorrect helper
function normalizeUrl(url) {
  if (!url) return '';

  // Add https:// if no protocol
  if (!url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }

  // Add www. for common domains if missing
  const needsWww = ['nytimes.com', 'washingtonpost.com', 'cnn.com'];
  const domain = url.replace(/^https?:\/\//, '').split('/')[0];

  if (needsWww.some(d => domain === d) && !domain.startsWith('www.')) {
    url = url.replace(domain, `www.${domain}`);
  }

  return url;
}

// Main extraction endpoint
app.post('/extract', async (req, res) => {
  try {
    let { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Normalize URL with autocorrect
    const originalUrl = url;
    url = normalizeUrl(url);

    console.log(`Extracting from: ${url} ${originalUrl !== url ? `(corrected from ${originalUrl})` : ''}`);

    // Try browser emulation first for cannabis sites
    const isCannabisUrl = url.includes('cannabis') || url.includes('dispensary') || url.includes('rise') || url.includes('leafly');

    let html;
    let popupsHandled = 0;

    if (isCannabisUrl) {
      console.log('🌿 Cannabis site detected - using Firefox browser emulation');
      const browserResult = await fetchPageWithBrowser(url);

      if (browserResult.success) {
        html = browserResult.html;
        popupsHandled = browserResult.popupsHandled;
        console.log(`✅ Browser emulation successful, handled ${popupsHandled} popups`);
      } else {
        console.log('⚠️ Browser emulation failed, falling back to axios');
        const { data } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        html = data;
      }
    } else {
      // Use simple axios for non-cannabis sites
      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      html = data;
    }

    const $ = cheerio.load(html);
    const products = [];

    // Generic product extraction with multiple selectors
    $('.product, .item, [class*="product"], .menu-item, .strain').each((i, el) => {
      const $el = $(el);

      // Extract name
      const name = $el.find('h1, h2, h3, h4, .name, .title, .product-name, .strain-name').first().text().trim();

      // Extract price
      const priceText = $el.find('[class*="price"], .cost, .amount').text() || $el.text();
      const price = priceText.match(/\$[\d.,]+/)?.[0];

      // Extract THC/CBD percentages
      const fullText = $el.text();
      const thc = fullText.match(/(\d+(?:\.\d+)?)%?\s*THC/i)?.[1];
      const cbd = fullText.match(/(\d+(?:\.\d+)?)%?\s*CBD/i)?.[1];

      // Extract weight/size
      const weight = fullText.match(/(\d+(?:\.\d+)?)\s*(g|gram|oz|ounce)/i)?.[0];

      if (name && name.length > 2) {
        products.push({
          name,
          thc: thc ? `${thc}%` : null,
          cbd: cbd ? `${cbd}%` : null,
          price,
          weight
        });
      }
    });

    console.log(`Found ${products.length} products`);

    res.json({
      url,
      originalUrl: originalUrl !== url ? originalUrl : undefined,
      timestamp: new Date().toISOString(),
      products,
      count: products.length,
      browserEmulation: isCannabisUrl,
      popupsHandled
    });
  } catch (error) {
    console.error('Extraction error:', error.message);
    res.status(500).json({
      error: error.message,
      url: req.body.url
    });
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Cannabis Product Extractor',
    version: '2.0 (Simplified)',
    endpoints: {
      'POST /extract': 'Extract cannabis products from URL',
      'GET /health': 'Health check'
    },
    usage: {
      endpoint: '/extract',
      method: 'POST',
      body: { url: 'https://dispensary-url.com' }
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌿 Cannabis Extractor v2.0 running on port ${PORT}`);
  console.log('💡 Simplified architecture - 60 lines vs 1000+');
});
