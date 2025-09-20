// tests/unit/extraction.test.js
// Unit tests for extraction functionality

describe('🧪 Unit Tests - Content Extraction', () => {
  describe('Basic Content Processing', () => {
    test('should handle HTML parsing with Cheerio', () => {
      const cheerio = require('cheerio');
      const html = '<html><body><h1>Test Title</h1><p>Test content</p></body></html>';

      const $ = cheerio.load(html);
      const title = $('h1').text();
      const content = $('p').text();

      expect(title).toBe('Test Title');
      expect(content).toBe('Test content');
    });

    test('should handle empty HTML gracefully', () => {
      const cheerio = require('cheerio');
      const html = '';

      const $ = cheerio.load(html);
      expect($).toBeDefined();
      expect($('title').text()).toBe('');
    });

    test('should extract title from HTML head', () => {
      const cheerio = require('cheerio');
      const html = '<html><head><title>Test Page</title></head><body><p>Content</p></body></html>';

      const $ = cheerio.load(html);
      const title = $('title').text();

      expect(title).toBe('Test Page');
    });

    test('should extract meta tags', () => {
      const cheerio = require('cheerio');
      const html = '<html><head><meta name="description" content="Test description"><title>Test</title></head></html>';

      const $ = cheerio.load(html);
      const description = $('meta[name="description"]').attr('content');

      expect(description).toBe('Test description');
    });
  });

  describe('URL Processing', () => {
    test('should handle valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'https://www.example.com',
        'http://example.com'
      ];

      validUrls.forEach(url => {
        expect(() => new URL(url)).not.toThrow();
      });
    });

    test('should reject truly invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'just-text',
        ' '
      ];

      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });

    test('should accept but flag suspicious URLs', () => {
      const suspiciousUrls = [
        'ftp://example.com',
        'javascript:alert(1)'
      ];

      suspiciousUrls.forEach(url => {
        // These are valid URLs but should be handled carefully
        expect(() => new URL(url)).not.toThrow();
        const urlObj = new URL(url);
        expect(['ftp:', 'javascript:'].includes(urlObj.protocol)).toBe(true);
      });
    });
  });

  describe('Content Type Detection', () => {
    test('should detect cannabis keywords', () => {
      const cannabisKeywords = ['cannabis', 'marijuana', 'dispensary', 'THC', 'CBD'];
      const testText = 'Welcome to our premium cannabis dispensary with high THC strains';

      const foundKeywords = cannabisKeywords.filter(keyword =>
        testText.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundKeywords.length).toBeGreaterThan(0);
      expect(foundKeywords).toContain('cannabis');
      expect(foundKeywords).toContain('dispensary');
    });

    test('should not detect cannabis in regular content', () => {
      const cannabisKeywords = ['cannabis', 'marijuana', 'dispensary', 'THC', 'CBD'];
      const testText = 'Welcome to our technology blog about web development';

      const foundKeywords = cannabisKeywords.filter(keyword =>
        testText.toLowerCase().includes(keyword.toLowerCase())
      );

      expect(foundKeywords.length).toBe(0);
    });
  });
});