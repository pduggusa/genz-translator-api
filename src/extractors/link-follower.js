// src/extractors/link-follower.js
// Link following functionality for multi-page cannabis product extraction

const cheerio = require('cheerio');
const { fetchPageWithBrowser } = require('./browser-emulation');
const { extractStructuredContent } = require('./structured-extractor');

/**
 * Extract product links from a dispensary menu page
 */
function extractProductLinks (html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();

  // Cannabis-specific product link selectors
  const productSelectors = [
    'a[href*="/product/"]',
    'a[href*="/strain/"]',
    'a[href*="/item/"]',
    '[class*="product"] a',
    '[class*="strain"] a',
    '[class*="item"] a',
    '[data-testid*="product"] a',
    '.product-card a',
    '.strain-card a',
    '.item-card a'
  ];

  for (const selector of productSelectors) {
    $(selector).each((i, el) => {
      const href = $(el).attr('href');
      if (href && isValidProductLink(href, baseUrl)) {
        const fullUrl = resolveUrl(href, baseUrl);
        if (fullUrl) {
          links.add(fullUrl);
        }
      }
    });
  }

  return Array.from(links);
}

/**
 * Check if a link looks like a cannabis product page
 */
function isValidProductLink (href, _baseUrl) {
  if (!href) return false;

  // Skip non-product links
  const skipPatterns = [
    /\.(pdf|jpg|jpeg|png|gif|css|js|ico)$/i,
    /mailto:|tel:|javascript:/i,
    /#$/,
    /\/cart/i,
    /\/checkout/i,
    /\/login/i,
    /\/register/i,
    /\/search/i,
    /\/category/i,
    /\/brand/i
  ];

  if (skipPatterns.some(pattern => pattern.test(href))) {
    return false;
  }

  // Look for product-like patterns
  const productPatterns = [
    /\/product\//i,
    /\/strain\//i,
    /\/item\//i,
    /\/cannabis\//i,
    /\/flower\//i,
    /\/concentrate\//i,
    /\/edible\//i
  ];

  return productPatterns.some(pattern => pattern.test(href));
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl (href, baseUrl) {
  try {
    if (href.startsWith('http')) {
      return href;
    }

    const base = new URL(baseUrl);

    if (href.startsWith('/')) {
      return `${base.protocol}//${base.host}${href}`;
    }

    if (href.startsWith('./')) {
      href = href.substring(2);
    }

    const basePath = base.pathname.endsWith('/') ? base.pathname : base.pathname + '/';
    return `${base.protocol}//${base.host}${basePath}${href}`;
  } catch (error) {
    console.error('URL resolution error:', error);
    return null;
  }
}

/**
 * Follow links and extract cannabis product data
 */
async function followLinksAndExtract (baseUrl, baseHtml, options = {}) {
  const {
    maxLinks = 10,
    // maxDepth = 1, // Reserved for future multi-level crawling
    linkFilter = 'same-domain',
    timeout = 30000
  } = options;

  console.log(`🔗 Starting link following from: ${baseUrl}`);

  // Extract links from the base page
  const productLinks = extractProductLinks(baseHtml, baseUrl);
  console.log(`🔍 Found ${productLinks.length} potential product links`);

  if (productLinks.length === 0) {
    console.log('⚠️ No product links found on base page');
    return [];
  }

  // Filter links based on domain restrictions
  const filteredLinks = filterLinksByDomain(productLinks, baseUrl, linkFilter);
  console.log(`🎯 Filtered to ${filteredLinks.length} links based on domain policy: ${linkFilter}`);

  // Limit the number of links to process
  const linksToProcess = filteredLinks.slice(0, maxLinks);
  console.log(`⚡ Processing ${linksToProcess.length} links (max: ${maxLinks})`);

  const results = [];
  const errors = [];

  // Process links in batches to avoid overwhelming the server
  const batchSize = 3;
  for (let i = 0; i < linksToProcess.length; i += batchSize) {
    const batch = linksToProcess.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} links`);

    const batchPromises = batch.map(async (url, _index) => {
      try {
        console.log(`  🌐 Fetching: ${url}`);

        // Fetch the product page
        const result = await fetchPageWithBrowser(url, {
          handlePopups: true,
          scrollToBottom: false, // Faster for product pages
          timeout
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch page');
        }

        // Extract structured content
        const structuredContent = extractStructuredContent(result.html, url);

        console.log(`  ✅ Extracted: ${structuredContent.contentType} from ${url}`);

        return {
          url,
          success: true,
          data: structuredContent,
          processingTime: Date.now() - Date.now() // Will be calculated properly
        };
      } catch (error) {
        console.error(`  ❌ Failed to process ${url}:`, error.message);
        errors.push({
          url,
          error: error.message
        });
        return null;
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }

    // Small delay between batches to be respectful
    if (i + batchSize < linksToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`🎉 Link following complete: ${results.length} successful, ${errors.length} errors`);

  return {
    baseUrl,
    totalLinksFound: productLinks.length,
    linksProcessed: linksToProcess.length,
    successful: results.length,
    errors: errors.length,
    results,
    errorDetails: errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Filter links based on domain policy
 */
function filterLinksByDomain (links, baseUrl, linkFilter) {
  if (linkFilter === 'all') {
    return links;
  }

  const baseHost = new URL(baseUrl).hostname;
  const baseDomain = extractDomain(baseHost);

  return links.filter(link => {
    try {
      const linkHost = new URL(link).hostname;
      const linkDomain = extractDomain(linkHost);

      switch (linkFilter) {
        case 'same-domain':
          return linkHost === baseHost;
        case 'same-site':
          return linkDomain === baseDomain;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  });
}

/**
 * Extract domain from hostname (removes subdomains)
 */
function extractDomain (hostname) {
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/**
 * Extract cannabis products from followed links
 */
function extractCannabisProducts (followResults) {
  if (!followResults.results) {
    return [];
  }

  const cannabisProducts = [];

  for (const result of followResults.results) {
    if (result.success && result.data) {
      // Check if this is a cannabis product
      if (result.data.contentType === 'cannabis-product' && result.data.cannabis) {
        cannabisProducts.push({
          url: result.url,
          strain: result.data.cannabis.strain,
          potency: result.data.cannabis.potency,
          pricing: result.data.cannabis.pricing,
          product: result.data.cannabis.product,
          dispensary: result.data.cannabis.dispensary,
          availability: result.data.cannabis.availability,
          effects: result.data.cannabis.effects,
          reviews: result.data.cannabis.reviews,
          extracted_at: result.data.extractionTimestamp
        });
      }
    }
  }

  return cannabisProducts;
}

module.exports = {
  extractProductLinks,
  followLinksAndExtract,
  extractCannabisProducts,
  isValidProductLink,
  resolveUrl
};
