// Demo data showing how cannabis extraction and cost sorting would work

const mockCannabisData = {
  "url": "https://risecannabis.com/dispensaries/minnesota/new-hope/5268/medical-menu/?refinementList[root_types][]=flower",
  "timestamp": "2025-09-19T03:30:00.000Z",
  "products": [
    {
      "name": "Blue Dream",
      "thc": "18.5%",
      "cbd": "0.8%",
      "price": "$45.00",
      "weight": "3.5g"
    },
    {
      "name": "Girl Scout Cookies",
      "thc": "22.1%",
      "cbd": "0.2%",
      "price": "$50.00",
      "weight": "3.5g"
    },
    {
      "name": "Northern Lights",
      "thc": "16.8%",
      "cbd": "1.2%",
      "price": "$40.00",
      "weight": "3.5g"
    },
    {
      "name": "OG Kush",
      "thc": "24.3%",
      "cbd": "0.1%",
      "price": "$55.00",
      "weight": "3.5g"
    },
    {
      "name": "Purple Haze",
      "thc": "19.7%",
      "cbd": "0.5%",
      "price": "$48.00",
      "weight": "3.5g"
    }
  ],
  "count": 5
};

// Function to sort cannabis by cost (lowest to highest)
function sortCannabisByCost(data) {
  const products = [...data.products];

  products.sort((a, b) => {
    const priceA = parseFloat(a.price.replace('$', ''));
    const priceB = parseFloat(b.price.replace('$', ''));
    return priceA - priceB;
  });

  return products;
}

// Function to calculate price per % THC
function addValueMetrics(products) {
  return products.map(product => {
    const price = parseFloat(product.price.replace('$', ''));
    const thc = parseFloat(product.thc.replace('%', ''));
    const pricePerThc = (price / thc).toFixed(2);

    return {
      ...product,
      pricePerThc: `$${pricePerThc}`,
      value: thc > 20 && price < 50 ? '⭐ Great Value' : price < 45 ? '💰 Budget' : '🌟 Premium'
    };
  });
}

console.log('🌿 Cannabis Products Sorted by Cost (Lowest to Highest):');
console.log('='.repeat(60));

const sortedProducts = addValueMetrics(sortCannabisByCost(mockCannabisData));

sortedProducts.forEach((product, index) => {
  console.log(`${index + 1}. ${product.name}`);
  console.log(`   Price: ${product.price} (${product.weight})`);
  console.log(`   THC: ${product.thc} | CBD: ${product.cbd}`);
  console.log(`   Price per % THC: ${product.pricePerThc}`);
  console.log(`   Value Rating: ${product.value}`);
  console.log('');
});

console.log('📊 Summary:');
console.log(`Total strains: ${sortedProducts.length}`);
console.log(`Price range: ${sortedProducts[0].price} - ${sortedProducts[sortedProducts.length-1].price}`);
console.log(`Best value (price/THC): ${sortedProducts.reduce((best, current) =>
  parseFloat(current.pricePerThc.replace('$', '')) < parseFloat(best.pricePerThc.replace('$', '')) ? current : best
).name}`);