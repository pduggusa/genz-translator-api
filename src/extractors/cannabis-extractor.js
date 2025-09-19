// src/extractors/cannabis-extractor.js
// Specialized Cannabis Product Data Extractor for Strain Tracking & Historical Analysis

const cheerio = require('cheerio');

/**
 * Enhanced Cannabis Product Data Structure for Historical Tracking
 */
function createCannabisDataStructure() {
  return {
    // Core product identification
    strain: {
      name: '',
      type: '', // indica, sativa, hybrid
      genetics: [], // parent strains
      breeder: '',
      aliases: [] // alternative names
    },

    // Potency and chemical profile
    potency: {
      thc: {
        percentage: null,
        mg: null,
        range: { min: null, max: null }
      },
      cbd: {
        percentage: null,
        mg: null,
        range: { min: null, max: null }
      },
      cbg: { percentage: null },
      cbn: { percentage: null },
      thca: { percentage: null },
      cbda: { percentage: null },
      terpenes: {
        dominant: [],
        profile: {} // terpene_name: percentage
      }
    },

    // Product details
    product: {
      form: '', // flower, concentrate, edible, cartridge, etc.
      weight: '',
      packaging: '',
      batch: '',
      harvest_date: '',
      test_date: '',
      lab: ''
    },

    // Pricing for historical tracking
    pricing: {
      current_price: null,
      price_per_gram: null,
      price_per_ounce: null,
      currency: 'USD',
      discounted_price: null,
      discount_percentage: null,
      bulk_pricing: [], // [{quantity, price, unit}]
      membership_price: null
    },

    // Availability and inventory
    availability: {
      in_stock: null,
      quantity_available: null,
      stock_level: '', // low, medium, high
      last_restocked: '',
      estimated_restock: ''
    },

    // Dispensary and location context
    dispensary: {
      name: '',
      location: {
        state: '',
        city: '',
        address: ''
      },
      license_type: '', // medical, recreational, both
      menu_type: '' // medical, recreational
    },

    // Effects and user data
    effects: {
      reported_effects: [],
      medical_uses: [],
      flavors: [],
      aromas: []
    },

    // Reviews and ratings
    reviews: {
      rating: null,
      review_count: null,
      top_effects: [],
      helps_with: [] // medical conditions
    },

    // Temporal tracking data
    tracking: {
      first_seen: '',
      last_updated: '',
      price_history: [], // [{date, price, source}]
      availability_history: [], // [{date, in_stock, quantity}]
      potency_variance: {}, // track if potency changes across batches
      source_url: '',
      extraction_timestamp: ''
    }
  };
}

/**
 * Detect if a page contains cannabis products
 */
