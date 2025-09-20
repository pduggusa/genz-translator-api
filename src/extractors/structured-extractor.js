// src/extractors/structured-extractor.js
// Enhanced E-commerce & Structured Content Scraper with Cannabis Support

const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const TurndownService = require('turndown');
const { isCannabisContent, extractCannabisData } = require('./cannabis-extractor');

// Configure Turndown for better markdown output
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '•',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '_',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full'
});

// Add custom rules for better formatting
turndownService.addRule('lineBreaks', {
  filter: 'br',
  replacement: function () { return '\n'; }
});

// Enhanced content extraction with structured output
function extractStructuredContent (html, url) {
  try {
    const $ = cheerio.load(html);

    // Check for cannabis content first (highest priority)
    if (isCannabisContent(html, $)) {
      const cannabisData = extractCannabisData(html, $, url);
      const regularData = extractProductData(html, $, url);

      // Merge cannabis-specific data with regular product data
      const structuredContent = {
        ...regularData,
        cannabis: cannabisData,
        contentType: 'cannabis-product'
      };

      return {
        contentType: 'cannabis-product',
        ...structuredContent,
        extractionTimestamp: new Date().toISOString(),
        sourceUrl: url
      };
    }

    // Detect regular content type
    const contentType = detectContentType(html, $);

    let structuredContent;

    switch (contentType) {
      case 'product':
        structuredContent = extractProductData(html, $, url);
        break;
      case 'article':
        structuredContent = extractArticleData(html, $, url);
        break;
      case 'listing':
        structuredContent = extractListingData(html, $, url);
        break;
      default:
        structuredContent = extractGenericData(html, $, url);
    }

    return {
      contentType,
      ...structuredContent,
      extractionTimestamp: new Date().toISOString(),
      sourceUrl: url
    };
  } catch (error) {
    console.error('Structured extraction failed:', error);
    return {
      contentType: 'error',
      error: error.message,
      sourceUrl: url
    };
  }
}

