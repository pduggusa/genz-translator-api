// Enhanced Analysis: Rise Cannabis THC Rankings with Price and Weight Data
const fs = require('fs');

// Enhanced product data with weight and price when available
// Sample with real pricing data from copy-paste
const products = [
  { vendor: 'RYTHM', strain: 'Afternoon Delight #4', type: 'Premium Flower', thc: 21.6, cbd: 0.05, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Animal Face', type: 'Premium Flower', thc: 23.6, cbd: 0.07, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Animal Face', type: 'Mini Buds', thc: 27.0, cbd: 0.05, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Bananaconda', type: 'Premium Flower', thc: 25.5, cbd: 0.06, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Bananaconda', type: 'Mini Buds', thc: 24.8, cbd: 0.09, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Brownie Scout', type: 'Premium Flower', thc: 23.8, cbd: 0.06, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Brownie Scout', type: 'Mini Buds', thc: 25.2, cbd: 0.06, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Durban Z', type: 'Premium Flower', thc: 23.2, cbd: 0.06, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'Gogurtz', type: 'Premium Flower', thc: 27.9, cbd: 0.06, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'LA Kush Cake', type: 'Mini Buds', thc: 22.1, cbd: 0.04, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'LA Kush Cake', type: 'Premium Flower', thc: 18.7, cbd: 0.03, weight: null, price: null },
  // Sample with complete pricing data from your copy-paste
  { vendor: 'RYTHM', strain: 'Runtz S1', type: 'Mini Buds', thc: 24.5, cbd: 0.04, weight: '7g', price: '$80.00' },
  { vendor: 'RYTHM', strain: 'Runtz S1', type: 'Premium Flower', thc: 24.5, cbd: 0.04, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'VelcroZ', type: 'Mini Buds', thc: 23.9, cbd: 0.07, weight: null, price: null },
  { vendor: 'RYTHM', strain: 'VelcroZ', type: 'Premium Flower', thc: 20.0, cbd: 0.04, weight: null, price: null },
  { vendor: 'Good Green', strain: 'Apple Cobbler', type: 'Flower', thc: 20.4, cbd: 0.05, weight: null, price: null },
  { vendor: 'Good Green', strain: 'Baklava', type: 'Flower', thc: 19.1, cbd: 0.03, weight: null, price: null },
  { vendor: 'Good Green', strain: 'Banana Cream', type: 'Flower', thc: 20.8, cbd: 0.04, weight: null, price: null },
  { vendor: 'Good Green', strain: 'Beaver Cookies', type: 'Flower', thc: 20.9, cbd: 0.04, weight: null, price: null },
  { vendor: 'Good Green', strain: 'Black Maple', type: 'Flower', thc: 19.9, cbd: 0.05, weight: null, price: null },
  { vendor: 'Good Green', strain: 'Chem \'n Cookies', type: 'Flower', thc: 23.6, cbd: 0.05, weight: null, price: null }
];

// Function to parse weight from various formats
function parseWeight(weightStr) {
  if (!weightStr) return null;
  const match = weightStr.match(/(\d+(?:\.\d+)?)g?/);
  return match ? parseFloat(match[1]) : null;
}

// Function to parse price from various formats
function parsePrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.match(/\$?(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

// Enhanced analysis with price and weight calculations
function analyzeProducts(products) {
  const productsWithCalcs = products.map(product => {
    const enhanced = { ...product };

    // Calculate price per gram if both weight and price are available
    if (product.weight && product.price) {
      const weight = parseWeight(product.weight);
      const price = parsePrice(product.price);
      if (weight && price) {
        enhanced.pricePerGram = (price / weight).toFixed(2);
        enhanced.thcPerDollar = (product.thc / price).toFixed(3);
        enhanced.thcMgPerDollar = ((product.thc * weight * 10) / price).toFixed(1); // mg THC per dollar
      }
    }

    return enhanced;
  });

  return productsWithCalcs;
}

// Sort by THC descending
const sortedByTHC = products.sort((a, b) => b.thc - a.thc);
const enhancedProducts = analyzeProducts(sortedByTHC);

console.log('🏆 COMPLETE THC RANKING - RISE CANNABIS NEW HOPE');
console.log('=' .repeat(70));

enhancedProducts.forEach((product, index) => {
  const rank = index + 1;
  const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';

  console.log(`${emoji} ${rank.toString().padStart(2)}. ${product.vendor} ${product.strain} (${product.type})`);
  console.log(`      THC: ${product.thc}% | CBD: ${product.cbd}%`);

  if (product.weight && product.price) {
    console.log(`      Weight: ${product.weight} | Price: ${product.price}`);
    if (product.pricePerGram) {
      console.log(`      💰 $${product.pricePerGram}/g | 🧪 ${product.thcPerDollar} THC%/$ | 📊 ${product.thcMgPerDollar}mg THC/$`);
    }
  } else {
    console.log(`      Weight: N/A | Price: N/A`);
  }
  console.log('');
});

// Summary stats
const highestTHC = enhancedProducts[0];
const rythmProducts = products.filter(p => p.vendor === 'RYTHM');
const goodGreenProducts = products.filter(p => p.vendor === 'Good Green');

console.log('📊 SUMMARY STATISTICS');
console.log('=' .repeat(50));
console.log(`Total products: ${products.length}`);
console.log(`RYTHM products: ${rythmProducts.length}`);
console.log(`Good Green products: ${goodGreenProducts.length}`);
console.log(`Highest THC: ${highestTHC.vendor} ${highestTHC.strain} (${highestTHC.thc}%)`);
console.log(`Average THC: ${(products.reduce((sum, p) => sum + p.thc, 0) / products.length).toFixed(1)}%`);
console.log(`THC Range: ${Math.min(...products.map(p => p.thc))}% - ${Math.max(...products.map(p => p.thc))}%`);

// Price analysis (if data available)
const productsWithPricing = enhancedProducts.filter(p => p.pricePerGram);
if (productsWithPricing.length > 0) {
  console.log('\n💰 PRICE ANALYSIS');
  console.log('=' .repeat(40));

  const bestValue = productsWithPricing.reduce((best, current) =>
    parseFloat(current.thcPerDollar) > parseFloat(best.thcPerDollar) ? current : best
  );

  const cheapestPerGram = productsWithPricing.reduce((cheapest, current) =>
    parseFloat(current.pricePerGram) < parseFloat(cheapest.pricePerGram) ? current : cheapest
  );

  console.log(`Best THC value: ${bestValue.vendor} ${bestValue.strain} (${bestValue.thcPerDollar} THC%/$)`);
  console.log(`Cheapest per gram: ${cheapestPerGram.vendor} ${cheapestPerGram.strain} ($${cheapestPerGram.pricePerGram}/g)`);
  console.log(`Average price per gram: $${(productsWithPricing.reduce((sum, p) => sum + parseFloat(p.pricePerGram), 0) / productsWithPricing.length).toFixed(2)}`);
} else {
  console.log('\n💰 PRICE ANALYSIS: No pricing data available');
  console.log('Please provide copy-paste data with weight and price information');
}

// Create enhanced JSON output
const output = {
  totalProducts: products.length,
  highestTHC: highestTHC,
  rankings: enhancedProducts.map((product, index) => ({
    rank: index + 1,
    ...product
  })),
  analysis: {
    productsWithPricing: productsWithPricing.length,
    hasPriceData: productsWithPricing.length > 0
  },
  metadata: {
    location: 'Rise Cannabis New Hope, Minnesota',
    extractionDate: new Date().toISOString(),
    source: 'Enhanced analysis with price/weight calculations',
    note: 'Price and weight data will be populated when available from copy-paste'
  }
};

fs.writeFileSync('./rise-cannabis-complete-analysis.json', JSON.stringify(output, null, 2));
console.log('\n💾 Complete analysis saved to: rise-cannabis-complete-analysis.json');
console.log('\n📝 NEXT STEPS:');
console.log('1. Copy-paste the Rise Cannabis page content including prices and weights');
console.log('2. Look for format like: "VENDOR Strain Type 3.5g $45.00 THC X.X% CBD X.X%"');
console.log('3. Run enhanced extraction to get complete pricing analysis');