function isCannabisContent(html, $) {
  const cannabisIndicators = [
    // Cannabis-specific terms in content
    /\b(?:thc|cbd|indica|sativa|hybrid|strain|cannabis|marijuana|dispensary|budtender)\b/i,

    // Cannabis product forms
    /\b(?:flower|bud|concentrate|shatter|wax|live resin|rosin|cartridge|edible|gummy|tincture|pre-roll|joint)\b/i,

    // Potency indicators
    /\b(?:\d+(?:\.\d+)?%?\s*(?:thc|cbd)|mg\s*(?:thc|cbd))\b/i,

    // Cannabis-specific selectors
    /class=["'][^"']*(?:strain|cannabis|thc|cbd|indica|sativa|hybrid)[^"']*["']/i,

    // Age verification specifically for cannabis
    /\b(?:21|eighteen|18)\+?\s*(?:years?\s*old|or\s*older).*(?:cannabis|marijuana|dispensary)/i,

    // Cannabis business terms
    /\b(?:medical\s*(?:marijuana|cannabis)|rec(?:reational)?|mmj|dispensary|budtender)\b/i
  ];

  return cannabisIndicators.some(pattern => pattern.test(html));
}

/**
 * Extract comprehensive cannabis product data
 */
function extractCannabisData(html, $, url) {
  const data = createCannabisDataStructure();

  // Set extraction metadata
  data.tracking.extraction_timestamp = new Date().toISOString();
  data.tracking.source_url = url;
  data.tracking.first_seen = new Date().toISOString();
  data.tracking.last_updated = new Date().toISOString();

  // Extract dispensary information
  extractDispensaryInfo($, data, url);

  // Extract strain information
  extractStrainInfo($, data, html);

  // Extract potency data
  extractPotencyData($, data, html);

  // Extract product details
  extractProductDetails($, data);

  // Extract pricing information
  extractPricingInfo($, data);

  // Extract availability
  extractAvailabilityInfo($, data);

  // Extract effects and reviews
  extractEffectsAndReviews($, data);

  return data;
}

/**
 * Extract dispensary and location information
 */
function extractDispensaryInfo($, data, url) {
  // Extract from URL
  if (url) {
    const urlMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    if (urlMatch) {
      const domain = urlMatch[1];

      // Common dispensary domains
      const dispensaryMappings = {
        'risecannabis.com': 'RISE Cannabis',
        'curaleaf.com': 'Curaleaf',
        'trulieve.com': 'Trulieve',
        'greendot.com': 'Green Dot',
        'cresco.com': 'Cresco'
      };

      data.dispensary.name = dispensaryMappings[domain] || domain;
    }

    // Extract state from URL
    const stateMatch = url.match(/\/(?:dispensaries?\/)?([a-z]{2}|[a-z-]+)(?:\/|$)/i);
    if (stateMatch) {
      data.dispensary.location.state = stateMatch[1];
    }

    // Extract city
    const cityMatch = url.match(/\/(?:dispensaries?\/[^\/]+\/)([a-z-]+)(?:\/|$)/i);
    if (cityMatch) {
      data.dispensary.location.city = cityMatch[1].replace(/-/g, ' ');
    }
  }

  // Extract from page content
  const dispensarySelectors = [
    'h1[class*="dispensary"], h1[class*="store"]',
    '[class*="dispensary-name"], [class*="store-name"]',
    '[class*="location"] h1, [class*="location"] h2',
    'title'
  ];

  for (const selector of dispensarySelectors) {
    let name = '';
    if (selector === 'title') {
      name = $('title').text();
    } else {
      name = $(selector).first().text().trim();
    }

    if (name && name.length > 2) {
      // Clean dispensary name
      name = name.replace(/\s*(?:menu|dispensary|cannabis|marijuana)\s*/gi, '').trim();
      if (name && !data.dispensary.name) {
        data.dispensary.name = name;
      }
      break;
    }
  }

  // Determine menu type from content
  const menuType = $('body').text().toLowerCase();
  if (menuType.includes('medical') && menuType.includes('recreational')) {
    data.dispensary.license_type = 'both';
  } else if (menuType.includes('medical')) {
    data.dispensary.license_type = 'medical';
  } else if (menuType.includes('recreational') || menuType.includes('adult-use')) {
    data.dispensary.license_type = 'recreational';
  }
}

/**
 * Extract strain information
 */
function extractStrainInfo($, data, html) {
  // Extract strain names from product listings
  const strainSelectors = [
    '[class*="strain"] h1, [class*="strain"] h2, [class*="strain"] h3',
    '[class*="product-name"], [class*="item-name"]',
    '[class*="title"]',
    'h1, h2, h3'
  ];

  const strainPatterns = [
    // Match strain names with common indicators
    /(?:strain|variety)[:]\s*([A-Za-z0-9\s'#-]+)/gi,

    // Product names that look like strains
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+#?\d+)?)\b/g,

    // Look for strain type indicators
    /(.*?)\s*(?:\(|\s-\s)(?:indica|sativa|hybrid)/gi
  ];

  const foundStrains = new Set();

  for (const selector of strainSelectors) {
    $(selector).each((i, el) => {
      const text = $(el).text().trim();

      // Try each pattern
      for (const pattern of strainPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const strainName = match[1] || match[0];
          if (strainName && strainName.length > 2 && strainName.length < 50) {
            foundStrains.add(strainName.trim());
          }
        }
      }
    });
  }

  // Extract strain type (indica/sativa/hybrid)
  const typePatterns = [
    /\b(indica|sativa|hybrid)\b/gi,
    /type[:]\s*(indica|sativa|hybrid)/gi
  ];

  for (const pattern of typePatterns) {
    const match = html.match(pattern);
    if (match) {
      data.strain.type = match[1].toLowerCase();
      break;
    }
  }

  // Set the most likely strain name
  if (foundStrains.size > 0) {
    data.strain.name = Array.from(foundStrains)[0];
    data.strain.aliases = Array.from(foundStrains).slice(1);
  }
}

/**
 * Extract potency data (THC, CBD, terpenes)
 */
function extractPotencyData($, data, html) {
  // THC extraction patterns
  const thcPatterns = [
    /thc[:\s]*(\d+(?:\.\d+)?)%/gi,
    /(\d+(?:\.\d+)?)%?\s*thc/gi,
    /total\s*thc[:\s]*(\d+(?:\.\d+)?)%/gi,
    /thc[:\s]*(\d+(?:\.\d+)?)\s*mg/gi
  ];

  // CBD extraction patterns
  const cbdPatterns = [
    /cbd[:\s]*(\d+(?:\.\d+)?)%/gi,
    /(\d+(?:\.\d+)?)%?\s*cbd/gi,
    /total\s*cbd[:\s]*(\d+(?:\.\d+)?)%/gi,
    /cbd[:\s]*(\d+(?:\.\d+)?)\s*mg/gi
  ];

  // Extract THC
  for (const pattern of thcPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value <= 100) {
        if (pattern.toString().includes('mg')) {
          data.potency.thc.mg = value;
        } else {
          data.potency.thc.percentage = value;
        }
        break;
      }
    }
  }

  // Extract CBD
  for (const pattern of cbdPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value <= 100) {
        if (pattern.toString().includes('mg')) {
          data.potency.cbd.mg = value;
        } else {
          data.potency.cbd.percentage = value;
        }
        break;
      }
    }
  }

  // Extract other cannabinoids
  const cannabinoidPatterns = {
    cbg: /cbg[:\s]*(\d+(?:\.\d+)?)%/gi,
    cbn: /cbn[:\s]*(\d+(?:\.\d+)?)%/gi,
    thca: /thca[:\s]*(\d+(?:\.\d+)?)%/gi,
    cbda: /cbda[:\s]*(\d+(?:\.\d+)?)%/gi
  };

  for (const [cannabinoid, pattern] of Object.entries(cannabinoidPatterns)) {
    const match = html.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        data.potency[cannabinoid].percentage = value;
      }
    }
  }

  // Extract terpenes
  const terpeneNames = [
    'limonene', 'myrcene', 'pinene', 'linalool', 'caryophyllene',
    'humulene', 'terpinolene', 'ocimene', 'bisabolol', 'camphene'
  ];

  for (const terpene of terpeneNames) {
    const pattern = new RegExp(`${terpene}[:\\s]*(\\d+(?:\\.\\d+)?)%`, 'gi');
    const match = html.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        data.potency.terpenes.profile[terpene] = value;
      }
    }
  }

  // Determine dominant terpenes (top 3)
  const terpeneEntries = Object.entries(data.potency.terpenes.profile);
  if (terpeneEntries.length > 0) {
    data.potency.terpenes.dominant = terpeneEntries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
  }
}

