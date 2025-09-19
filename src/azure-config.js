// TODO: Add the complete Azure configuration
// This should include the Azure App Service Configuration code

const azureConfig = {
  port: process.env.PORT || 3000,
  browser: {
    maxConcurrent: 2,
    timeout: 25000
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000,
    max: 50
  }
};

function isAzureEnvironment() {
  return !!(process.env.WEBSITE_SITE_NAME || process.env.APPSETTING_WEBSITE_SITE_NAME);
}

module.exports = {
  azureConfig,
  isAzureEnvironment
};
