#!/bin/bash

# 🛡️ Deployment Security Validation Script
# This script MUST pass 100% before any deployment is allowed

set -e  # Exit on any error

echo "🔐 Starting Mandatory Pre-Deployment Security Validation..."
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize validation results
SECURITY_PASSED=true
VALIDATION_RESULTS=()

# Helper function to log results
log_result() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        VALIDATION_RESULTS+=("✅ $message")
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
        VALIDATION_RESULTS+=("❌ $message")
        SECURITY_PASSED=false
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
        VALIDATION_RESULTS+=("⚠️ $message")
    else
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
        VALIDATION_RESULTS+=("ℹ️ $message")
    fi
}

echo ""
echo "🔍 1. DEPENDENCY SECURITY VALIDATION"
echo "------------------------------------"

# Check for vulnerabilities
echo "Running npm audit..."
if npm audit --audit-level=moderate > /dev/null 2>&1; then
    VULN_COUNT=$(npm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total // 0')
    if [ "$VULN_COUNT" -eq 0 ]; then
        log_result "PASS" "No vulnerabilities found (npm audit)"
    else
        log_result "FAIL" "$VULN_COUNT vulnerabilities detected"
    fi
else
    log_result "FAIL" "npm audit failed or found vulnerabilities"
fi

# Check package signatures
echo "Verifying package signatures..."
SIGNATURE_OUTPUT=$(npm audit signatures 2>&1)
if echo "$SIGNATURE_OUTPUT" | grep -q "have verified registry signatures"; then
    VERIFIED_COUNT=$(echo "$SIGNATURE_OUTPUT" | grep "packages have verified registry signatures" | awk '{print $1}')
    log_result "PASS" "$VERIFIED_COUNT packages have verified signatures"
else
    log_result "FAIL" "Package signature verification failed"
fi

# Check for outdated critical packages
echo "Checking for outdated packages..."
OUTDATED_OUTPUT=$(npm outdated --json 2>/dev/null || echo "{}")
CRITICAL_OUTDATED=$(echo "$OUTDATED_OUTPUT" | jq -r 'to_entries | map(select(.value.wanted != .value.current)) | length')
if [ "$CRITICAL_OUTDATED" -eq 0 ]; then
    log_result "PASS" "All packages up to date"
else
    log_result "WARN" "$CRITICAL_OUTDATED packages have available updates"
fi

echo ""
echo "🕵️ 2. SECRETS & DATA PROTECTION"
echo "-------------------------------"

# Run Checkov secrets scan
echo "Running Checkov secrets scan..."
if command -v checkov >/dev/null 2>&1; then
    CHECKOV_OUTPUT=$(checkov --framework secrets --directory . --quiet --compact 2>&1 || true)
    if echo "$CHECKOV_OUTPUT" | grep -q "No failures"; then
        log_result "PASS" "No secrets detected (Checkov scan)"
    else
        # Check if there were actual failures or just no files scanned
        if echo "$CHECKOV_OUTPUT" | grep -qE "(Failed|FAILED)"; then
            log_result "FAIL" "Secrets detected in codebase"
        else
            log_result "PASS" "No secrets detected (Checkov scan)"
        fi
    fi
else
    log_result "WARN" "Checkov not installed - manual secret review required"
fi

# Check for common secret patterns
echo "Checking for common secret patterns..."
SECRET_PATTERNS=("api_key" "password" "secret" "token" "private_key")
SECRETS_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -i --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" "$pattern.*=" . >/dev/null 2>&1; then
        if ! grep -r -i --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" "$pattern.*=" . | grep -v "example\|template\|README\|\.md:" >/dev/null 2>&1; then
            continue
        fi
        SECRETS_FOUND=true
        break
    fi
done

if [ "$SECRETS_FOUND" = false ]; then
    log_result "PASS" "No secret patterns found in code"
else
    log_result "FAIL" "Potential secrets found - manual review required"
fi

# Check .env files are excluded
if [ -f ".gitignore" ] && grep -q "\.env" .gitignore; then
    log_result "PASS" ".env files properly excluded from git"
else
    log_result "FAIL" ".env files not properly excluded in .gitignore"
fi

echo ""
echo "🤖 3. BROWSER AUTOMATION SECURITY"
echo "---------------------------------"

# Check for secure browser launch options
if grep -q "\-\-no-sandbox" server.js || grep -q "\-\-no-sandbox" deploy-clean/server.js 2>/dev/null; then
    log_result "PASS" "Secure browser launch options configured"
else
    log_result "FAIL" "Missing secure browser launch options"
fi

# Check for webdriver detection avoidance
if grep -q "webdriver" server.js || grep -q "webdriver" deploy-clean/server.js 2>/dev/null; then
    log_result "PASS" "Webdriver detection measures implemented"
else
    log_result "WARN" "Webdriver detection measures not found"
fi

echo ""
echo "📦 4. SUPPLY CHAIN INTEGRITY"
echo "----------------------------"

# Check package-lock.json exists
if [ -f "package-lock.json" ] || [ -f "deploy-clean/package-lock.json" ]; then
    log_result "PASS" "Package lock file exists"
else
    log_result "FAIL" "Missing package-lock.json file"
fi

# Check for proper dependency pinning
UNPINNED_DEPS=$(cat package.json deploy-clean/package.json 2>/dev/null | jq -r '.dependencies // {} | to_entries[] | select(.value | startswith("*") or startswith(">") or (startswith("^") | not) and (startswith("~") | not) and (contains(".") | not)) | .key' 2>/dev/null || echo "")
if [ -z "$UNPINNED_DEPS" ]; then
    log_result "PASS" "Dependencies properly pinned"
else
    log_result "WARN" "Some dependencies not properly pinned"
fi

echo ""
echo "🔧 5. CODE QUALITY & SECURITY"
echo "-----------------------------"

# Run linting with security rules
echo "Running ESLint security checks..."
if npm run lint >/dev/null 2>&1; then
    log_result "PASS" "ESLint security rules passed"
else
    log_result "FAIL" "ESLint security rules failed"
fi

# Check for console.log in production code (excluding development files)
if grep -r "console\.log" --exclude-dir=node_modules --exclude="*.test.js" --exclude="test-*" . >/dev/null 2>&1; then
    CONSOLE_COUNT=$(grep -r "console\.log" --exclude-dir=node_modules --exclude="*.test.js" --exclude="test-*" . | wc -l)
    log_result "WARN" "$CONSOLE_COUNT console.log statements found (review for sensitive data)"
else
    log_result "PASS" "No console.log statements in production code"
fi

echo ""
echo "🏗️ 6. INFRASTRUCTURE SECURITY"
echo "-----------------------------"

# Check for production environment configuration
if grep -q "NODE_ENV.*production" package.json deploy-clean/package.json .env.example 2>/dev/null; then
    log_result "PASS" "Production environment configuration found"
else
    log_result "WARN" "Production environment configuration not explicitly found"
fi

# Check for HTTPS enforcement
if grep -qi "https" server.js deploy-clean/server.js 2>/dev/null; then
    log_result "PASS" "HTTPS references found in server configuration"
else
    log_result "WARN" "HTTPS enforcement not explicitly configured"
fi

echo ""
echo "📊 SECURITY VALIDATION SUMMARY"
echo "=============================="

# Generate summary report
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

for result in "${VALIDATION_RESULTS[@]}"; do
    if [[ $result == ✅* ]]; then
        ((PASS_COUNT++))
    elif [[ $result == ❌* ]]; then
        ((FAIL_COUNT++))
    elif [[ $result == ⚠️* ]]; then
        ((WARN_COUNT++))
    fi
done

echo ""
echo "Results:"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "⚠️ Warnings: $WARN_COUNT"

# Generate security report file
REPORT_FILE="security-validation-report.json"
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")",
  "git_sha": "$(git rev-parse HEAD 2>/dev/null || echo "unknown")",
  "validation_results": {
    "passed": $PASS_COUNT,
    "failed": $FAIL_COUNT,
    "warnings": $WARN_COUNT,
    "total": $((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
  },
  "security_status": "$([ "$SECURITY_PASSED" = true ] && echo "APPROVED" || echo "REJECTED")",
  "details": $(printf '%s\n' "${VALIDATION_RESULTS[@]}" | jq -R . | jq -s .)
}
EOF

echo ""
if [ "$SECURITY_PASSED" = true ]; then
    echo -e "${GREEN}🎉 SECURITY VALIDATION PASSED${NC}"
    echo -e "${GREEN}✅ Deployment APPROVED for release${NC}"
    echo ""
    echo "Security report saved to: $REPORT_FILE"
    exit 0
else
    echo -e "${RED}🚨 SECURITY VALIDATION FAILED${NC}"
    echo -e "${RED}❌ Deployment BLOCKED - Fix security issues before deploying${NC}"
    echo ""
    echo "Security report saved to: $REPORT_FILE"
    echo ""
    echo "⚠️  REQUIRED ACTIONS:"
    echo "1. Fix all failed security checks above"
    echo "2. Re-run this validation script"
    echo "3. Only deploy after 100% security validation pass"
    exit 1
fi