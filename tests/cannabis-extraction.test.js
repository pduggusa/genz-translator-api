// tests/cannabis-extraction.test.js
// Tests for cannabis product extraction functionality

const request = require('supertest');
const app = require('../src/server');
const { isCannabisContent, extractCannabisData } = require('../src/extractors/cannabis-extractor');

describe('Cannabis Extraction Tests', () => {

    describe('Cannabis Content Detection', () => {
        test('should detect cannabis content from HTML', () => {
            const cannabisHtml = `
                <html>
                    <body>
                        <h1>Premium Cannabis Dispensary</h1>
                        <div class="product">
                            <h2>Blue Dream - Sativa</h2>
                            <p>THC: 22.5%</p>
                            <p>Price: $45</p>
                        </div>
                    </body>
                </html>
            `;

            const $ = require('cheerio').load(cannabisHtml);
            const isCannabis = isCannabisContent(cannabisHtml, $);

            expect(isCannabis).toBe(true);
        });

        test('should not detect cannabis content from regular e-commerce', () => {
            const regularHtml = `
                <html>
                    <body>
                        <h1>Electronics Store</h1>
                        <div class="product">
                            <h2>iPhone 15</h2>
                            <p>Price: $999</p>
                        </div>
                    </body>
                </html>
            `;

            const $ = require('cheerio').load(regularHtml);
            const isCannabis = isCannabisContent(regularHtml, $);

            expect(isCannabis).toBe(false);
        });
    });

    describe('Cannabis Data Extraction', () => {
        test('should extract basic strain information', () => {
            const cannabisHtml = `
                <html>
                    <body>
                        <h1>Blue Dream - Sativa</h1>
                        <p>THC: 22.5%</p>
                        <p>CBD: 1.2%</p>
                        <p>Price: $45</p>
                    </body>
                </html>
            `;

            const $ = require('cheerio').load(cannabisHtml);
            const data = extractCannabisData(cannabisHtml, $, 'https://dispensary.com/blue-dream');

            expect(data.strain.name).toBeTruthy();
            expect(data.potency.thc.percentage).toBe(22.5);
            expect(data.potency.cbd.percentage).toBe(1.2);
            expect(data.pricing.current_price).toBe(45);
        });

        test('should handle missing potency data gracefully', () => {
            const cannabisHtml = `
                <html>
                    <body>
                        <h1>Mystery Strain</h1>
                        <p>Price: $35</p>
                    </body>
                </html>
            `;

            const $ = require('cheerio').load(cannabisHtml);
            const data = extractCannabisData(cannabisHtml, $, 'https://dispensary.com/mystery');

            expect(data.potency.thc.percentage).toBeNull();
            expect(data.pricing.current_price).toBe(35);
        });
    });

    describe('Cannabis API Endpoints', () => {
        test('should return tracked strains', async () => {
            const response = await request(app)
                .get('/api/cannabis/strains');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.strains).toBeDefined();
            expect(Array.isArray(response.body.strains)).toBe(true);
        });

        test('should filter strains by type', async () => {
            const response = await request(app)
                .get('/api/cannabis/strains?type=indica');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.filters_applied.type).toBe('indica');
        });

        test('should filter strains by THC range', async () => {
            const response = await request(app)
                .get('/api/cannabis/strains?thc_min=20&thc_max=25');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.filters_applied.thc_min).toBe(20);
            expect(response.body.filters_applied.thc_max).toBe(25);
        });

        test('should return analytics data', async () => {
            const response = await request(app)
                .get('/api/cannabis/analytics');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.analytics).toBeDefined();
            expect(response.body.analytics.summary).toBeDefined();
        });

        test('should return price trends', async () => {
            const response = await request(app)
                .get('/api/cannabis/trends?days=30');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.period_days).toBe(30);
            expect(response.body.trends).toBeDefined();
        });
    });

    describe('Data Structure Validation', () => {
        test('should return properly structured cannabis data', async () => {
            // This test would need a mock cannabis URL or test data
            const mockCannabisUrl = 'https://example-dispensary.com/test-product';

            // For now, just test the endpoint structure
            const response = await request(app)
                .post('/api/fetch-url')
                .send({
                    url: 'https://httpbin.org/html', // Safe test URL
                    browser: false
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.contentType).toBeDefined();
        });
    });
});

describe('Link Following Tests', () => {
    describe('Link Extraction', () => {
        test('should extract product links from cannabis menu pages', () => {
            const { extractProductLinks } = require('../src/extractors/link-follower');

            const menuHtml = `
                <html>
                    <body>
                        <div class="product-grid">
                            <a href="/product/blue-dream" class="product-card">Blue Dream</a>
                            <a href="/product/og-kush" class="product-card">OG Kush</a>
                            <a href="/strain/purple-haze" class="strain-card">Purple Haze</a>
                        </div>
                    </body>
                </html>
            `;

            const links = extractProductLinks(menuHtml, 'https://dispensary.com/menu');

            expect(links.length).toBeGreaterThan(0);
            expect(links.some(link => link.includes('blue-dream'))).toBe(true);
            expect(links.some(link => link.includes('og-kush'))).toBe(true);
        });

        test('should filter out non-product links', () => {
            const { isValidProductLink } = require('../src/extractors/link-follower');

            expect(isValidProductLink('/product/blue-dream', 'https://dispensary.com')).toBe(true);
            expect(isValidProductLink('/cart', 'https://dispensary.com')).toBe(false);
            expect(isValidProductLink('/login', 'https://dispensary.com')).toBe(false);
            expect(isValidProductLink('image.jpg', 'https://dispensary.com')).toBe(false);
        });
    });
});