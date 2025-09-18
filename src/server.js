// Basic server setup - TODO: Replace with full Azure-optimized version
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        environment: process.env.NODE_ENV || 'development',
        message: 'Basic setup - Add full implementation'
    });
});

app.get('/api', (req, res) => {
    res.json({
        service: 'Gen Z Translator API',
        version: '3.0.0',
        status: 'Basic setup - Ready for full implementation',
        features: [
            'Browser emulation with Puppeteer (pending)',
            'Popup handling (pending)', 
            'E-commerce extraction (pending)',
            'Price tracking output (pending)'
        ],
        endpoints: {
            'GET /health': 'Health check',
            'GET /api': 'API information',
            'POST /api/fetch-url': 'Content extraction (pending implementation)'
        },
        nextSteps: [
            'Add full Azure-optimized server code',
            'Add browser emulation modules',
            'Add structured extraction logic',
            'Test with real websites'
        ]
    });
});

app.get('/api/examples', (req, res) => {
    res.json({
        service: 'Gen Z Translator API - Examples',
        message: 'Full examples pending - add complete implementation',
        basicUsage: {
            description: 'Once implemented, extract content like this:',
            curl: `curl -X POST "${req.protocol}://${req.get('host')}/api/fetch-url" -H "Content-Type: application/json" -d '{"url": "https://example.com", "browser": true}'`
        }
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        service: 'Statistics',
        message: 'Stats tracking pending - add full implementation',
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    });
});

// TODO: Implement full extraction logic
app.post('/api/fetch-url', (req, res) => {
    const { url, browser, followLinks } = req.body;
    
    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL parameter is required',
            usage: '{"url": "https://example.com", "browser": true}'
        });
    }
    
    res.json({
        success: false,
        error: 'Full implementation pending',
        message: 'Replace this basic server with the complete Azure-optimized version',
        received: { url, browser, followLinks },
        todo: [
            'Add browser emulation with Puppeteer',
            'Add popup handling logic',
            'Add structured content extraction',
            'Add e-commerce product detection'
        ]
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        available: ['/', '/health', '/api', '/api/examples', '/api/stats']
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Gen Z Translator API running on port ${PORT}`);
    console.log(`📝 Basic setup complete - Ready for full implementation`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`💊 Health: http://localhost:${PORT}/health`);
    console.log(`📖 API: http://localhost:${PORT}/api`);
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Replace src/server.js with full Azure-optimized version');
    console.log('2. Add extraction modules to src/extractors/');
    console.log('3. Test with: npm run dev');
});

module.exports = app;