/**
 * Extract product details
 */
function extractProductDetails($, data) {
  // Product form detection
  const formPatterns = [
    /\b(flower|bud|pre-roll|joint|blunt)\b/i,
    /\b(concentrate|shatter|wax|live resin|rosin|hash|kief)\b/i,
    /\b(cartridge|vape|pen|cart)\b/i,
    /\b(edible|gummy|chocolate|cookie|brownie|candy)\b/i,
    /\b(tincture|oil|capsule|pill)\b/i
  ];

  const pageText = $('body').text().toLowerCase();
  for (const pattern of formPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      data.product.form = match[1].toLowerCase();
      break;
    }
  }

  // Weight extraction
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*(g|gram|grams|oz|ounce|ounces|lb|pound|pounds)/gi,
    /weight[:\s]*(\d+(?:\.\d+)?)\s*(g|gram|oz|ounce)/gi,
    /size[:\s]*(\d+(?:\.\d+)?)\s*(g|gram|oz|ounce)/gi
  ];

  for (const pattern of weightPatterns) {
    const match = $('body').text().match(pattern);
    if (match) {
      data.product.weight = `${match[1]}${match[2]}`;
      break;
    }
  }

  // Extract batch information
  const batchSelectors = [
    '[class*="batch"], [id*="batch"]',
    '[class*="lot"], [id*="lot"]'
  ];

  for (const selector of batchSelectors) {
    const batch = $(selector).text().trim();
    if (batch) {
      data.product.batch = batch;
      break;
    }
  }
}

/**
 * Extract pricing information for historical tracking
 */
