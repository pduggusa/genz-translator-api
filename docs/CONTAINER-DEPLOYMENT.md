# 🚀 Azure Container Registry Deployment Guide

## Overview

This guide covers deploying the Cannabis Extractor API using Azure Container Registry with automatic artifact refresh and scaling.

## 🏗️ Architecture

### **Container Infrastructure**
- **Registry**: `genztranslatoracr.azurecr.io`
- **Region**: US Central
- **Environment**: `genz-translator-env`
- **Scaling**: Auto-scale 1-3 replicas
- **Security**: Multi-stage builds with mandatory validation

### **Deployment Flow**
1. **Security Validation** - Blocks deployment on any security issues
2. **Multi-Stage Build** - Optimized container with security scanning
3. **Registry Push** - Versioned artifacts in Azure Container Registry
4. **Container Apps** - Auto-scaling deployment in US Central
5. **Health Checks** - Automated validation of deployed service

## 🔄 Automatic Deployment

### **Trigger Deployment**
```bash
# Any push to main branch triggers automatic deployment
git add .
git commit -m "Deploy cannabis extractor updates"
git push origin main
```

### **Monitor Deployment**
```bash
# Check deployment status
az containerapp show --name genz-translator-api --resource-group dugganusa-RG

# Get live deployment URL
az containerapp show --name genz-translator-api --resource-group dugganusa-RG \
  --query "properties.configuration.ingress.fqdn" --output tsv

# View logs
az containerapp logs show --name genz-translator-api --resource-group dugganusa-RG
```

## 🛡️ Security Features

### **Build-Time Security**
- **Mandatory validation** in container build process
- **Secrets scanning** with Checkov
- **Dependency auditing** with npm audit
- **Code quality** enforcement with ESLint
- **Supply chain** integrity verification

### **Runtime Security**
- **Non-root user** execution
- **Secure browser** launch options
- **Resource limits** (0.5 CPU, 1Gi memory)
- **Network isolation** with Container Apps
- **HTTPS enforcement** with automatic SSL

## 📊 Container Specifications

### **Resource Configuration**
```yaml
Resources:
  CPU: 0.5 cores
  Memory: 1Gi
  Storage: Ephemeral

Scaling:
  Min Replicas: 1
  Max Replicas: 3
  Scale Trigger: CPU > 70% or Memory > 80%

Networking:
  Port: 3000
  Protocol: HTTP/HTTPS
  External Ingress: Enabled
```

### **Environment Variables**
```bash
NODE_ENV=production
PORT=3000
PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright
```

## 🚀 Container Build Process

### **Multi-Stage Dockerfile**
1. **Security Validator** - Runs mandatory security checks
2. **Production Builder** - Installs dependencies and Firefox
3. **Runtime** - Minimal runtime image with security hardening

### **Security Validation Stage**
```dockerfile
# Stage 1: Security validation blocks build on any failure
RUN ./scripts/deploy-security-check.sh || \
    (echo "❌ SECURITY VALIDATION FAILED - BUILD BLOCKED" && exit 1)
```

## 📈 Performance & Scaling

### **Auto-Scaling Triggers**
- **CPU**: Scales when usage > 70%
- **Memory**: Scales when usage > 80%
- **Requests**: Scales based on incoming traffic
- **Schedule**: Can be configured for predictable loads

### **Cold Start Optimization**
- **Firefox pre-installed** in container image
- **Dependencies cached** in image layers
- **Health check** ensures readiness before traffic
- **Warm instances** maintained for faster response

## 🔧 Management Commands

### **Manual Container Operations**
```bash
# Force deployment refresh
az containerapp revision restart --name genz-translator-api --resource-group dugganusa-RG

# Scale manually
az containerapp update --name genz-translator-api --resource-group dugganusa-RG \
  --min-replicas 2 --max-replicas 5

# Update image from registry
az containerapp update --name genz-translator-api --resource-group dugganusa-RG \
  --image genztranslatoracr.azurecr.io/cannabis-extractor-api:latest
```

### **Registry Management**
```bash
# List images in registry
az acr repository list --name genztranslatoracr

# Show image tags
az acr repository show-tags --name genztranslatoracr --repository cannabis-extractor-api

# Delete old images
az acr repository delete --name genztranslatoracr --image cannabis-extractor-api:old-tag
```

## 📋 Health Monitoring

### **Built-in Health Checks**
- **Health endpoint**: `https://your-app.centralus.azurecontainerapps.io/health`
- **Cannabis extraction test**: Validates core functionality
- **Security headers**: Verifies security configurations
- **Performance metrics**: CPU, memory, response times

### **Monitoring Commands**
```bash
# Test health endpoint
curl -f https://your-app.centralus.azurecontainerapps.io/health

# Test cannabis extraction
curl -X POST https://your-app.centralus.azurecontainerapps.io/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Check container metrics
az monitor metrics list --resource /subscriptions/.../genz-translator-api
```

## 🎯 Benefits

### **Operational Excellence**
- ✅ **Zero-downtime deployments** with revision management
- ✅ **Automatic scaling** based on demand
- ✅ **Consistent environments** across dev/staging/prod
- ✅ **Rollback capability** to previous container versions

### **Security & Compliance**
- ✅ **Mandatory security validation** blocks insecure deployments
- ✅ **Container isolation** prevents interference
- ✅ **Secrets management** with Azure Key Vault integration
- ✅ **Audit trail** of all deployments and changes

### **Cost Efficiency**
- ✅ **Pay-per-use** scaling model
- ✅ **Resource optimization** with container limits
- ✅ **Shared infrastructure** costs in Container Apps
- ✅ **Automatic shutdown** of idle replicas

---

## 🔑 Quick Reference

**Registry**: `genztranslatoracr.azurecr.io`
**Environment**: `genz-translator-env`
**Region**: US Central
**Scaling**: 1-3 replicas
**Security**: Zero-tolerance validation

**Deploy**: `git push origin main`
**Monitor**: `az containerapp show --name genz-translator-api --resource-group dugganusa-RG`
**Logs**: `az containerapp logs show --name genz-translator-api --resource-group dugganusa-RG`