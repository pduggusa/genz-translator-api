const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(express.json());

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

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(data);
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
      count: products.length
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
  console.log(`💡 Simplified architecture - 60 lines vs 1000+`);
});