// Detect what type of content we're dealing with
function detectContentType (html, $) {
  // E-commerce product indicators (prioritized)
  const productIndicators = [
    // Structured data
    /"@type":\s*"Product"/i,
    // Meta properties
    /<meta[^>]*property=["']product:/i,
    /<meta[^>]*property=["']og:type["'][^>]*content=["']product["']/i,
    // Common e-commerce elements
    /class=["'][^"']*(?:price|add-to-cart|buy-now|product-price|item-price)[^"']*["']/i,
    /id=["'][^"']*(?:price|add-to-cart|buy-now|product-price|item-price)[^"']*["']/i,
    // Currency symbols with numbers
    /[$€£¥₹]\s*\d+|£\s*\d+|\d+\s*USD|\d+\.\d+/,
    // Common product page elements
    /<button[^>]*(?:add.{0,10}cart|buy.{0,10}now)/i
  ];

  // Article indicators
  const articleIndicators = [
    /"@type":\s*"(?:Article|NewsArticle|BlogPosting)"/i,
    /<meta[^>]*property=["']article:/i,
    /<article[^>]*>/i,
    /<time[^>]*>/i
  ];

  // Listing/catalog indicators
  const listingIndicators = [
    /"@type":\s*"(?:ItemList|CollectionPage)"/i,
    /class=["'][^"']*(?:product-list|item-list|catalog|grid)[^"']*["']/i,
    // Multiple product cards
    $('[class*="product-card"], [class*="item-card"], [class*="product-tile"]').length > 2
  ];

  // Check in priority order
  if (productIndicators.some(pattern => pattern.test(html))) {
    return 'product';
  }
  if (listingIndicators.some(pattern => pattern.test(html)) ||
        $('[class*="product"], [class*="item"]').length > 5) {
    return 'listing';
  }
  if (articleIndicators.some(pattern => pattern.test(html))) {
    return 'article';
  }

  return 'generic';
}

// Extract product data with structured output
function extractProductData (html, $, url) {
  const product = {
    type: 'product',
    title: '',
    headers: [],
    content: {
      description: '',
      specifications: {},
      features: []
    },
    pricing: {
      currentPrice: null,
      originalPrice: null,
      currency: '',
      availability: '',
      discount: null
    },
    images: [],
    variants: [],
    reviews: {
      rating: null,
      count: null,
      summary: ''
    },
    metadata: {}
  };

  // Extract structured data first (most reliable for products)
  const structuredData = extractStructuredData(html);
  if (structuredData.product) {
    const sd = structuredData.product;
    product.title = sd.name || '';
    product.content.description = sd.description || '';
    product.pricing.currentPrice = extractPrice(sd.offers?.price);
    product.pricing.currency = sd.offers?.priceCurrency || '';
    product.pricing.availability = sd.offers?.availability || '';
    if (sd.aggregateRating) {
      product.reviews.rating = sd.aggregateRating.ratingValue;
      product.reviews.count = sd.aggregateRating.reviewCount;
    }
    if (sd.image) {
      product.images = Array.isArray(sd.image) ? sd.image : [sd.image];
    }
  }

  // Title extraction with e-commerce priority
  if (!product.title) {
    product.title = extractProductTitle($, html);
  }

  // Price extraction with multiple methods
  const priceData = extractProductPricing($, html);
  Object.assign(product.pricing, priceData);

  // Extract product headers/sections
  product.headers = extractProductHeaders($);

  // Description and features
  const contentData = extractProductContent($, url);
  Object.assign(product.content, contentData);

  // Images
  if (product.images.length === 0) {
    product.images = extractProductImages($, url);
  }

  // Variants (size, color, etc.)
  product.variants = extractProductVariants($);

  // Reviews
  if (!product.reviews.rating) {
    const reviewData = extractProductReviews($);
    Object.assign(product.reviews, reviewData);
  }

  // Additional metadata
  product.metadata = {
    brand: extractBrand($, structuredData),
    sku: extractSKU($, structuredData),
    gtin: extractGTIN($, structuredData),
    category: extractCategory($, structuredData),
    tags: extractProductTags($),
    lastUpdated: new Date().toISOString()
  };

  return product;
}

// Extract pricing information
function extractProductPricing ($, html) {
  const pricing = {
    currentPrice: null,
    originalPrice: null,
    currency: '',
    availability: '',
    discount: null
  };

  // Price selectors in priority order
  const priceSelectors = [
    '[class*="current-price"] [class*="price"]',
    '[class*="sale-price"]',
    '[class*="price-current"]',
    '[class*="price-now"]',
    '[data-testid*="price"]',
    '[class*="price"]:not([class*="original"]):not([class*="was"]):not([class*="old"])',
    '.price',
    '#price'
  ];

  const originalPriceSelectors = [
    '[class*="original-price"]',
    '[class*="was-price"]',
    '[class*="old-price"]',
    '[class*="price-was"]',
    '[class*="regular-price"]',
    '.price-old',
    '.was-price'
  ];

  // Extract current price
  for (const selector of priceSelectors) {
    const priceEl = $(selector).first();
    if (priceEl.length) {
      const priceText = priceEl.text().trim();
      const price = extractPrice(priceText);
      if (price) {
        pricing.currentPrice = price;
        pricing.currency = extractCurrency(priceText);
        break;
      }
    }
  }

  // Extract original price
  for (const selector of originalPriceSelectors) {
    const priceEl = $(selector).first();
    if (priceEl.length) {
      const priceText = priceEl.text().trim();
      const price = extractPrice(priceText);
      if (price && price > (pricing.currentPrice || 0)) {
        pricing.originalPrice = price;
        break;
      }
    }
  }

  // Calculate discount if both prices exist
  if (pricing.currentPrice && pricing.originalPrice) {
    const discountAmount = pricing.originalPrice - pricing.currentPrice;
    pricing.discount = {
      amount: discountAmount,
      percentage: Math.round((discountAmount / pricing.originalPrice) * 100)
    };
  }

  // Extract availability
  const availabilitySelectors = [
    '[class*="availability"]',
    '[class*="stock"]',
    '[class*="inventory"]',
    '[data-testid*="availability"]'
  ];

  for (const selector of availabilitySelectors) {
    const availEl = $(selector).first();
    if (availEl.length) {
      pricing.availability = availEl.text().trim();
      break;
    }
  }

  return pricing;
}

// Extract product title with e-commerce priority
function extractProductTitle ($, html) {
  const titleSelectors = [
    'h1[class*="product"]',
    'h1[class*="item"]',
    '[class*="product-title"] h1',
    '[class*="product-name"]',
    '[data-testid*="product-title"]',
    'h1.title',
    'h1',
    '[property="og:title"]',
    'title'
  ];

  for (const selector of titleSelectors) {
    let title = '';
    if (selector === 'title') {
      title = $('title').text();
    } else if (selector.includes('property=')) {
      title = $(`meta[${selector}]`).attr('content');
    } else {
      title = $(selector).first().text();
    }

    if (title && title.trim().length > 2) {
      return title.trim();
    }
  }

  return '';
}

// Extract structured headers from product page
function extractProductHeaders ($) {
  const headers = [];

  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const level = parseInt(el.tagName.substring(1));

    if (text && text.length > 2) {
      headers.push({
        level,
        text,
        id: $el.attr('id') || null,
        classes: $el.attr('class') || null
      });
    }
  });

  return headers;
}

// Extract product content (description, features, specs)
function extractProductContent ($, url) {
  const content = {
    description: '',
    specifications: {},
    features: []
  };

  // Description selectors
  const descriptionSelectors = [
    '[class*="product-description"]',
    '[class*="item-description"]',
    '[class*="description"]',
    '[id*="description"]',
    '[data-testid*="description"]'
  ];

  for (const selector of descriptionSelectors) {
    const descEl = $(selector).first();
    if (descEl.length) {
      content.description = cleanHtmlToText(descEl.html());
      break;
    }
  }

  // Specifications - look for tables or definition lists
  $('table[class*="spec"], dl[class*="spec"], .specifications table, .specs table').each((i, el) => {
    $(el).find('tr, dt').each((j, row) => {
      const $row = $(row);
      let key, value;

      if (row.tagName === 'TR') {
        const cells = $row.find('td, th');
        if (cells.length >= 2) {
          key = $(cells[0]).text().trim();
          value = $(cells[1]).text().trim();
        }
      } else if (row.tagName === 'DT') {
        key = $row.text().trim();
        value = $row.next('dd').text().trim();
      }

      if (key && value) {
        content.specifications[key] = value;
      }
    });
  });

  // Cannabis-specific product extraction for Rise Cannabis
  if (url && url.includes('risecannabis.com')) {
    console.log('🌿 Extracting detailed Rise Cannabis products...');

    // Extract location from page title or URL
    const locationMatch = url.match(/dispensaries\/[^\/]+\/([^\/]+)/);
    const riseLocation = locationMatch ? locationMatch[1].replace(/-/g, ' ').toUpperCase() : 'UNKNOWN LOCATION';

    // First, collect ALL product URLs on the page - try multiple selectors
    const productUrls = new Set();

    // Try different selectors for product links
    const linkSelectors = [
      'a[href*="/product/"]',
      'a[href*="product"]',
      'a',
      '[href*="/product/"]',
      '[href*="product"]'
    ];

    for (const selector of linkSelectors) {
      $(selector).each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/product/')) {
          const fullUrl = href.startsWith('http') ? href : `https://risecannabis.com${href}`;
          productUrls.add(fullUrl);
        }
      });
    }

    // Also search for any URLs in the page content/text that look like product URLs
    const pageHtml = $.html();
    const urlRegex = /\/dispensaries\/[^\/]+\/[^\/]+\/\d+\/medical-menu\/product\/\d+\/[^\/\s"']+/g;
    const matches = pageHtml.match(urlRegex);
    if (matches) {
      matches.forEach(match => {
        const fullUrl = `https://risecannabis.com${match}`;
        productUrls.add(fullUrl);
      });
    }

    console.log(`🔗 Found ${productUrls.size} product URLs on page`);

    // If we found product URLs, create features for each one
    if (productUrls.size > 0) {
      Array.from(productUrls).forEach((productUrl, index) => {
        // Extract strain name from URL path
        const urlMatch = productUrl.match(/\/product\/\d+\/([^\/]+)\/?$/);
        const strainFromUrl = urlMatch ?
          urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim() :
          'Unknown Strain';

        // Extract vendor and strain
        const parts = strainFromUrl.split(' ');
        const vendor = parts[0] || 'Unknown Vendor';
        const strainName = parts.slice(1).join(' ') || 'Unknown Strain';

        const feature = {
          type: 'cannabis-flower',
          productName: strainName,
          vendor: vendor,
          riseLocation: riseLocation,
          sourceUrl: productUrl,
          thc: null, // Will be filled when individual page is extracted
          terpenes: null,
          price: null,
          weight: null,
          rawText: `Product link found: ${productUrl}`,
          source: 'rise-cannabis'
        };

        content.features.push(JSON.stringify(feature));
      });
    }

    // Fallback to old method if no product URLs found
    if (productUrls.size === 0) {
      console.log('⚠️ No product URLs found, falling back to div extraction');

      // Rise Cannabis uses div[class*="product"] for individual products
      $('div[class*="product"]').each((i, el) => {
      const $product = $(el);
      const productText = $product.text().trim();

      if (productText && productText.length > 5 && productText.length < 500) {
        // Look for product link/URL - Rise Cannabis uses links like /product/1897723/rythm-bananaconda/
        // Try multiple selectors to find product links
        let $link, productUrl;

        // Try direct link in product
        $link = $product.find('a').first();
        if ($link.length) {
          productUrl = $link.attr('href');
        }

        // Try parent/ancestor links that might wrap the product card
        if (!productUrl) {
          $link = $product.closest('a');
          if ($link.length) {
            productUrl = $link.attr('href');
          }
        }

        // Try looking for any links containing "/product/" in the product area
        if (!productUrl) {
          $product.find('a').each((idx, linkEl) => {
            const href = $(linkEl).attr('href');
            if (href && href.includes('/product/')) {
              productUrl = href;
              $link = $(linkEl);
              return false; // Break
            }
          });
        }

        // Look in broader area around this product element
        if (!productUrl) {
          $product.parent().find('a').each((idx, linkEl) => {
            const href = $(linkEl).attr('href');
            if (href && href.includes('/product/')) {
              productUrl = href;
              $link = $(linkEl);
              return false; // Break
            }
          });
        }

        const fullProductUrl = productUrl ? (productUrl.startsWith('http') ? productUrl : `https://risecannabis.com${productUrl}`) : null;

        // Extract strain name from URL path (e.g., "rythm-bananaconda" from "/product/1897723/rythm-bananaconda/")
        let strainFromUrl = 'Unknown Strain';
        if (productUrl) {
          const urlMatch = productUrl.match(/\/product\/\d+\/([^\/]+)\/?$/);
          if (urlMatch) {
            strainFromUrl = urlMatch[1]
              .replace(/-/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())
              .trim();
          }
        }

        // Extract strain/product name - prefer URL-based strain name, fallback to text extraction
        let productName = strainFromUrl !== 'Unknown Strain' ? strainFromUrl : 'Product Name Not Found';

        // First, try common cannabis strain name selectors
        const nameSelectors = [
          'h1, h2, h3, h4, h5, h6',
          '[class*="name"]',
          '[class*="title"]',
          '[class*="strain"]',
          '[data-testid*="name"]',
          '[class*="product-name"]',
          'span, div, p'
        ];

        for (const selector of nameSelectors) {
          const elements = $product.find(selector);
          elements.each((idx, el) => {
            const text = $(el).text().trim();
            // Look for strain name patterns (typically 2-3 words, not just weight/price)
            if (text &&
                text.length > 3 &&
                text.length < 50 &&
                !text.match(/^\d+g\$\d+/) && // Not just weight/price
                !text.match(/^\$\d+/) && // Not just price
                !text.match(/^\d+g$/) && // Not just weight
                text.match(/^[A-Za-z][A-Za-z\s]+[A-Za-z]$/) && // Letters and spaces only
                text.split(' ').length >= 2) { // At least 2 words
              productName = text;
              return false; // Break out of loop
            }
          });
          if (productName !== 'Product Name Not Found') break;
        }

        // If still not found, look for any text that looks like a strain name in the raw text
        if (productName === 'Product Name Not Found') {
          const strainPatterns = [
            /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, // "Animal Face", "Brownie Scout"
            /([A-Z][a-z]+\s+[A-Z][a-z]+)/g // Two word strain names
          ];

          for (const pattern of strainPatterns) {
            const matches = productText.match(pattern);
            if (matches) {
              // Filter out obvious non-strain matches
              const validStrains = matches.filter(match =>
                !match.includes('Rise') &&
                !match.includes('Cannabis') &&
                !match.includes('Medical') &&
                !match.includes('Menu') &&
                match.length > 5 &&
                match.length < 30
              );
              if (validStrains.length > 0) {
                productName = validStrains[0];
                break;
              }
            }
          }
        }

        // Parse price and weight from text
        const priceMatch = productText.match(/\$([0-9.,]+)/);
        const weightMatch = productText.match(/([0-9.]+g)/);

        // Look for THC percentage
        const thcMatch = productText.match(/(\d+(?:\.\d+)?)\s*%?\s*THC/i) ||
                        productText.match(/THC[:\s]*(\d+(?:\.\d+)?)\s*%/i);

        // Look for terpenes information
        const terpenePatterns = [
          /terpenes?[:\s]*([^,\n]+)/i,
          /dominant terpenes?[:\s]*([^,\n]+)/i,
          /(myrcene|limonene|pinene|caryophyllene|linalool|humulene|terpinolene)/i
        ];
        let terpenes = null;
        for (const pattern of terpenePatterns) {
          const match = productText.match(pattern);
          if (match) {
            terpenes = match[1] || match[0];
            break;
          }
        }

        // Look for additional product details in nested elements
        const details = $product.find('[class*="detail"], [class*="info"], [class*="spec"]').text().trim();
        const thcFromDetails = details.match(/(\d+(?:\.\d+)?)\s*%?\s*THC/i);
        const terpFromDetails = details.match(/terpenes?[:\s]*([^,\n]+)/i);

        const feature = {
          type: 'cannabis-flower',
          productName: productName,
          riseLocation: riseLocation,
          sourceUrl: fullProductUrl || url,
          weight: weightMatch ? weightMatch[1] : null,
          price: priceMatch ? `$${priceMatch[1]}` : null,
          thc: thcMatch ? `${thcMatch[1]}%` : (thcFromDetails ? `${thcFromDetails[1]}%` : null),
          terpenes: terpenes || terpFromDetails?.[1] || null,
          rawText: productText,
          detailsText: details || null,
          source: 'rise-cannabis'
        };

        content.features.push(JSON.stringify(feature));
        console.log(`🌿 Product ${i}: "${productName || 'Unnamed'}" - ${weightMatch?.[1] || 'No weight'} - ${priceMatch ? `$${priceMatch[1]}` : 'No price'} - THC: ${feature.thc || 'Not found'}`);
        console.log(`   Raw text: "${productText.substring(0, 100)}${productText.length > 100 ? '...' : ''}"}`);
      }
    });

    console.log(`🌿 Extracted ${content.features.length} detailed cannabis products from ${riseLocation}`);
  } else {
    // Regular feature extraction for non-cannabis sites
    $('[class*="feature"], [class*="highlight"], .features ul, .highlights ul').find('li').each((i, el) => {
      const feature = $(el).text().trim();
      if (feature && feature.length > 3) {
        content.features.push(feature);
      }
    });
  }

  return content;
}

// Extract product images
function extractProductImages ($, baseUrl) {
  const images = [];
  const imageSelectors = [
    '[class*="product-image"] img',
    '[class*="product-photo"] img',
    '[class*="item-image"] img',
    '.gallery img',
    '.carousel img',
    '[data-testid*="image"] img'
  ];

  const seenUrls = new Set();

  for (const selector of imageSelectors) {
    $(selector).each((i, img) => {
      const $img = $(img);
      let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy');

      if (src && !seenUrls.has(src)) {
        seenUrls.add(src);

        // Convert relative URLs to absolute
        if (src.startsWith('/') && baseUrl) {
          const urlObj = new URL(baseUrl);
          src = `${urlObj.protocol}//${urlObj.host}${src}`;
        }

        images.push({
          url: src,
          alt: $img.attr('alt') || '',
          title: $img.attr('title') || ''
        });
      }
    });

    if (images.length >= 10) break; // Limit to avoid too many images
  }

  return images;
}

// Extract product variants (sizes, colors, etc.)
function extractProductVariants ($) {
  const variants = [];

  // Look for size selectors
  $('[class*="size"] select, [class*="size"] input, [data-testid*="size"] select').each((i, el) => {
    const $el = $(el);
    const options = [];

    if (el.tagName === 'SELECT') {
      $el.find('option').each((j, option) => {
        const value = $(option).val();
        const text = $(option).text().trim();
        if (value && text && value !== '') {
          options.push({ value, text, available: !$(option).prop('disabled') });
        }
      });
    }

    if (options.length > 0) {
      variants.push({
        type: 'size',
        name: $el.attr('name') || 'size',
        options
      });
    }
  });

  // Look for color selectors
  $('[class*="color"] input, [class*="colour"] input, [data-testid*="color"] input').each((i, el) => {
    const $el = $(el);
    const $parent = $el.closest('[class*="color"], [class*="colour"]');

    const colors = [];
    $parent.find('input[type="radio"], input[type="checkbox"]').each((j, input) => {
      const $input = $(input);
      const value = $input.val();
      const label = $input.next('label').text().trim() ||
                         $input.parent().text().trim() ||
                         value;

      if (value) {
        colors.push({
          value,
          text: label,
          available: !$input.prop('disabled')
        });
      }
    });

    if (colors.length > 0) {
      variants.push({
        type: 'color',
        name: 'color',
        options: colors
      });
      return false; // Break after first color variant group
    }
  });

  return variants;
}

// Extract review data
function extractProductReviews ($) {
  const reviews = {
    rating: null,
    count: null,
    summary: ''
  };

  // Rating selectors
  const ratingSelectors = [
    '[class*="rating"] [class*="value"]',
    '[class*="star-rating"]',
    '[data-testid*="rating"]',
    '.rating',
    '[itemprop="ratingValue"]'
  ];

  for (const selector of ratingSelectors) {
    const ratingEl = $(selector).first();
    if (ratingEl.length) {
      const ratingText = ratingEl.text() || ratingEl.attr('content') || ratingEl.attr('data-rating');
      const rating = parseFloat(ratingText);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        reviews.rating = rating;
        break;
      }
    }
  }

  // Review count selectors
  const countSelectors = [
    '[class*="review-count"]',
    '[class*="rating-count"]',
    '[itemprop="reviewCount"]'
  ];

  for (const selector of countSelectors) {
    const countEl = $(selector).first();
    if (countEl.length) {
      const countText = countEl.text() || countEl.attr('content');
      const count = parseInt(countText.replace(/[^\d]/g, ''));
      if (!isNaN(count)) {
        reviews.count = count;
        break;
      }
    }
  }

  return reviews;
}

// Extract structured data (JSON-LD)
function extractStructuredData (html) {
  const structuredData = {};

  // Extract JSON-LD
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      if (data['@type'] === 'Product' ||
                (Array.isArray(data) && data.some(item => item['@type'] === 'Product'))) {
        const productData = Array.isArray(data)
          ? data.find(item => item['@type'] === 'Product')
          : data;
        structuredData.product = productData;
      }
    } catch (e) {
      // Skip invalid JSON-LD
    }
  }

  return structuredData;
}

