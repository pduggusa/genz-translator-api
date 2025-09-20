# 🏷️ Versioning Guide - hacksaws2x4

This document outlines the versioning strategy and release management for hacksaws2x4.

## 📋 Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes that are not backward compatible
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes that are backward compatible

### Version Examples

```bash
3.0.0 → 3.0.1  # Patch: Bug fix
3.0.1 → 3.1.0  # Minor: New feature
3.1.0 → 4.0.0  # Major: Breaking change
```

## 🚀 Release Types

### Production Releases
- **Format**: `v3.0.0`, `v3.1.0`, `v4.0.0`
- **Trigger**: Git tags matching `v*`
- **Branch**: `main` branch only
- **Validation**: Full security pipeline + tests

### Pre-releases
- **Format**: `v3.1.0-beta.1`, `v3.1.0-rc.1`
- **Trigger**: Git tags with pre-release identifiers
- **Use**: Testing before production release

## 📦 Version Management Commands

### Quick Commands

```bash
# Check current version
npm run version:current

# Show detailed version status
npm run version:status

# Bump versions (automatically pushes to GitHub)
npm run version:patch      # 3.0.0 → 3.0.1
npm run version:minor      # 3.0.0 → 3.1.0
npm run version:major      # 3.0.0 → 4.0.0

# Create release tag for current version
npm run version:tag

# Generate SBOM (Software Bill of Materials)
npm run build:sbom              # Generate both JSON and XML
npm run sbom:generate           # JSON format only
npm run sbom:generate:xml       # XML format only
npm run sbom:validate           # Validate generated SBOM
```

### Dry Run Commands

```bash
# Preview version bumps without making changes
npm run version:dry-run:patch
npm run version:dry-run:minor
npm run version:dry-run:major
```

### Manual Script Usage

```bash
# Using the version script directly
./scripts/version.sh status
./scripts/version.sh patch --dry-run
./scripts/version.sh minor --push
./scripts/version.sh major --dry-run

# Help
./scripts/version.sh --help
```

## 🔄 Automated Release Workflow

Our GitHub Actions workflow automatically handles releases:

### 1. Pre-Release Validation
- ✅ Security scanning (secrets, SAST, dependencies)
- ✅ Full test suite execution
- ✅ Code linting and formatting
- ✅ Container security validation

### 2. Release Creation
- 📝 Automatic release notes generation
- 🏷️ GitHub release creation
- 📦 Container image building (future)
- 🔗 Documentation linking

### 3. Manual Version Bumping
- 🎯 Workflow dispatch for manual version bumps
- 🔄 Automatic tag creation and pushing
- 📋 Version validation and testing

### 4. SBOM Generation
- 📄 Software Bill of Materials (CycloneDX format)
- 🔍 Complete dependency inventory
- 📦 JSON and XML formats included in releases
- 🛡️ Supply chain security documentation

## 🎯 Release Process

### Automated Release (Recommended)

1. **Create version bump via GitHub Actions**:
   ```bash
   # Go to: https://github.com/pduggusa/genz-translator-api/actions/workflows/release.yml
   # Click "Run workflow"
   # Select version type: patch/minor/major
   ```

2. **Release automatically created** when tag is pushed

### Manual Release Process

1. **Ensure clean working directory**:
   ```bash
   git status  # Should be clean
   git checkout main
   git pull origin main
   ```

2. **Run pre-checks**:
   ```bash
   npm run lint
   npm run test:security
   npm run test:ci
   ```

3. **Bump version**:
   ```bash
   npm run version:patch  # or minor/major
   ```

4. **Verify release**:
   - Check [GitHub Releases](https://github.com/pduggusa/genz-translator-api/releases)
   - Verify automated deployment triggered

## 📊 Version History

### Current Version: v3.0.0
- ✅ Complete hacksaws2x4 rebrand
- ✅ Challenging website data extraction
- ✅ Persistent data storage
- ✅ Azure-optimized deployment

### Previous Versions
- `v2.x.x`: Gen Z Translator API
- `v1.x.x`: Initial content extraction

## 🛡️ Security Validation

Every release goes through comprehensive security validation:

### Stage 1: Security Gate
- 🔐 **Secrets Detection**: TruffleHog, Checkov
- 🔍 **SAST Analysis**: Semgrep, ESLint security
- 🔗 **Dependency Security**: NPM audit, Snyk
- 📜 **License Compliance**: GPL/AGPL blocking

### Stage 2: Testing
- 🧪 **Multi-Node.js**: 18.x and 20.x validation
- 🔒 **Security Tests**: Priority execution
- ⚡ **Performance**: Response time monitoring

### Stage 3: Container Security
- 🐳 **Vulnerability Scanning**: Trivy analysis
- 🏷️ **Security Labels**: Comprehensive metadata
- 👤 **Non-root Execution**: Secure user implementation

## 🔧 Configuration

### GitHub Secrets Required
- `GITHUB_TOKEN`: Automatically provided
- `NPM_TOKEN`: For NPM publishing (optional)

### Branch Protection
- `main` branch protected
- Require status checks before merging
- Require up-to-date branches

## 📚 Best Practices

### When to Bump Versions

#### Patch (3.0.0 → 3.0.1)
- 🐛 Bug fixes
- 📝 Documentation updates
- 🔧 Minor configuration changes
- 🛡️ Security patches

#### Minor (3.0.0 → 3.1.0)
- ✨ New features (backward compatible)
- 🔧 New configuration options
- 📈 Performance improvements
- 🔌 New API endpoints

#### Major (3.0.0 → 4.0.0)
- 💥 Breaking API changes
- 🔄 Architectural changes
- 📦 Dependency major updates
- 🗑️ Deprecated feature removal

### Pre-Release Process
1. Create feature branch
2. Test thoroughly
3. Merge to `main`
4. Create pre-release tag: `v3.1.0-beta.1`
5. Test in staging environment
6. Create production release: `v3.1.0`

### Release Notes Guidelines
- 📋 Use clear, descriptive language
- 🔗 Link to relevant issues/PRs
- 🛡️ Highlight security improvements
- 📖 Include migration instructions for breaking changes

## 🚨 Emergency Releases

For critical security fixes:

```bash
# Emergency patch release
git checkout main
git pull origin main
# Apply critical fix
git add .
git commit -m "🚨 security: critical vulnerability fix"
npm run version:patch
```

The automated workflow will handle the rest.

## 📞 Support

For versioning questions or issues:
- 📧 Open a GitHub issue
- 📖 Check [GitHub Releases](https://github.com/pduggusa/genz-translator-api/releases)
- 🔍 Review [GitHub Actions](https://github.com/pduggusa/genz-translator-api/actions)

---

**Last Updated**: $(date +"%Y-%m-%d")
**Current Version**: v3.0.0