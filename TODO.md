# TODO - Cannabis Extractor API

## 🔥 Immediate Priorities

### 1. Test & Deploy v2.1
- [ ] Test NYPost.com extraction (simple axios pathway)
- [ ] Test Rise Cannabis extraction (Firefox browser emulation pathway)
- [ ] Install Firefox in Azure deployment
- [ ] Deploy to Azure Web App
- [ ] Verify both use cases work in production

### 2. Validate Token Usage
- [ ] Check current token consumption
- [ ] Ensure we have sufficient tokens for Azure deployment testing
- [ ] Monitor usage during deployment process

## 🎯 Core Validation Tasks

### Test Cases to Verify:
- [ ] **NYPost URL autocorrect**: `nypost.com` → `https://www.nypost.com`
- [ ] **Cannabis site detection**: Rise Cannabis triggers Firefox browser emulation
- [ ] **Age verification**: Auto-clicks "Yes, I am 21+" buttons
- [ ] **Product extraction**: Returns structured cannabis data with prices/THC
- [ ] **Fallback behavior**: Browser emulation fails → fallback to axios

## 🚀 Azure Deployment Checklist

### Pre-deployment:
- [x] Code committed to repository
- [ ] Firefox browser dependencies verified
- [ ] Package.json includes playwright
- [ ] Environment variables configured

### Deployment Steps:
- [ ] Deploy clean directory to Azure
- [ ] Install Firefox browser in Azure environment
- [ ] Test health endpoint
- [ ] Test both use cases in production
- [ ] Verify response format includes `browserEmulation` flag

## 📋 Future Enhancements (After v2.1 works)

### Short-term (Next Release):
- [ ] Add more cannabis site detection patterns
- [ ] Improve product selector accuracy
- [ ] Add retry logic for failed browser automation
- [ ] Optimize Firefox launch time

### Medium-term:
- [ ] Azure Blob storage integration for historical tracking
- [ ] Price change notification system
- [ ] Strain availability monitoring
- [ ] API rate limiting and authentication

### Long-term:
- [ ] Support for more dispensary chains
- [ ] Machine learning for product detection
- [ ] Real-time price alerts
- [ ] Compliance and regulatory features

## 🛡️ Security & Quality

### Before Production:
- [ ] Run security scan: `npm run security:scan`
- [ ] Verify no secrets in codebase
- [ ] Test error handling for malformed requests
- [ ] Validate CORS configuration

## 📊 Success Metrics

### v2.1 Success Criteria:
- ✅ Cannabis sites work (Rise Cannabis extracts products)
- ✅ Non-cannabis sites work (NYPost extracts content)
- ✅ Age verification handled automatically
- ✅ Smart fallback prevents total failures
- ✅ Response includes metadata about emulation used

### Performance Targets:
- Cannabis extraction: < 30 seconds
- Simple extraction: < 5 seconds
- Firefox startup: < 10 seconds (cached)
- Zero 403 errors on cannabis sites

## 🚨 Known Issues to Monitor

### Potential Problems:
- [ ] Firefox memory usage in Azure
- [ ] Playwright installation in production
- [ ] Age verification popup variations
- [ ] Site structure changes breaking selectors

### Monitoring:
- [ ] Log all browser automation attempts
- [ ] Track popup handling success rates
- [ ] Monitor extraction accuracy
- [ ] Alert on consistent failures

## 🔄 Rollback Plan

### If v2.1 Fails:
- [ ] Revert to last working commit
- [ ] Deploy simple axios-only version
- [ ] Document lessons learned
- [ ] Plan incremental browser emulation re-introduction

---

**Current Status**: v2.1 code ready, needs testing and Azure deployment
**Next Action**: Test locally, then deploy to Azure Web App
**Success Definition**: Both NYPost and Rise Cannabis work in production