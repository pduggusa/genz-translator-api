#!/bin/bash
# Pipeline Failure Issue Creator
# Usage: ./scripts/create-failure-issue.sh [RUN_ID]

set -e

RUN_ID=${1:-$(gh run list --status=failure --limit 1 --json databaseId --jq '.[0].databaseId')}

if [ -z "$RUN_ID" ]; then
    echo "❌ No failed runs found or RUN_ID not provided"
    exit 1
fi

echo "🔍 Creating issue for pipeline run: $RUN_ID"

# Get run details
RUN_INFO=$(gh run view $RUN_ID --json displayTitle,headBranch,conclusion,workflowName,createdAt,url)
TITLE=$(echo "$RUN_INFO" | jq -r '.displayTitle')
BRANCH=$(echo "$RUN_INFO" | jq -r '.headBranch')
WORKFLOW=$(echo "$RUN_INFO" | jq -r '.workflowName')
DATE=$(echo "$RUN_INFO" | jq -r '.createdAt')
RUN_URL=$(echo "$RUN_INFO" | jq -r '.url')

# Check if issue already exists for this run
EXISTING_ISSUE=$(gh issue list --search "Pipeline Failure: $RUN_ID in:title" --json number --jq '.[0].number // empty')

if [ -n "$EXISTING_ISSUE" ]; then
    echo "⚠️ Issue already exists for run $RUN_ID: #$EXISTING_ISSUE"
    echo "🔗 https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/issues/$EXISTING_ISSUE"
    exit 0
fi

# Create the issue
ISSUE_URL=$(gh issue create \
    --title "Pipeline Failure: $TITLE (Run $RUN_ID)" \
    --body "$(cat <<EOF
## 🚨 Pipeline Failure Report

**Run ID:** $RUN_ID
**Workflow:** $WORKFLOW
**Commit:** $TITLE
**Branch:** $BRANCH
**Date:** $DATE

### 🔍 Failure Details
The pipeline failed during execution. See logs for detailed error information.

### 📊 Impact
- Blocking deployment to production
- Preventing builds and releases
- Development workflow interruption

### 🔗 Links
- **Run URL:** $RUN_URL
- **Logs:** Use \`gh run view $RUN_ID --log\` to see full details

### 🛠️ Resolution Status
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Verified in subsequent runs
- [ ] Issue resolved

### 📝 Next Steps
1. Investigate failure cause from logs
2. Implement necessary fixes
3. Verify fix in next pipeline run
4. Close issue when resolved

**Auto-generated issue for pipeline failure tracking**
EOF
)" \
    --label "bug")

echo "✅ Issue created: $ISSUE_URL"
echo "📋 Run: gh issue view $(basename $ISSUE_URL)"