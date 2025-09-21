// Test the multi-line parser function
const fs = require('fs');

// Copy the parser function here for testing
function parseMultiLineProductCards(pageText, riseLocation, url) {
  const products = [];
  const lines = pageText.split('\n').map(line => line.trim());

  console.log(`📋 Processing ${lines.length} lines for product cards`);
  console.log('Lines:', lines);

  for (let i = 0; i < lines.length - 9; i++) {
    // Look for the pattern starting with cannabis type (Hybrid, Indica, Sativa)
    const cannabisType = lines[i];
    if (!['Hybrid', 'Indica', 'Sativa'].includes(cannabisType)) continue;

    console.log(`🔍 Found cannabis type "${cannabisType}" at line ${i}`);

    const vendor = lines[i + 1];
    const strain = lines[i + 2];
    const productType = lines[i + 3];
    const thcCbdLine = lines[i + 4];
    const rating = lines[i + 5];

    // Skip blank line and find reviews line
    let reviewsLineIndex = i + 6;
    while (reviewsLineIndex < lines.length && lines[reviewsLineIndex].trim() === '') {
      reviewsLineIndex++;
    }

    const reviewsLine = lines[reviewsLineIndex];
    const weight = lines[reviewsLineIndex + 1];
    const price = lines[reviewsLineIndex + 2];

    console.log(`📋 Checking lines: vendor="${vendor}", strain="${strain}", thc="${thcCbdLine}", reviews="${reviewsLine}", weight="${weight}", price="${price}"`);

    if (!vendor || !strain || !productType || !thcCbdLine || !rating || !reviewsLine || !weight || !price) {
      console.log(`❌ Missing data at line ${i}`);
      continue;
    }

    // Validate the pattern
    const thcCbdMatch = thcCbdLine.match(/THC\s+(\d+(?:\.\d+)?)%\s+CBD\s+(\d+(?:\.\d+)?)%/);
    const weightMatch = weight.match(/(\d+(?:\.\d+)?)g/);
    const priceMatch = price.match(/\$(\d+(?:\.\d+)?)/);
    const reviewsMatch = reviewsLine.match(/(\d+)\s+reviews?/);

    if (thcCbdMatch && weightMatch && priceMatch) {
      const [, thcPercent, cbdPercent] = thcCbdMatch;
      const [, weightValue] = weightMatch;
      const [, priceValue] = priceMatch;
      const reviewCount = reviewsMatch ? reviewsMatch[1] : null;

      const product = {
        type: 'cannabis-flower',
        cannabisType: cannabisType,
        vendor: vendor,
        productName: strain,
        productType: productType,
        thc: `${thcPercent}%`,
        cbd: `${cbdPercent}%`,
        weight: `${weightValue}g`,
        price: `$${priceValue}`,
        rating: rating,
        reviewCount: reviewCount,
        riseLocation: riseLocation,
        sourceUrl: url,
        source: 'rise-cannabis-multiline',
        // Calculate price metrics
        pricePerGram: (parseFloat(priceValue) / parseFloat(weightValue)).toFixed(2),
        thcPerDollar: (parseFloat(thcPercent) / parseFloat(priceValue)).toFixed(3),
        rawText: lines.slice(i, i + 10).join(' | ')
      };

      products.push(product);
      console.log(`✅ Parsed: ${vendor} ${strain} - ${weight} - ${price} - ${thcPercent}% THC`);
      console.log(`   💰 $${product.pricePerGram}/g | 🧪 ${product.thcPerDollar} THC%/$`);

      // Skip ahead to avoid overlapping matches
      i = reviewsLineIndex + 2;
    } else {
      console.log(`❌ Failed to match pattern at line ${i}: ${lines.slice(i, i + 10).join(' | ')}`);
    }
  }

  return products;
}

// Test with sample data
const sampleText = fs.readFileSync('./test-multiline-sample.txt', 'utf8');
console.log('🧪 Testing multi-line parser with sample data:');
console.log('Raw text:');
console.log(sampleText);
console.log('\n📊 Parser results:');

const products = parseMultiLineProductCards(sampleText, 'NEW HOPE', 'https://risecannabis.com/test');

console.log('\n📋 Final results:');
console.log(JSON.stringify(products, null, 2));