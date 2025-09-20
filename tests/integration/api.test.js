// tests/integration/api.test.js
// Integration tests for API endpoints

const request = require('supertest');
const app = require('../../src/server');

describe('= Integration Tests - API Endpoints', () => {
  describe('Health Endpoint', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.status).toBe('healthy');
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('API Info Endpoint', () => {
    test('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.name).toContain('hacksaws2x4');
      expect(response.body.version).toBe('3.0.0');
    });

    test('should not expose sensitive information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toMatch(/password|secret|key|token/i);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow reasonable request rates', async () => {
      // Make several requests quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/health'));
      }

      const responses = await Promise.all(promises);

      // At least some should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 gracefully', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toBeDefined();
    });

    test('should handle invalid JSON in POST requests', async () => {
      const response = await request(app)
        .post('/extract')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });
});