// Helper functions
function extractPrice (text) {
  if (!text) return null;
  const priceMatch = text.toString().match(/[\d,]+\.?\d*/);
  return priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
}

function extractCurrency (text) {
  if (!text) return '';
  const currencyMatch = text.match(/[$€£¥₹]|USD|EUR|GBP|JPY|INR/);
  return currencyMatch ? currencyMatch[0] : '';
}

function extractBrand ($, structuredData) {
  if (structuredData.product?.brand?.name) {
    return structuredData.product.brand.name;
  }

  const brandSelectors = [
    '[class*="brand"]',
    '[itemprop="brand"]',
    '[data-testid*="brand"]'
  ];

  for (const selector of brandSelectors) {
    const brand = $(selector).first().text().trim();
    if (brand) return brand;
  }

  return null;
}

function extractSKU ($, structuredData) {
  if (structuredData.product?.sku) {
    return structuredData.product.sku;
  }

  const skuSelectors = [
    '[class*="sku"]',
    '[itemprop="sku"]',
    '[data-testid*="sku"]'
  ];

  for (const selector of skuSelectors) {
    const sku = $(selector).first().text().trim();
    if (sku) return sku;
  }

  return null;
}

function extractGTIN ($, structuredData) {
  if (structuredData.product?.gtin) {
    return structuredData.product.gtin;
  }

  // Look for UPC, EAN, ISBN, etc.
  const gtinSelectors = [
    '[class*="upc"]',
    '[class*="ean"]',
    '[class*="gtin"]',
    '[itemprop="gtin"]'
  ];

  for (const selector of gtinSelectors) {
    const gtin = $(selector).first().text().trim();
    if (gtin && /^\d{8,14}$/.test(gtin)) return gtin;
  }

  return null;
}

