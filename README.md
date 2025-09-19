# 🌿 Cannabis Extractor API

Security-validated content extraction API with browser automation and automatic Azure Container Registry deployment.

## 🚀 Quick Start

**Deploy to Production:**
```bash
git push origin main  # Triggers automatic container deployment
```

**Azure Infrastructure:**
- **Registry**: `genztranslatoracr.azurecr.io`
- **Region**: US Central
- **Auto-scaling**: 1-3 replicas
- **Security**: Zero-tolerance validation

## 🛡️ Security-First Architecture

This API implements enterprise-grade security validation that **blocks all deployments** until 100% security compliance is achieved.

## Features

- 🛡️ **Mandatory security validation** - Blocks deployment on any security issues
- 🤖 **Browser automation** with Playwright Firefox
- 🌿 **Cannabis content detection** with keyword analysis
- 📦 **Container deployment** with Azure Container Registry
- ⚡ **Auto-scaling** 1-3 replicas based on load
- 🔒 **Zero-trust security** with multi-stage validation

## Local Development

```bash
# Run security validation (required before deployment)
npm run security:validate

# Start development server
npm run dev

# Run complete deployment check
npm run deploy:check
```

## API Endpoints

- `POST /extract` - Cannabis content extraction with count analysis
- `GET /health` - Health check with security validation status

## Container Deployment

**Automatic Deployment:**
Any push to `main` branch triggers:
1. 🛡️ Mandatory security validation
2. 🏗️ Multi-stage container build
3. 📦 Push to Azure Container Registry
4. 🚀 Deploy to Container Apps (US Central)
5. ✅ Post-deployment validation

**Manual Operations:**
```bash
# Monitor deployment
az containerapp show --name genz-translator-api --resource-group dugganusa-RG

# View logs
az containerapp logs show --name genz-translator-api --resource-group dugganusa-RG
```

## Security Documentation

- [`SECURITY-DEPLOYMENT-GUIDE.md`](docs/SECURITY-DEPLOYMENT-GUIDE.md) - Complete security procedures
- [`CONTAINER-DEPLOYMENT.md`](docs/CONTAINER-DEPLOYMENT.md) - Container deployment guide
- [`SECURITY-INTEGRATION-SUMMARY.md`](SECURITY-INTEGRATION-SUMMARY.md) - Security implementation overview

## License

MIT License
