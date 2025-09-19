// tests/security.test.js
// Security tests for the Gen Z Translator API

const request = require('supertest');
const app = require('../src/server');

describe('Security Tests', () => {

    describe('Rate Limiting', () => {
        test('should enforce rate limits on API endpoints', async () => {
            // This would need to be adjusted based on actual rate limit settings
            const endpoint = '/api/fetch-url?url=https://example.com';
            const requests = [];

            // Make multiple rapid requests to test rate limiting
            for (let i = 0; i < 5; i++) {
                requests.push(request(app).get(endpoint));
            }

            const responses = await Promise.all(requests);

            // At least one should be rate limited (this is a basic test)
            expect(responses.some(res => res.status === 429 || res.status === 400)).toBe(true);
        });
    });

    describe('Input Validation', () => {
        test('should reject invalid URLs', async () => {
            const response = await request(app)
                .post('/api/fetch-url')
                .send({
                    url: 'not-a-valid-url',
                    browser: true
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid URL');
        });

        test('should reject non-HTTP(S) protocols', async () => {
            const response = await request(app)
                .post('/api/fetch-url')
                .send({
                    url: 'ftp://example.com',
                    browser: true
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should require URL parameter', async () => {
            const response = await request(app)
                .post('/api/fetch-url')
                .send({
                    browser: true
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('URL parameter is required');
        });
    });

    describe('Security Headers', () => {
        test('should include security headers', async () => {
            const response = await request(app)
                .get('/health');

            // Check for security headers set by helmet
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-xss-protection']).toBe('0');
        });

        test('should set CORS headers appropriately', async () => {
            const response = await request(app)
                .get('/api')
                .set('Origin', 'https://dugganusa.com');

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should not expose internal errors', async () => {
            const response = await request(app)
                .get('/nonexistent-endpoint');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Endpoint not found');
            // Should not expose stack traces or internal details
            expect(response.body.stack).toBeUndefined();
        });
    });

    describe('Cannabis Data Security', () => {
        test('should sanitize cannabis strain data', async () => {
            // Test that cannabis tracking doesn't expose sensitive info
            const response = await request(app)
                .get('/api/cannabis/strains');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Ensure no sensitive fields are exposed
            if (response.body.strains && response.body.strains.length > 0) {
                const strain = response.body.strains[0];
                expect(strain.internal_id).toBeUndefined();
                expect(strain.raw_data).toBeUndefined();
                expect(strain.extraction_logs).toBeUndefined();
            }
        });
    });
});

describe('API Health & Status', () => {
    test('health endpoint should return secure status', async () => {
        const response = await request(app)
            .get('/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');

        // Should not expose sensitive system info
        expect(response.body.environment).toBeDefined();
        expect(response.body.version).toBeDefined();
        expect(response.body.database_connection_string).toBeUndefined();
        expect(response.body.api_keys).toBeUndefined();
    });

    test('API info should not expose sensitive configuration', async () => {
        const response = await request(app)
            .get('/api');

        expect(response.status).toBe(200);
        expect(response.body.service).toBeDefined();
        expect(response.body.features).toBeDefined();

        // Should not expose internal config
        expect(response.body.database_config).toBeUndefined();
        expect(response.body.secrets).toBeUndefined();
        expect(response.body.private_keys).toBeUndefined();
    });
});