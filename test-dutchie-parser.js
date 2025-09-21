// Test Dutchie paste data parser
const fs = require('fs');

function parseDutchieData(pageText, location, sourceUrl) {
  const products = [];

  // Parse the Dutchie format:
  // Brand | Product | - Strain | Type | THC%
  // Type
  // THC: XX.X%
  // Weight
  // $XX.XX

  const lines = pageText.split('\n').map(line => line.trim()).filter(line => line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for product lines with strain names and THC percentages
    if (line.includes('|') && line.includes('%') && (line.includes('(H)') || line.includes('(S)') || line.includes('(I)'))) {
      // Extract strain and THC from product line
      let strain = '';
      let titleThc = '';

      // Parse different formats:
      // "GOLD* Flower | - Cherry Slimeade (H) | 24.65%"
      // "Platinum Tier - Cherry Pie OG (H)| 26.2%"

      if (line.includes('GOLD* Flower |')) {
        const match = line.match(/GOLD\* Flower \| - (.+?) \([HSI]\) \| ([\d.]+)%/);
        if (match) {
          strain = match[1].trim();
          titleThc = match[2];
        }
      } else if (line.includes('Platinum Tier -')) {
        const match = line.match(/Platinum Tier - (.+?) \([HSI]\/?\w?\)\| ([\d.]+)%/);
        if (match) {
          strain = match[1].trim();
          titleThc = match[2];
        }
      } else if (line.includes('Small Buds |')) {
        const match = line.match(/Small Buds \| - (.+?) \([HSI]\) \| ([\d.]+)%/);
        if (match) {
          strain = match[1].trim();
          titleThc = match[2];
        }
      } else if (line.includes('Exotic Bloom |')) {
        const match = line.match(/Exotic Bloom \| .+ \| - (.+?) \| \([SI]\) ([\d.]+)%/);
        if (match) {
          strain = match[1].trim();
          titleThc = match[2];
        }
      }

      if (strain) {
        console.log(`🔍 Found strain: ${strain} with THC: ${titleThc}%`);

        // Next lines should be Type, THC, weights and prices
        let cannabisType = '';
        let thc = '';
        const weights = [];

        // Look ahead for type and THC
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j];

          // Cannabis type line
          if (['Hybrid', 'Sativa', 'Indica'].includes(nextLine)) {
            cannabisType = nextLine;
            console.log(`  📝 Type: ${cannabisType}`);
          }

          // THC line
          if (nextLine.startsWith('THC:')) {
            const thcMatch = nextLine.match(/THC:\s*([\d.]+)%/);
            if (thcMatch) {
              thc = thcMatch[1];
              console.log(`  📝 THC: ${thc}%`);
            }
          }

          // Weight and price lines
          if (nextLine.match(/^\d+g?$/) && j + 1 < lines.length) {
            const weight = nextLine;
            const priceLine = lines[j + 1];
            const priceMatch = priceLine.match(/\$([\d.]+)/);

            if (priceMatch) {
              weights.push({
                weight: weight === '1g' ? '1g' : weight === '3.5g' ? '3.5g' : weight === '7g' ? '7g' : weight === '14g' ? '14g' : weight === '28g' ? '28g' : weight,
                price: parseFloat(priceMatch[1])
              });
              console.log(`  💰 ${weight}: $${priceMatch[1]}`);
            }
          }

          // Stop if we hit another product line
          if (nextLine.includes('|') && nextLine.includes('%') && nextLine !== line) {
            break;
          }
        }

        // Use title THC if we didn't find THC in content
        if (!thc && titleThc) {
          thc = titleThc;
        }

        // Determine brand/tier
        let brand = 'Sweetest Grass';
        let tier = '';
        if (line.includes('GOLD* Flower')) {
          tier = 'Gold';
        } else if (line.includes('Platinum Tier')) {
          tier = 'Platinum';
        } else if (line.includes('Small Buds')) {
          tier = 'Small Buds';
        } else if (line.includes('Exotic Bloom')) {
          brand = 'Exotic Bloom';
        }

        console.log(`  🏷️ Brand: ${brand}, Tier: ${tier || 'Standard'}`);

        // Create products for each weight
        if (weights.length > 0 && thc) {
          weights.forEach(weightInfo => {
            const weightNum = parseFloat(weightInfo.weight.replace('g', ''));
            const product = {
              type: 'cannabis-flower',
              cannabisType: cannabisType,
              vendor: brand,
              tier: tier,
              strain: strain,
              productName: strain,
              productType: 'Flower',
              thc: `${thc}%`,
              cbd: null,
              weight: weightInfo.weight,
              price: `$${weightInfo.price.toFixed(2)}`,
              location: location,
              sourceUrl: sourceUrl,
              source: 'dutchie-multiline',
              pricePerGram: (weightInfo.price / weightNum).toFixed(2),
              thcPerDollar: (parseFloat(thc) / weightInfo.price).toFixed(3)
            };

            products.push(product);
            console.log(`✅ Created: ${strain} ${weightInfo.weight} - $${weightInfo.price} (${product.pricePerGram}/g)`);
          });
        } else {
          console.log(`❌ Failed: ${strain} - missing weights or THC`);
        }
        console.log(''); // Empty line between products
      }
    }
  }

  return products;
}

// Test with the paste data
const pasteData = fs.readFileSync('./test-dutchie-paste.txt', 'utf8');
console.log('🧪 Testing Dutchie Parser:');
console.log('============================');

const products = parseDutchieData(pasteData, 'Sweetest Grass Dispensary', 'https://dutchie.com/stores/sweetest-grass/products/flower');

console.log(`\n📊 Parsed ${products.length} products:`);
products.forEach(product => {
  console.log(`🌿 ${product.strain} (${product.cannabisType}) - ${product.thc} - ${product.weight} - $${product.pricePerGram}/g`);
});

// Find highest THC
const uniqueStrains = products.reduce((acc, product) => {
  if (!acc[product.strain] || parseFloat(product.thc.replace('%', '')) > parseFloat(acc[product.strain].thc.replace('%', ''))) {
    acc[product.strain] = product;
  }
  return acc;
}, {});

const highestThc = Object.values(uniqueStrains).reduce((max, product) => {
  const thc = parseFloat(product.thc.replace('%', ''));
  const maxThc = parseFloat(max.thc.replace('%', ''));
  return thc > maxThc ? product : max;
}, Object.values(uniqueStrains)[0]);

if (highestThc) {
  console.log(`\n🏆 Highest THC: ${highestThc.strain} at ${highestThc.thc}`);
}