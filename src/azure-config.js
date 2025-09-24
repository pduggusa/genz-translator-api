// Complete Azure App Service Configuration for Vibe Coding Academy
// Optimized for student deployments and production environments

const azureConfig = {
  // Server Configuration
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Browser Automation Configuration (Azure-optimized)
  browser: {
    maxConcurrent: isAzureEnvironment() ? 2 : 4,
    timeout: isAzureEnvironment() ? 25000 : 30000,
    headless: true,
    args: isAzureEnvironment() ? [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ] : []
  },

  // Rate Limiting (Production-ready)
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isAzureEnvironment() ? 100 : 200, // Azure: 100, Local: 200
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes'
    }
  },

  // Memory and Performance
  performance: {
    maxMemoryUsage: isAzureEnvironment() ? 1024 : 2048, // MB
    gcInterval: 60000, // 1 minute
    responseTimeout: isAzureEnvironment() ? 25000 : 30000
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "https://2x4.hacsawduggan.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https:", "data:"]
        }
      },
      crossOriginEmbedderPolicy: false
    },
    cors: {
      origin: [
        'http://localhost:3000',
        'https://2x4.hacsawduggan.com',
        /\.azurewebsites\.net$/
      ],
      credentials: true
    }
  },

  // Logging Configuration
  logging: {
    level: isAzureEnvironment() ? 'info' : 'debug',
    format: isAzureEnvironment() ? 'json' : 'combined',
    enableStudentTracking: process.env.STUDENT_TRACKING_ENABLED === 'true'
  },

  // 2x4 Platform Integration
  platform2x4: {
    enabled: process.env.STUDENT_TRACKING_ENABLED === 'true',
    oauthKey: process.env.PLATFORM_2X4_OAUTH_KEY,
    apiUrl: process.env.PLATFORM_2X4_API_URL || 'https://2x4.hacsawduggan.com',
    retryAttempts: 3,
    timeout: 10000
  }
};

function isAzureEnvironment() {
  return !!(
    process.env.WEBSITE_SITE_NAME ||
    process.env.APPSETTING_WEBSITE_SITE_NAME ||
    process.env.WEBSITE_HOSTNAME
  );
}

function getAzureInstanceInfo() {
  if (!isAzureEnvironment()) return null;

  return {
    siteName: process.env.WEBSITE_SITE_NAME,
    resourceGroup: process.env.WEBSITE_RESOURCE_GROUP,
    subscriptionId: process.env.WEBSITE_OWNER_NAME,
    region: process.env.WEBSITE_SITE_LOCATION || 'unknown',
    instanceId: process.env.WEBSITE_INSTANCE_ID || 'unknown',
    hostname: process.env.WEBSITE_HOSTNAME
  };
}

function getConnectionString() {
  const azureInfo = getAzureInstanceInfo();
  if (azureInfo && azureInfo.hostname) {
    return `https://${azureInfo.hostname}`;
  }

  return `http://localhost:${azureConfig.port}`;
}

module.exports = {
  azureConfig,
  isAzureEnvironment,
  getAzureInstanceInfo,
  getConnectionString
};
