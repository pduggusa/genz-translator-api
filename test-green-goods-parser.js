// Test Green Goods paste data parser
const fs = require('fs');
const { createStrainTrackingData } = require('./src/extractors/cannabis-extractor');

function parseGreenGoodsData(pasteText, location, sourceUrl) {
  const products = [];

  // Split by "Add to bag" or "Select weight" to separate products
  const productBlocks = pasteText.split(/(?:Add to bag|Select weight)/);

  productBlocks.forEach((block, index) => {
    if (index === 0) return; // Skip first empty block

    const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 6) return; // Need minimum lines for a valid product

    // Parse the Green Goods format:
    // Line 0: Strain name
    // Line 1: Type (Indica/Sativa/Hybrid)
    // Line 2: Strain name (repeat)
    // Line 3: Brand/Grower
    // Line 4: Product type (Flower, Ground Flower, etc)
    // Line 5: Weight info (7G), (3.5G), (14G, 28G)
    // Line 6: (blank)
    // Line 7: THC X.XX% CBD X.XX%
    // Line 8: $XX.XX/Xg

    const strain = lines[0];
    const cannabisType = lines[1];
    const brand = lines[3];
    const productType = lines[4];
    const weightInfo = lines[5];

    // Find THC/CBD line
    const thcCbdLine = lines.find(line => line.includes('THC') && line.includes('CBD'));
    // Find price line
    const priceLine = lines.find(line => line.includes('$') && line.includes('/'));

    if (strain && thcCbdLine && priceLine) {
      // Parse THC/CBD
      const thcMatch = thcCbdLine.match(/THC\s+([\d.]+)%/);
      const cbdMatch = thcCbdLine.match(/CBD\s+([\d.]+)%/);

      // Parse price and weight
      const priceMatch = priceLine.match(/\$([\d.]+)\/([\d.]+g)/);

      if (thcMatch && priceMatch) {
        const thc = parseFloat(thcMatch[1]);
        const price = parseFloat(priceMatch[1]);
        const weight = priceMatch[2];

        const product = {
          strain: strain,
          cannabisType: cannabisType,
          brand: brand,
          productType: productType,
          thc: `${thc}%`,
          cbd: cbdMatch ? `${parseFloat(cbdMatch[1])}%` : null,
          weight: weight,
          price: `$${price.toFixed(2)}`,
          weightInfo: weightInfo,
          rawBlock: lines.join(' | ')
        };

        products.push(product);
        console.log(`✅ Parsed: ${strain} (${cannabisType}) - ${thc}% THC - ${weight} - $${price}`);
      } else {
        console.log(`❌ Failed to parse: ${strain}`);
      }
    }
  });

  return products;
}

// Test with the paste data
const pasteData = fs.readFileSync('./test-green-goods-paste.txt', 'utf8');
console.log('🧪 Testing Green Goods Parser:');
console.log('==============================');

const products = parseGreenGoodsData(pasteData, 'Green Goods Bloomington, Minnesota', 'https://visitgreengoods.com/bloomington-mn-menu-med/menu/flower');

console.log(`\n📊 Parsed ${products.length} products:`);

// Convert to strain tracking format
const trackingData = createStrainTrackingData(products, 'Green Goods Bloomington, Minnesota', 'https://visitgreengoods.com/bloomington-mn-menu-med/menu/flower');

console.log('\n🎯 API Response Format:');
console.log(JSON.stringify({
  success: true,
  data: trackingData
}, null, 2));