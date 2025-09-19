const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Cannabis Extractor API',
    version: 'emergency-recovery'
  });
});

// Basic extract endpoint
app.post('/extract', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Simple cannabis detection
  const cannabisPatterns = [
    /cannabis/i, /dispensary/i, /flower/i, /rise/i, /risecannabis/i,
    /leafly/i, /weedmaps/i, /menu/i, /lakeleaf/i, /greengoods/i, /med/i
  ];

  const isCannabisUrl = cannabisPatterns.some(pattern => pattern.test(url));

  res.json({
    url,
    timestamp: new Date().toISOString(),
    browserEmulation: isCannabisUrl,
    status: 'service_recovering',
    message: 'Emergency recovery mode - cannabis detection active'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Cannabis Extractor API',
    status: 'Emergency Recovery Mode',
    version: '1.0-recovery'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Emergency recovery server running on port ${PORT}`);
});