function extractCategory ($, structuredData) {
  if (structuredData.product?.category) {
    return structuredData.product.category;
  }

  // Look for breadcrumbs or category info
  const categorySelectors = [
    '[class*="breadcrumb"] a',
    '[class*="category"]',
    '[itemprop="category"]'
  ];

  const categories = [];
  for (const selector of categorySelectors) {
    $(selector).each((i, el) => {
      const cat = $(el).text().trim();
      if (cat && !categories.includes(cat)) {
        categories.push(cat);
      }
    });
    if (categories.length > 0) break;
  }

  return categories.length > 0 ? categories : null;
}

function extractProductTags ($) {
  const tags = [];

  $('[class*="tag"], [class*="label"], .badge').each((i, el) => {
    const tag = $(el).text().trim();
    if (tag && tag.length < 50 && !tags.includes(tag)) {
      tags.push(tag);
    }
  });

  return tags;
}

function cleanHtmlToText (html) {
  if (!html) return '';

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Article extraction (for non-product pages)
function extractArticleData (html, $, url) {
  // Use Readability for articles
  try {
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (article) {
      return {
        type: 'article',
        title: article.title,
        headers: extractArticleHeaders(article.content),
        content: {
          body: article.textContent,
          html: article.content,
          excerpt: article.excerpt
        },
        metadata: {
          byline: article.byline,
          siteName: article.siteName,
          length: article.length,
          readingTime: Math.ceil(article.length / 200),
          publishedTime: extractPublishedTime($, html)
        }
      };
    }
  } catch (error) {
    console.error('Article extraction failed:', error);
  }

  return extractGenericData(html, $, url);
}

function extractArticleHeaders (htmlContent) {
  const $ = cheerio.load(htmlContent);
  const headers = [];

  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const level = parseInt(el.tagName.substring(1));

    if (text && text.length > 2) {
      headers.push({
        level,
        text,
        id: $el.attr('id') || null
      });
    }
  });

  return headers;
}

