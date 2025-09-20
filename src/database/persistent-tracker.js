// src/database/persistent-tracker.js
// File-based persistence layer for cannabis tracking data
// Can be migrated to database later

const fs = require('fs').promises;
const path = require('path');

class PersistentCannabisTracker {
  constructor (dataDir = './data') {
    this.dataDir = dataDir;
    this.strainsFile = path.join(dataDir, 'strains.json');
    this.priceHistoryFile = path.join(dataDir, 'price_history.json');
    this.availabilityFile = path.join(dataDir, 'availability.json');
    this.dispensariesFile = path.join(dataDir, 'dispensaries.json');
    this.aggregationHistoryFile = path.join(dataDir, 'aggregation_runs.json');

    // In-memory cache for performance
    this.cache = {
      strains: new Map(),
      priceHistory: new Map(),
      availability: new Map(),
      dispensaries: new Map(),
      aggregationRuns: []
    };

    this.initializeStorage();
  }

  async initializeStorage () {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });

      // Load existing data into cache
      await this.loadFromDisk();

      console.log('📦 Persistent cannabis tracker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize persistent storage:', error.message);
    }
  }

  async loadFromDisk () {
    const files = [
      { file: this.strainsFile, cache: 'strains', isMap: true },
      { file: this.priceHistoryFile, cache: 'priceHistory', isMap: true },
      { file: this.availabilityFile, cache: 'availability', isMap: true },
      { file: this.dispensariesFile, cache: 'dispensaries', isMap: true },
      { file: this.aggregationHistoryFile, cache: 'aggregationRuns', isMap: false }
    ];

    for (const { file, cache, isMap } of files) {
      try {
        const data = await fs.readFile(file, 'utf8');
        const parsed = JSON.parse(data);

        if (isMap) {
          this.cache[cache] = new Map(Object.entries(parsed));
        } else {
          this.cache[cache] = parsed;
        }
      } catch (error) {
        // File doesn't exist or is empty - initialize empty
        if (isMap) {
          this.cache[cache] = new Map();
        } else {
          this.cache[cache] = [];
        }
      }
    }
  }

  async saveToDisk () {
    try {
      const saves = [
        { file: this.strainsFile, data: Object.fromEntries(this.cache.strains) },
        { file: this.priceHistoryFile, data: Object.fromEntries(this.cache.priceHistory) },
        { file: this.availabilityFile, data: Object.fromEntries(this.cache.availability) },
        { file: this.dispensariesFile, data: Object.fromEntries(this.cache.dispensaries) },
        { file: this.aggregationHistoryFile, data: this.cache.aggregationRuns }
      ];

      await Promise.all(saves.map(({ file, data }) =>
        fs.writeFile(file, JSON.stringify(data, null, 2))
      ));
    } catch (error) {
      console.error('❌ Failed to save to disk:', error.message);
    }
  }

  // Save individual strain/product data
  async saveStrain (strainData) {
    const timestamp = new Date().toISOString();
    const strainId = this.generateStrainId(strainData.strain.name, strainData.dispensary.name);

    // Update strain cache
    const existingStrain = this.cache.strains.get(strainId) || {
      strain_id: strainId,
      first_seen: timestamp,
      snapshots: []
    };

    // Add new snapshot
    const snapshot = {
      timestamp,
      ...strainData,
      snapshot_id: `${strainId}_${Date.now()}`
    };

    existingStrain.last_updated = timestamp;
    existingStrain.snapshots.push(snapshot);

    // Keep only last 100 snapshots per strain
    if (existingStrain.snapshots.length > 100) {
      existingStrain.snapshots = existingStrain.snapshots.slice(-100);
    }

    this.cache.strains.set(strainId, existingStrain);

    // Update price history if price exists
    if (strainData.pricing?.current_price) {
      this.updatePriceHistory(strainId, strainData.pricing.current_price, timestamp);
    }

    // Update availability history
    this.updateAvailabilityHistory(strainId, strainData.availability?.in_stock || true, timestamp);

    // Save to disk
    await this.saveToDisk();

    return { strain_id: strainId, snapshot_id: snapshot.snapshot_id };
  }

  updatePriceHistory (strainId, price, timestamp) {
    const history = this.cache.priceHistory.get(strainId) || [];
    history.push({ price, timestamp });

    // Keep only last 1000 price points
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.cache.priceHistory.set(strainId, history);
  }

  updateAvailabilityHistory (strainId, inStock, timestamp) {
    const history = this.cache.availability.get(strainId) || [];

    // Only add if availability changed
    const lastEntry = history[history.length - 1];
    if (!lastEntry || lastEntry.in_stock !== inStock) {
      history.push({ in_stock: inStock, timestamp });

      // Keep only last 500 availability changes
      if (history.length > 500) {
        history.splice(0, history.length - 500);
      }

      this.cache.availability.set(strainId, history);
    }
  }

  // Save aggregation run results for historical tracking
  async saveAggregationRun (aggregationData) {
    const timestamp = new Date().toISOString();
    const runId = `run_${Date.now()}`;

    const aggregationRun = {
      run_id: runId,
      timestamp,
      summary: aggregationData.summary,
      analytics: aggregationData.analytics,
      dispensaries_processed: aggregationData.results.map(r => ({
        name: r.dispensary,
        url: r.url,
        success: r.success,
        processing_time: r.processingTime
      }))
    };

    this.cache.aggregationRuns.push(aggregationRun);

    // Keep only last 100 aggregation runs
    if (this.cache.aggregationRuns.length > 100) {
      this.cache.aggregationRuns = this.cache.aggregationRuns.slice(-100);
    }

    await this.saveToDisk();
    return runId;
  }

  // Query methods for analytics
  getStrainHistory (strainId) {
    return this.cache.strains.get(strainId) || null;
  }

  getPriceHistory (strainId, days = 30) {
    const history = this.cache.priceHistory.get(strainId) || [];
    const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    return history.filter(entry => new Date(entry.timestamp) > cutoff);
  }

  getMarketTrends (days = 30) {
    const trends = {
      price_changes: [],
      availability_changes: [],
      new_strains: [],
      potency_trends: []
    };

    const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    // Analyze each strain for trends
    for (const [strainId, strainData] of this.cache.strains) {
      const recentSnapshots = strainData.snapshots.filter(
        s => new Date(s.timestamp) > cutoff
      );

      if (recentSnapshots.length < 2) continue;

      const oldest = recentSnapshots[0];
      const newest = recentSnapshots[recentSnapshots.length - 1];

      // Price trend analysis
      if (oldest.pricing?.current_price && newest.pricing?.current_price) {
        const priceChange = newest.pricing.current_price - oldest.pricing.current_price;
        const percentChange = (priceChange / oldest.pricing.current_price) * 100;

        trends.price_changes.push({
          strain_id: strainId,
          strain_name: newest.strain.name,
          dispensary: newest.dispensary.name,
          old_price: oldest.pricing.current_price,
          new_price: newest.pricing.current_price,
          change: priceChange,
          percent_change: percentChange.toFixed(2)
        });
      }

      // Potency trend analysis
      if (oldest.potency?.thc?.percentage && newest.potency?.thc?.percentage) {
        const thcChange = newest.potency.thc.percentage - oldest.potency.thc.percentage;

        trends.potency_trends.push({
          strain_id: strainId,
          strain_name: newest.strain.name,
          dispensary: newest.dispensary.name,
          old_thc: oldest.potency.thc.percentage,
          new_thc: newest.potency.thc.percentage,
          thc_change: thcChange
        });
      }
    }

    return trends;
  }

  getAggregationHistory (limit = 10) {
    return this.cache.aggregationRuns.slice(-limit).reverse();
  }

  generateStrainId (strainName, dispensaryName) {
    const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${clean(strainName)}_${clean(dispensaryName)}`;
  }

  // Export all data for backup/migration
  exportAllData () {
    return {
      strains: Object.fromEntries(this.cache.strains),
      price_history: Object.fromEntries(this.cache.priceHistory),
      availability: Object.fromEntries(this.cache.availability),
      dispensaries: Object.fromEntries(this.cache.dispensaries),
      aggregation_runs: this.cache.aggregationRuns,
      export_timestamp: new Date().toISOString(),
      total_strains: this.cache.strains.size,
      total_aggregation_runs: this.cache.aggregationRuns.length
    };
  }

  // Get storage statistics
  getStorageStats () {
    return {
      total_strains: this.cache.strains.size,
      total_price_points: Array.from(this.cache.priceHistory.values()).reduce((sum, arr) => sum + arr.length, 0),
      total_availability_changes: Array.from(this.cache.availability.values()).reduce((sum, arr) => sum + arr.length, 0),
      total_aggregation_runs: this.cache.aggregationRuns.length,
      data_directory: this.dataDir,
      last_updated: new Date().toISOString()
    };
  }
}

module.exports = { PersistentCannabisTracker };