function extractPricingInfo($, data) {
  // Price selectors specific to cannabis sites
  const priceSelectors = [
    '[class*="price"]:not([class*="original"]):not([class*="was"])',
    '[data-testid*="price"]',
    '.price-current, .current-price',
    '.sale-price',
    '[class*="cost"]'
  ];

  // Extract current price
  for (const selector of priceSelectors) {
    const priceEl = $(selector).first();
    if (priceEl.length) {
      const priceText = priceEl.text().trim();
      const price = extractPrice(priceText);
      if (price) {
        data.pricing.current_price = price;
        data.pricing.currency = extractCurrency(priceText) || 'USD';
        break;
      }
    }
  }

  // Calculate price per gram if weight is known
  if (data.pricing.current_price && data.product.weight) {
    const weightInGrams = convertToGrams(data.product.weight);
    if (weightInGrams) {
      data.pricing.price_per_gram = (data.pricing.current_price / weightInGrams).toFixed(2);
      data.pricing.price_per_ounce = (data.pricing.price_per_gram * 28.35).toFixed(2);
    }
  }

  // Look for bulk pricing
  $('[class*="bulk"], [class*="quantity"]').each((i, el) => {
    const text = $(el).text();
    const bulkMatch = text.match(/(\d+)\s*(?:g|gram|oz|ounce).*?\$(\d+(?:\.\d+)?)/i);
    if (bulkMatch) {
      data.pricing.bulk_pricing.push({
        quantity: bulkMatch[1],
        price: parseFloat(bulkMatch[2]),
        unit: text.includes('oz') ? 'oz' : 'g'
      });
    }
  });
}

/**
 * Extract availability information
 */
function extractAvailabilityInfo($, data) {
  // Stock indicators
  const stockSelectors = [
    '[class*="stock"], [class*="inventory"]',
    '[class*="available"], [class*="in-stock"]',
    '[class*="quantity"]'
  ];

  for (const selector of stockSelectors) {
    const stockEl = $(selector).first();
    if (stockEl.length) {
      const stockText = stockEl.text().toLowerCase();

      if (stockText.includes('out of stock') || stockText.includes('sold out')) {
        data.availability.in_stock = false;
      } else if (stockText.includes('in stock') || stockText.includes('available')) {
        data.availability.in_stock = true;
      }

      // Extract quantity if available
      const quantityMatch = stockText.match(/(\d+)\s*(?:left|available|in stock)/);
      if (quantityMatch) {
        data.availability.quantity_available = parseInt(quantityMatch[1]);

        // Determine stock level
        if (data.availability.quantity_available <= 3) {
          data.availability.stock_level = 'low';
        } else if (data.availability.quantity_available <= 10) {
          data.availability.stock_level = 'medium';
        } else {
          data.availability.stock_level = 'high';
        }
      }
    }
  }
}

/**
 * Extract effects and reviews
 */
function extractEffectsAndReviews($, data) {
  // Common cannabis effects
  const effectTerms = [
    'relaxing', 'euphoric', 'uplifting', 'energizing', 'calming', 'creative',
    'focused', 'happy', 'sleepy', 'hungry', 'giggly', 'talkative'
  ];

  const pageText = $('body').text().toLowerCase();
  for (const effect of effectTerms) {
    if (pageText.includes(effect)) {
      data.effects.reported_effects.push(effect);
    }
  }

  // Extract ratings
  const ratingSelectors = [
    '[class*="rating"] [class*="value"]',
    '[class*="star"]',
    '[data-testid*="rating"]'
  ];

  for (const selector of ratingSelectors) {
    const ratingEl = $(selector).first();
    if (ratingEl.length) {
      const ratingText = ratingEl.text() || ratingEl.attr('data-rating');
      const rating = parseFloat(ratingText);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        data.reviews.rating = rating;
        break;
      }
    }
  }
}

// Helper functions
function extractPrice(text) {
  if (!text) return null;
  const priceMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  return priceMatch ? parseFloat(priceMatch[1]) : null;
}

function extractCurrency(text) {
  if (!text) return 'USD';
  const currencyMatch = text.match(/[$€£¥₹]|USD|EUR|GBP|JPY|INR/);
  return currencyMatch ? currencyMatch[0] : 'USD';
}

function convertToGrams(weightStr) {
  if (!weightStr) return null;

  const match = weightStr.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|oz|ounce|ounces)/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith('g')) {
    return value;
  } else if (unit.startsWith('oz') || unit.startsWith('ounce')) {
    return value * 28.35; // Convert oz to grams
  }

  return null;
}

module.exports = {
  isCannabisContent,
  extractCannabisData,
  createCannabisDataStructure
};
