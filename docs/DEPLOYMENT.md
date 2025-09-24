# =€ Vibe Coding Academy - Deployment Guide

## Local Development (Start Here!)

### Quick Start
```bash
# Clone and setup
git clone <your-fork-url>
cd genz-translator-api
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Azure credentials (optional for basic features)

# Start the academy
npm start
# Visit http://localhost:3000
```

## Production Deployment (Advanced Students)

### Azure Container Apps (Recommended)
```bash
# Build and deploy to Azure
az acr build --registry <your-registry> --image vibe-academy:latest .
az containerapp update --name vibe-academy --resource-group <your-rg> --image <your-registry>.azurecr.io/vibe-academy:latest
```

### Docker Deployment
```bash
# Build container
docker build -t vibe-academy .

# Run locally
docker run -p 3000:3000 --env-file .env vibe-academy

# Deploy to your cloud provider
docker tag vibe-academy your-registry/vibe-academy:latest
docker push your-registry/vibe-academy:latest
```

## Environment Configuration

### Required Variables
```bash
NODE_ENV=production
PORT=3000
VERSION=1.0.0
```

### Optional Azure Integration
```bash
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=your-resource-group
AZURE_CONTAINER_REGISTRY=your-registry
```

### Security Settings
```bash
ALLOWED_ORIGINS=https://your-domain.com
API_RATE_LIMIT=100
```

## Elite Performance Standards

### Pre-Deployment Checklist
- [ ] Security scan passes (`npm run test:security`)
- [ ] All tests pass (`npm test`)
- [ ] Performance validates (< 1 second response times)
- [ ] Documentation updated
- [ ] Environment variables secured

### Health Monitoring
```bash
# Check application health
curl https://your-domain.com/api/health

# Monitor performance
curl https://your-domain.com/api/metrics
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change PORT in .env
2. **Permission errors**: Check file permissions
3. **Azure authentication**: Verify credentials in .env
4. **Memory issues**: Increase container memory allocation

### Performance Optimization
- Enable compression middleware
- Configure proper caching headers
- Monitor response times
- Scale based on load

## Security Best Practices

### Never Commit
- .env files
- Azure credentials
- API keys or tokens
- Personal information

### Always Enable
- HTTPS in production
- Rate limiting
- Security headers
- Access logging

## Student Success Tracking

When successfully deployed, the academy automatically:
- Tracks anonymous usage metrics
- Reports successful environment setups to 2x4.hacksawduggan.com
- Measures learning progression
- Validates Elite-level performance

Ready to deploy your first Elite-level application? Follow this guide and join the DORA Elite performers!

---

*Deployment is just the beginning. Elite developers deploy multiple times daily with zero failures.*