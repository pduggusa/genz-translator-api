# API Documentation

## Endpoints

### GET/POST /api/fetch-url
Extract content from any URL with optional browser emulation.

**Parameters:**
- `url` (required): Target URL
- `browser` (optional): Enable browser emulation
- `followLinks` (optional): Follow links one level deep

**Example:**
```bash
curl -X POST "http://localhost:3000/api/fetch-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "browser": true}'
```

TODO: Add complete API documentation
