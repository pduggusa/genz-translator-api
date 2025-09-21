// Simple debug script to capture what our browser actually sees
const { fetchPageWithBrowser } = require('./src/extractors/browser-emulation');
const fs = require('fs');

async function debugHtmlCapture() {
  const url = 'https://risecannabis.com/dispensaries/minnesota/new-hope/5268/medical-menu/?refinementList[root_types][]=flower&currentSort=by-thc-potency-desc';

  console.log('🌐 Fetching page with browser...');
  const result = await fetchPageWithBrowser(url, { timeout: 60000 });

  console.log('📄 Page loaded, saving HTML...');
  fs.writeFileSync('./debug-rise-html.html', result.html);

  console.log('🔍 Searching for product URLs in HTML...');
  const productUrlRegex = /\/product\/\d+\/[a-zA-Z0-9\-]+/g;
  const matches = result.html.match(productUrlRegex);

  if (matches) {
    console.log(`✅ Found ${matches.length} product URL matches:`);
    const uniqueUrls = [...new Set(matches)];
    uniqueUrls.forEach((match, i) => {
      console.log(`${i + 1}. /dispensaries/minnesota/new-hope/5268/medical-menu${match}`);
    });
  } else {
    console.log('❌ No product URLs found in HTML');
    console.log('📊 HTML length:', result.html.length);
    console.log('🔍 Looking for any "product" mentions...');
    const productMentions = result.html.match(/product/gi);
    console.log(`Found ${productMentions ? productMentions.length : 0} mentions of "product"`);
  }
}

debugHtmlCapture().catch(console.error);