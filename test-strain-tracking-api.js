// Test the strain tracking API response format
const { createStrainTrackingData } = require('./src/extractors/cannabis-extractor');

// Sample data based on your analysis
const sampleProducts = [
  {
    strain: 'Gogurtz',
    thc: '27.9%',
    weight: null,
    price: null,
    productUrl: null
  },
  {
    strain: 'Runtz S1',
    thc: '24.5%',
    weight: '7g',
    price: '$80.00',
    productUrl: 'https://risecannabis.com/product/runtz-s1'
  },
  {
    strain: 'Animal Face',
    thc: '27.0%',
    weight: null,
    price: null,
    productUrl: null
  }
];

const location = 'Rise Cannabis New Hope, Minnesota';
const sourceUrl = 'https://risecannabis.com/dispensary-menu/new-hope-minnesota/cannabis/flower/?orderby=thc-content';

// Generate the API response structure
const apiResponse = {
  success: true,
  data: createStrainTrackingData(sampleProducts, location, sourceUrl)
};

console.log('🚀 API Response for Strain Tracking App:');
console.log('=====================================');
console.log(JSON.stringify(apiResponse, null, 2));

console.log('\n📋 Key Fields for Your Storage App:');
console.log('- location: Store location');
console.log('- strain: Strain name for tracking');
console.log('- thc: THC percentage for trends');
console.log('- weights[]: Available sizes with $/g');
console.log('- productUrl: Direct link to product');
console.log('- retrievedAt: Timestamp for historical data');

console.log('\n💡 Your tracking app can:');
console.log('✅ Detect new strains (check if strain exists in DB)');
console.log('✅ Track price trends (compare $/g over time)');
console.log('✅ Alert on deals (price drops below average)');
console.log('✅ Monitor THC changes (potency fluctuations)');
console.log('✅ Direct purchase links');