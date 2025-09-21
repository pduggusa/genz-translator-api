// Analyze Rise Cannabis THC Rankings from full page data
const fs = require('fs');

const products = [
  { vendor: 'RYTHM', strain: 'Afternoon Delight #4', type: 'Premium Flower', thc: 21.6, cbd: 0.05 },
  { vendor: 'RYTHM', strain: 'Animal Face', type: 'Premium Flower', thc: 23.6, cbd: 0.07 },
  { vendor: 'RYTHM', strain: 'Animal Face', type: 'Mini Buds', thc: 27.0, cbd: 0.05 },
  { vendor: 'RYTHM', strain: 'Bananaconda', type: 'Premium Flower', thc: 25.5, cbd: 0.06 },
  { vendor: 'RYTHM', strain: 'Bananaconda', type: 'Mini Buds', thc: 24.8, cbd: 0.09 },
  { vendor: 'RYTHM', strain: 'Brownie Scout', type: 'Premium Flower', thc: 23.8, cbd: 0.06 },
  { vendor: 'RYTHM', strain: 'Brownie Scout', type: 'Mini Buds', thc: 25.2, cbd: 0.06 },
  { vendor: 'RYTHM', strain: 'Durban Z', type: 'Premium Flower', thc: 23.2, cbd: 0.06 },
  { vendor: 'RYTHM', strain: 'Gogurtz', type: 'Premium Flower', thc: 27.9, cbd: 0.06 },
  { vendor: 'RYTHM', strain: 'LA Kush Cake', type: 'Mini Buds', thc: 22.1, cbd: 0.04 },
  { vendor: 'RYTHM', strain: 'LA Kush Cake', type: 'Premium Flower', thc: 18.7, cbd: 0.03 },
  { vendor: 'RYTHM', strain: 'Runtz S1', type: 'Mini Buds', thc: 24.5, cbd: 0.04 },
  { vendor: 'RYTHM', strain: 'Runtz S1', type: 'Premium Flower', thc: 24.5, cbd: 0.04 },
  { vendor: 'RYTHM', strain: 'VelcroZ', type: 'Mini Buds', thc: 23.9, cbd: 0.07 },
  { vendor: 'RYTHM', strain: 'VelcroZ', type: 'Premium Flower', thc: 20.0, cbd: 0.04 },
  { vendor: 'Good Green', strain: 'Apple Cobbler', type: 'Flower', thc: 20.4, cbd: 0.05 },
  { vendor: 'Good Green', strain: 'Baklava', type: 'Flower', thc: 19.1, cbd: 0.03 },
  { vendor: 'Good Green', strain: 'Banana Cream', type: 'Flower', thc: 20.8, cbd: 0.04 },
  { vendor: 'Good Green', strain: 'Beaver Cookies', type: 'Flower', thc: 20.9, cbd: 0.04 },
  { vendor: 'Good Green', strain: 'Black Maple', type: 'Flower', thc: 19.9, cbd: 0.05 },
  { vendor: 'Good Green', strain: 'Chem \'n Cookies', type: 'Flower', thc: 23.6, cbd: 0.05 }
];

// Sort by THC descending
const sortedByTHC = products.sort((a, b) => b.thc - a.thc);

console.log('🏆 COMPLETE THC RANKING - RISE CANNABIS NEW HOPE');
console.log('=' .repeat(60));

sortedByTHC.forEach((product, index) => {
  const rank = index + 1;
  const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
  console.log(`${emoji} ${rank.toString().padStart(2)}. ${product.vendor} ${product.strain} (${product.type})`);
  console.log(`      THC: ${product.thc}% | CBD: ${product.cbd}%`);
  console.log('');
});

// Summary stats
const highestTHC = sortedByTHC[0];
const rythmProducts = products.filter(p => p.vendor === 'RYTHM');
const goodGreenProducts = products.filter(p => p.vendor === 'Good Green');

console.log('📊 SUMMARY STATISTICS');
console.log('=' .repeat(40));
console.log(`Total products: ${products.length}`);
console.log(`RYTHM products: ${rythmProducts.length}`);
console.log(`Good Green products: ${goodGreenProducts.length}`);
console.log(`Highest THC: ${highestTHC.vendor} ${highestTHC.strain} (${highestTHC.thc}%)`);
console.log(`Average THC: ${(products.reduce((sum, p) => sum + p.thc, 0) / products.length).toFixed(1)}%`);
console.log(`THC Range: ${Math.min(...products.map(p => p.thc))}% - ${Math.max(...products.map(p => p.thc))}%`);

// Create JSON output
const output = {
  totalProducts: products.length,
  highestTHC: highestTHC,
  rankings: sortedByTHC.map((product, index) => ({
    rank: index + 1,
    ...product
  })),
  metadata: {
    location: 'Rise Cannabis New Hope, Minnesota',
    extractionDate: new Date().toISOString(),
    source: 'Manual extraction from browser copy-paste'
  }
};

fs.writeFileSync('./rise-cannabis-thc-rankings.json', JSON.stringify(output, null, 2));
console.log('\n💾 Complete rankings saved to: rise-cannabis-thc-rankings.json');