function extractPublishedTime ($, html) {
  // Try various selectors for publication time
  const timeSelectors = [
    'time[datetime]',
    '[property="article:published_time"]',
    '[name="publish_date"]',
    '.published-date',
    '.post-date'
  ];

  for (const selector of timeSelectors) {
    const timeEl = $(selector).first();
    if (timeEl.length) {
      return timeEl.attr('datetime') ||
                   timeEl.attr('content') ||
                   timeEl.text().trim();
    }
  }

  return null;
}

// Generic data extraction
function extractGenericData (html, $, url) {
  return {
    type: 'generic',
    title: $('title').text() || $('h1').first().text() || '',
    headers: extractGenericHeaders($),
    content: {
      body: extractGenericContent($)
    },
    metadata: {
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || ''
    }
  };
}

function extractGenericHeaders ($) {
  const headers = [];

  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const level = parseInt(el.tagName.substring(1));

    if (text && text.length > 2) {
      headers.push({
        level,
        text
      });
    }
  });

  return headers;
}

function extractGenericContent ($) {
  // Remove unwanted elements
  $('script, style, nav, header, footer, aside').remove();

  // Extract main content
  const contentSelectors = [
    'main',
    '[role="main"]',
    '.content',
    '#content',
    'article',
    '.post',
    'body'
  ];

  for (const selector of contentSelectors) {
    const content = $(selector).first();
    if (content.length) {
      return cleanHtmlToText(content.html());
    }
  }

  return '';
}

// Listing data extraction
function extractListingData (html, $, url) {
  return {
    type: 'listing',
    title: $('title').text() || $('h1').first().text() || '',
    headers: extractGenericHeaders($),
    content: {
      body: 'Product listing page detected',
      itemCount: $('[class*="product"], [class*="item"]').length
    },
    metadata: {
      description: $('meta[name="description"]').attr('content') || '',
      listingType: 'product-catalog'
    }
  };
}

module.exports = {
  extractStructuredContent,
  detectContentType,
  extractProductData,
  extractArticleData,
  extractGenericData,
  extractListingData
};
