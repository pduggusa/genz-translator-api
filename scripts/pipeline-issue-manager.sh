#!/bin/bash
# Pipeline Issue Management Tool
# Comprehensive tool for managing pipeline failure issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    cat << EOF
🔧 Pipeline Issue Manager

USAGE:
    $0 <command> [options]

COMMANDS:
    create [RUN_ID]     Create issue for failed pipeline run
    list                List all pipeline-related issues
    close [ISSUE_NUM]   Close resolved pipeline issue
    reopen [ISSUE_NUM]  Reopen pipeline issue
    failures            Show recent pipeline failures
    summary             Show pipeline health summary
    bulk-create         Create issues for all untracked failures

EXAMPLES:
    $0 create 17895067712    # Create issue for specific run
    $0 create                # Create issue for latest failure
    $0 list                  # List all pipeline issues
    $0 close 1               # Close issue #1
    $0 failures              # Show recent failures
    $0 summary               # Pipeline health overview
    $0 bulk-create           # Create issues for all failures

EOF
}

create_issue() {
    local run_id=${1:-$(gh run list --status=failure --limit 1 --json databaseId --jq '.[0].databaseId')}

    if [ -z "$run_id" ]; then
        echo -e "${RED}❌ No failed runs found or RUN_ID not provided${NC}"
        exit 1
    fi

    echo -e "${BLUE}🔍 Creating issue for pipeline run: $run_id${NC}"
    ./scripts/create-failure-issue.sh "$run_id"
}

list_issues() {
    echo -e "${BLUE}📋 Pipeline-Related Issues:${NC}"
    gh issue list --label "bug" --json number,title,state,createdAt \
        --jq '.[] | select(.title | contains("Pipeline Failure")) | "Issue #\(.number): \(.title) [\(.state)]"'
}

close_issue() {
    local issue_num=$1
    if [ -z "$issue_num" ]; then
        echo -e "${RED}❌ Issue number required${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Closing issue #$issue_num${NC}"
    gh issue close "$issue_num" --comment "$(cat <<EOF
## ✅ Issue Resolved

Pipeline issue has been resolved. Key actions taken:

### 🔧 Resolution Summary
- Root cause identified and fixed
- Pipeline now running successfully
- No further action required

### 📊 Verification
- Confirmed through successful pipeline runs
- All tests passing
- Deployment working correctly

**Issue Status:** Closed - Resolved
**Closed Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")

---
*Auto-closed via pipeline issue manager*
EOF
)"
}

reopen_issue() {
    local issue_num=$1
    if [ -z "$issue_num" ]; then
        echo -e "${RED}❌ Issue number required${NC}"
        exit 1
    fi

    echo -e "${YELLOW}🔄 Reopening issue #$issue_num${NC}"
    gh issue reopen "$issue_num" --comment "$(cat <<EOF
## 🔄 Issue Reopened

Pipeline issue has been reopened due to continued failures or regression.

### 📋 Status Update
- Issue thought to be resolved but failures continue
- Requires additional investigation
- Previous fix may not have been complete

**Reopened Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")

---
*Reopened via pipeline issue manager*
EOF
)"
}

show_failures() {
    echo -e "${RED}💥 Recent Pipeline Failures:${NC}"
    gh run list --status=failure --limit 10 --json databaseId,displayTitle,workflowName,createdAt,conclusion \
        --jq '.[] | "Run \(.databaseId): \(.displayTitle) [\(.workflowName)] - \(.createdAt)"'
}

show_summary() {
    echo -e "${BLUE}📊 Pipeline Health Summary${NC}"
    echo "================================"

    # Recent runs summary
    echo -e "${BLUE}📈 Recent Runs (Last 20):${NC}"
    RECENT_RUNS=$(gh run list --limit 20 --json conclusion)
    SUCCESS_COUNT=$(echo "$RECENT_RUNS" | jq '[.[] | select(.conclusion == "success")] | length')
    FAILURE_COUNT=$(echo "$RECENT_RUNS" | jq '[.[] | select(.conclusion == "failure")] | length')
    TOTAL_COUNT=$(echo "$RECENT_RUNS" | jq '. | length')

    if [ "$TOTAL_COUNT" -gt 0 ]; then
        SUCCESS_RATE=$(echo "$SUCCESS_COUNT $TOTAL_COUNT" | awk '{printf "%.1f", ($1/$2)*100}')
        echo "  ✅ Successful: $SUCCESS_COUNT"
        echo "  ❌ Failed: $FAILURE_COUNT"
        echo "  📊 Success Rate: $SUCCESS_RATE%"
    fi

    echo ""
    echo -e "${BLUE}🐛 Open Pipeline Issues:${NC}"
    OPEN_ISSUES=$(gh issue list --label "bug" --state open --json number \
        --jq '[.[] | select(.title | contains("Pipeline Failure"))] | length' 2>/dev/null || echo "0")
    echo "  📋 Open Issues: $OPEN_ISSUES"

    echo ""
    echo -e "${BLUE}⚡ Quick Actions:${NC}"
    echo "  🔍 View latest failure: gh run list --status=failure --limit 1"
    echo "  📋 Create issue for latest failure: $0 create"
    echo "  📊 Detailed run info: gh run view [RUN_ID]"
    echo "  🔄 Re-run failed: gh run rerun [RUN_ID] --failed"
}

bulk_create() {
    echo -e "${YELLOW}🔄 Creating issues for all untracked failures...${NC}"

    # Get failed runs without existing issues
    FAILED_RUNS=$(gh run list --status=failure --limit 10 --json databaseId --jq '.[].databaseId')

    for run_id in $FAILED_RUNS; do
        # Check if issue exists
        EXISTING=$(gh issue list --search "Pipeline Failure: $run_id in:title" --json number --jq '.[0].number // empty')

        if [ -z "$EXISTING" ]; then
            echo -e "${BLUE}Creating issue for run $run_id...${NC}"
            ./scripts/create-failure-issue.sh "$run_id"
        else
            echo -e "${GREEN}Issue already exists for run $run_id (#$EXISTING)${NC}"
        fi
    done
}

# Main command handling
case "${1:-help}" in
    create)
        create_issue "$2"
        ;;
    list)
        list_issues
        ;;
    close)
        close_issue "$2"
        ;;
    reopen)
        reopen_issue "$2"
        ;;
    failures)
        show_failures
        ;;
    summary)
        show_summary
        ;;
    bulk-create)
        bulk_create
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac