// src/database/cannabis-tracker.js
// In-memory cannabis data storage and historical tracking

/**
 * Simple in-memory database for cannabis product tracking
 * For production, replace with PostgreSQL, MongoDB, or similar
 */
class CannabisTracker {
  constructor() {
    // In-memory storage
    this.strains = new Map(); // strain_id -> strain data
    this.products = new Map(); // product_id -> product data
    this.priceHistory = new Map(); // strain_id -> price history array
    this.availabilityHistory = new Map(); // strain_id -> availability history
    this.dispensaryProfiles = new Map(); // dispensary_id -> dispensary data

    // Indexes for querying
    this.strainsByType = new Map(); // type -> strain_ids[]
    this.strainsByDispensary = new Map(); // dispensary_id -> strain_ids[]
    this.strainsByPotency = new Map(); // potency_range -> strain_ids[]
  }

  /**
     * Save or update cannabis product data
     */
  saveProduct(cannabisData) {
    const timestamp = new Date().toISOString();
    const strainId = this.generateStrainId(cannabisData.strain.name, cannabisData.dispensary.name);
    const productId = this.generateProductId(strainId, cannabisData.product.form, timestamp);

    // Update strain master record
    this.updateStrainRecord(strainId, cannabisData);

    // Save product instance
    this.products.set(productId, {
      ...cannabisData,
      id: productId,
      strain_id: strainId,
      last_updated: timestamp
    });

    // Update price history
    this.updatePriceHistory(strainId, cannabisData.pricing, timestamp);

    // Update availability history
    this.updateAvailabilityHistory(strainId, cannabisData.availability, timestamp);

    // Update indexes
    this.updateIndexes(strainId, cannabisData);

    return {
      strain_id: strainId,
      product_id: productId,
      saved_at: timestamp
    };
  }

  /**
     * Generate unique strain ID
     */
  generateStrainId(strainName, dispensaryName) {
    const normalized = `${strainName}_${dispensaryName}`.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    return normalized;
  }

  /**
     * Generate unique product ID
     */
  generateProductId(strainId, form, timestamp) {
    const date = new Date(timestamp).toISOString().split('T')[0];
    return `${strainId}_${form}_${date}`.replace(/[^a-z0-9_]/g, '_');
  }

  /**
     * Update or create strain master record
     */
  updateStrainRecord(strainId, cannabisData) {
    const existing = this.strains.get(strainId);

    if (existing) {
      // Update existing strain with new data
      const updated = {
        ...existing,
        ...cannabisData.strain,
        last_seen: new Date().toISOString(),
        total_observations: (existing.total_observations || 1) + 1,

        // Track potency variance
        potency_observations: [
          ...(existing.potency_observations || []),
          {
            thc: cannabisData.potency.thc.percentage,
            cbd: cannabisData.potency.cbd.percentage,
            observed_at: new Date().toISOString()
          }
        ]
      };

      this.strains.set(strainId, updated);
    } else {
      // Create new strain record
      const newStrain = {
        id: strainId,
        ...cannabisData.strain,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        total_observations: 1,
        dispensary: cannabisData.dispensary,
        potency_observations: [{
          thc: cannabisData.potency.thc.percentage,
          cbd: cannabisData.potency.cbd.percentage,
          observed_at: new Date().toISOString()
        }]
      };

      this.strains.set(strainId, newStrain);
    }
  }

  /**
     * Update price history
     */
  updatePriceHistory(strainId, pricing, timestamp) {
    if (!this.priceHistory.has(strainId)) {
      this.priceHistory.set(strainId, []);
    }

    const history = this.priceHistory.get(strainId);

    // Only add if price is different from last entry
    const lastEntry = history[history.length - 1];
    if (!lastEntry || lastEntry.price !== pricing.current_price) {
      history.push({
        price: pricing.current_price,
        price_per_gram: pricing.price_per_gram,
        currency: pricing.currency,
        discounted: pricing.discounted_price !== null,
        recorded_at: timestamp
      });

      // Keep only last 100 price points
      if (history.length > 100) {
        history.shift();
      }
    }
  }

  /**
     * Update availability history
     */
  updateAvailabilityHistory(strainId, availability, timestamp) {
    if (!this.availabilityHistory.has(strainId)) {
      this.availabilityHistory.set(strainId, []);
    }

    const history = this.availabilityHistory.get(strainId);

    // Only add if availability status changed
    const lastEntry = history[history.length - 1];
    if (!lastEntry || lastEntry.in_stock !== availability.in_stock) {
      history.push({
        in_stock: availability.in_stock,
        quantity_available: availability.quantity_available,
        stock_level: availability.stock_level,
        recorded_at: timestamp
      });

      // Keep only last 50 availability points
      if (history.length > 50) {
        history.shift();
      }
    }
  }

  /**
     * Update search indexes
     */
  updateIndexes(strainId, cannabisData) {
    // Index by strain type
    const type = cannabisData.strain.type;
    if (type) {
      if (!this.strainsByType.has(type)) {
        this.strainsByType.set(type, new Set());
      }
      this.strainsByType.get(type).add(strainId);
    }

    // Index by dispensary
    const dispensaryId = this.generateDispensaryId(cannabisData.dispensary);
    if (!this.strainsByDispensary.has(dispensaryId)) {
      this.strainsByDispensary.set(dispensaryId, new Set());
    }
    this.strainsByDispensary.get(dispensaryId).add(strainId);

    // Index by THC potency range
    const thc = cannabisData.potency.thc.percentage;
    if (thc !== null) {
      const potencyRange = this.getPotencyRange(thc);
      if (!this.strainsByPotency.has(potencyRange)) {
        this.strainsByPotency.set(potencyRange, new Set());
      }
      this.strainsByPotency.get(potencyRange).add(strainId);
    }
  }

  /**
     * Generate dispensary ID
     */
  generateDispensaryId(dispensary) {
    return `${dispensary.name}_${dispensary.location.state}_${dispensary.location.city}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
  }

  /**
     * Get THC potency range for indexing
     */
  getPotencyRange(thc) {
    if (thc < 15) return 'low';
    if (thc < 25) return 'medium';
    return 'high';
  }

  /**
     * Query methods for historical analysis
     */

  // Get strain by ID
  getStrain(strainId) {
    return this.strains.get(strainId);
  }

  // Get all strains by type
  getStrainsByType(type) {
    const strainIds = this.strainsByType.get(type) || new Set();
    return Array.from(strainIds).map(id => this.strains.get(id));
  }

  // Get price history for a strain
  getPriceHistory(strainId) {
    return this.priceHistory.get(strainId) || [];
  }

  // Get availability history for a strain
  getAvailabilityHistory(strainId) {
    return this.availabilityHistory.get(strainId) || [];
  }

  // Get price trends (last 30 days)
  getPriceTrends(strainId, days = 30) {
    const history = this.getPriceHistory(strainId);
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const recentHistory = history.filter(entry =>
      new Date(entry.recorded_at) >= cutoffDate
    );

    if (recentHistory.length < 2) {
      return { trend: 'insufficient_data' };
    }

    const firstPrice = recentHistory[0].price;
    const lastPrice = recentHistory[recentHistory.length - 1].price;
    const change = lastPrice - firstPrice;
    const percentChange = (change / firstPrice) * 100;

    return {
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
      price_change: change,
      percent_change: percentChange.toFixed(2),
      current_price: lastPrice,
      data_points: recentHistory.length
    };
  }

  // Get all tracked strains with basic info
  getAllStrains() {
    return Array.from(this.strains.values()).map(strain => ({
      id: strain.id,
      name: strain.name,
      type: strain.type,
      dispensary: strain.dispensary.name,
      first_seen: strain.first_seen,
      last_seen: strain.last_seen,
      observations: strain.total_observations
    }));
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const totalStrains = this.strains.size;
    const totalProducts = this.products.size;

    const strainTypes = {};
    for (const [type, strainIds] of this.strainsByType.entries()) {
      strainTypes[type] = strainIds.size;
    }

    const dispensaries = {};
    for (const [dispensaryId, strainIds] of this.strainsByDispensary.entries()) {
      dispensaries[dispensaryId] = strainIds.size;
    }

    return {
      summary: {
        total_strains: totalStrains,
        total_products: totalProducts,
        total_price_points: Array.from(this.priceHistory.values())
          .reduce((sum, history) => sum + history.length, 0)
      },
      by_type: strainTypes,
      by_dispensary: Object.keys(dispensaries).length,
      tracking_since: this.getEarliestDate()
    };
  }

  /**
     * Get earliest tracking date
     */
  getEarliestDate() {
    let earliest = null;
    for (const strain of this.strains.values()) {
      if (!earliest || strain.first_seen < earliest) {
        earliest = strain.first_seen;
      }
    }
    return earliest;
  }

  /**
     * Export data for backup/analysis
     */
  exportData() {
    return {
      strains: Object.fromEntries(this.strains),
      products: Object.fromEntries(this.products),
      price_history: Object.fromEntries(this.priceHistory),
      availability_history: Object.fromEntries(this.availabilityHistory),
      exported_at: new Date().toISOString()
    };
  }

  /**
     * Search strains by criteria
     */
  searchStrains(criteria) {
    let results = Array.from(this.strains.values());

    // Filter by name
    if (criteria.name) {
      const nameQuery = criteria.name.toLowerCase();
      results = results.filter(strain =>
        strain.name.toLowerCase().includes(nameQuery)
      );
    }

    // Filter by type
    if (criteria.type) {
      results = results.filter(strain =>
        strain.type === criteria.type.toLowerCase()
      );
    }

    // Filter by THC range
    if (criteria.thc_min !== undefined || criteria.thc_max !== undefined) {
      results = results.filter(strain => {
        const lastObservation = strain.potency_observations[strain.potency_observations.length - 1];
        if (!lastObservation || lastObservation.thc === null) return false;

        const thc = lastObservation.thc;
        if (criteria.thc_min !== undefined && thc < criteria.thc_min) return false;
        if (criteria.thc_max !== undefined && thc > criteria.thc_max) return false;
        return true;
      });
    }

    // Filter by dispensary
    if (criteria.dispensary) {
      const dispensaryQuery = criteria.dispensary.toLowerCase();
      results = results.filter(strain =>
        strain.dispensary.name.toLowerCase().includes(dispensaryQuery)
      );
    }

    return results.map(strain => ({
      id: strain.id,
      name: strain.name,
      type: strain.type,
      dispensary: strain.dispensary.name,
      latest_thc: strain.potency_observations[strain.potency_observations.length - 1]?.thc,
      observations: strain.total_observations,
      last_seen: strain.last_seen
    }));
  }
}

// Create global instance
const cannabisTracker = new CannabisTracker();

module.exports = {
  CannabisTracker,
  cannabisTracker
};
