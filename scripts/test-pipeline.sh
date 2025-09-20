#!/bin/bash
# 🧪 Test Complete Pipeline Script
# Creates a simple test commit to trigger all pipeline workflows

set -e

echo "🧪 Testing complete CI/CD pipeline..."

# Create a simple test file
echo "# Pipeline Test $(date)" > PIPELINE_TEST.md

# Add and commit
git add PIPELINE_TEST.md
git commit -m "🧪 test: trigger complete pipeline validation

Test commit to validate end-to-end CI/CD pipeline:
- Smart ACR deployment with change detection
- Security scanning and validation
- Container Apps deployment
- Performance optimizations

Expected: Fast, complete pipeline execution

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger pipeline
git push

echo "✅ Pipeline test commit pushed!"
echo "🔗 Monitor at: https://github.com/pduggusa/genz-translator-api/actions"