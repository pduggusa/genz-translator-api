# 🚀 Gen Z Translator API

Advanced content extraction API with browser emulation, popup handling, and structured data output.

## Features

- 🤖 Full browser emulation with Puppeteer
- 🚫 Comprehensive popup handling (age verification, cookies, newsletters)
- 🏪 E-commerce product extraction with pricing data
- 📊 Structured JSON output for price tracking
- 🔗 Deep link following with intelligent prioritization

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## API Endpoints

- `GET/POST /api/fetch-url` - Universal content extraction
- `GET /api/product` - Specialized product extraction  
- `POST /api/track-products` - Batch product tracking
- `GET /health` - Health check

## Deployment

Optimized for Azure App Service with resource management and automatic popup handling.

## License

MIT License
