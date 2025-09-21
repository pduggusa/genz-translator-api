// Test Lake Leaf paste data parser
const fs = require('fs');

function parseLakeLeafData(pageText, location, sourceUrl) {
  const products = [];

  // Parse the Lake Leaf format from your paste data:
  // Strain | 1/8oz Flower
  // Brand
  // Strain | 1/8oz Flower
  // Type | THC XX.X%
  // $XX.XX

  const lines = pageText.split('\n').map(line => line.trim()).filter(line => line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for strain lines that end with "| 1/8oz Flower"
    if (line.includes('| 1/8oz Flower') && !line.includes('Campfire Cannabis')) {
      const strain = line.replace('| 1/8oz Flower', '').trim();

      // Next line should be brand (skip if it's "Campfire Cannabis")
      if (i + 1 < lines.length && lines[i + 1] === 'Campfire Cannabis') {
        const brand = lines[i + 1];

        // Skip repeated strain line
        if (i + 2 < lines.length && lines[i + 2].includes(strain)) {
          // Type and THC line
          if (i + 3 < lines.length) {
            const typeThcLine = lines[i + 3];
            const thcMatch = typeThcLine.match(/THC\s+([\d.]+)%/);
            const typeMatch = typeThcLine.match(/^([^|]+)/);

            // Price line
            if (i + 4 < lines.length) {
              const priceLine = lines[i + 4];
              const priceMatch = priceLine.match(/\$([\d.]+)/);

              if (thcMatch && priceMatch && typeMatch) {
                const thc = parseFloat(thcMatch[1]);
                const price = parseFloat(priceMatch[1]);
                const cannabisType = typeMatch[1].trim();
                const weight = '3.5g'; // 1/8oz = 3.5g

                const product = {
                  type: 'cannabis-flower',
                  cannabisType: cannabisType,
                  vendor: brand,
                  strain: strain,
                  productName: strain,
                  productType: 'Flower',
                  thc: `${thc}%`,
                  cbd: null,
                  weight: weight,
                  price: `$${price.toFixed(2)}`,
                  location: location,
                  sourceUrl: sourceUrl,
                  source: 'lake-leaf-multiline',
                  pricePerGram: (price / 3.5).toFixed(2),
                  thcPerDollar: (thc / price).toFixed(3)
                };

                products.push(product);
                console.log(`✅ Parsed: ${strain} (${cannabisType}) - ${thc}% THC - ${weight} - $${price}`);

                // Skip ahead to avoid double processing
                i += 4;
              } else {
                console.log(`❌ Failed to parse: ${strain} - missing THC, price or type`);
              }
            }
          }
        }
      }
    }
  }

  return products;
}

// Test with the paste data
const pasteData = fs.readFileSync('./test-lake-leaf-paste.txt', 'utf8');
console.log('🧪 Testing Lake Leaf Parser:');
console.log('==============================');

const products = parseLakeLeafData(pasteData, 'Lake Leaf Dispensary, Mille Lacs', 'https://lakeleafretail.com/store/category/flower');

console.log(`\n📊 Parsed ${products.length} products:`);
products.forEach(product => {
  console.log(`🌿 ${product.strain} (${product.cannabisType}) - ${product.thc} - $${product.pricePerGram}/g`);
});

// Find highest THC
const highestThc = products.reduce((max, product) => {
  const thc = parseFloat(product.thc.replace('%', ''));
  const maxThc = parseFloat(max.thc.replace('%', ''));
  return thc > maxThc ? product : max;
}, products[0]);

if (highestThc) {
  console.log(`\n🏆 Highest THC: ${highestThc.strain} at ${highestThc.thc}`);
}