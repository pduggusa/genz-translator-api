#!/bin/bash

# 🤖 Secure Claude Documentation Update Script
# Updates local CLAUDE.md without triggering CI/CD builds
# Maintains development continuity while preserving security

set -euo pipefail

# Configuration
CLAUDE_DOC="CLAUDE.md"
BACKUP_DIR=".claude-backups"
MAX_BACKUPS=10
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create backup
create_backup() {
    if [ -f "$CLAUDE_DOC" ]; then
        local backup_file="${BACKUP_DIR}/${CLAUDE_DOC}.${TIMESTAMP}"
        cp "$CLAUDE_DOC" "$backup_file"
        log_success "Created backup: $backup_file"

        # Clean up old backups (keep only MAX_BACKUPS)
        local backup_count=$(ls -1 "${BACKUP_DIR}/${CLAUDE_DOC}".* 2>/dev/null | wc -l)
        if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
            ls -1t "${BACKUP_DIR}/${CLAUDE_DOC}".* | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
            log_info "Cleaned up old backups (keeping $MAX_BACKUPS most recent)"
        fi
    fi
}

# Function to update session metadata
update_session_metadata() {
    local temp_file=$(mktemp)

    if [ -f "$CLAUDE_DOC" ]; then
        # Update existing file
        sed -E "s/- \*\*Session Started\*\*:.*/- **Session Updated**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")/" "$CLAUDE_DOC" > "$temp_file"
    else
        # Create new file from template
        cat > "$temp_file" << EOF
# 🤖 Claude Development Continuity Log
# Local Documentation - NOT TRACKED IN GIT

## 📋 Session Metadata
- **Project**: hacksaws2x4 v3.0.0 - Advanced Data Extraction Engine
- **Session Started**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- **Current Branch**: $(git branch --show-current 2>/dev/null || echo "unknown")
- **Last Commit**: $(git log -1 --format="%h - %s" 2>/dev/null || echo "unknown")
- **Production Status**: Live and operational

## 🏷️ Current Tags
$(git tag --sort=-version:refname | head -5 | sed 's/^/- /' || echo "- No tags found")

## 📊 Session Progress
- Tasks completed in this session: 0
- Documentation updates: 1
- Security validations passed: Pending
- DORA metrics maintained: Elite status

## 🎯 Active Focus Areas
1. Continuity documentation improvements
2. Student curriculum development
3. Tagging strategy implementation
4. Architecture documentation updates
5. Case study enhancements

---
**🔒 SECURITY NOTE**: This file contains strategic information and should remain local only.
EOF
    fi

    mv "$temp_file" "$CLAUDE_DOC"
}

# Function to add session entry
add_session_entry() {
    local entry_type="$1"
    local description="$2"
    local temp_file=$(mktemp)

    # Add entry to session log
    {
        head -n -3 "$CLAUDE_DOC"
        echo ""
        echo "## 📝 Session Entry - $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
        echo "- **Type**: $entry_type"
        echo "- **Description**: $description"
        echo "- **Git Status**: $(git status --porcelain | wc -l) files modified"
        echo "- **Branch**: $(git branch --show-current 2>/dev/null || echo "unknown")"
        echo ""
        echo "---"
        echo "**🔒 SECURITY NOTE**: This file contains strategic information and should remain local only."
    } > "$temp_file"

    mv "$temp_file" "$CLAUDE_DOC"
}

# Function to validate git ignore
validate_gitignore() {
    if ! grep -q "CLAUDE.md" .gitignore; then
        log_warning "CLAUDE.md not found in .gitignore"
        echo "CLAUDE.md" >> .gitignore
        log_success "Added CLAUDE.md to .gitignore"
    fi

    if ! grep -q ".claude-backups" .gitignore; then
        echo ".claude-backups/" >> .gitignore
        log_success "Added .claude-backups/ to .gitignore"
    fi
}

# Function to check for sensitive content
check_sensitive_content() {
    local file="$1"
    local sensitive_patterns=(
        "password"
        "secret"
        "key.*="
        "token.*="
        "connectionstring"
        "azure.*key"
        "api.*key"
    )

    for pattern in "${sensitive_patterns[@]}"; do
        if grep -i "$pattern" "$file" >/dev/null 2>&1; then
            log_warning "Potential sensitive content detected: $pattern"
            return 1
        fi
    done

    return 0
}

# Main execution
main() {
    local action="${1:-update}"
    local description="${2:-"Documentation update"}"

    log_info "Starting Claude documentation update..."

    # Validate environment
    validate_gitignore

    # Create backup
    create_backup

    case "$action" in
        "init")
            log_info "Initializing Claude documentation..."
            update_session_metadata
            log_success "Claude documentation initialized"
            ;;
        "update")
            log_info "Updating session metadata..."
            update_session_metadata
            log_success "Session metadata updated"
            ;;
        "entry")
            log_info "Adding session entry..."
            add_session_entry "Manual Entry" "$description"
            log_success "Session entry added"
            ;;
        "task")
            log_info "Adding task completion entry..."
            add_session_entry "Task Completion" "$description"
            log_success "Task completion logged"
            ;;
        "milestone")
            log_info "Adding milestone entry..."
            add_session_entry "Milestone Achievement" "$description"
            log_success "Milestone logged"
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Usage: $0 [init|update|entry|task|milestone] [description]"
            exit 1
            ;;
    esac

    # Validate content
    if check_sensitive_content "$CLAUDE_DOC"; then
        log_success "Security validation passed"
    else
        log_error "Security validation failed - please review content"
        exit 1
    fi

    # Verify file is ignored by git
    if git check-ignore "$CLAUDE_DOC" >/dev/null 2>&1; then
        log_success "File properly ignored by git"
    else
        log_error "WARNING: File not ignored by git!"
        exit 1
    fi

    log_success "Claude documentation update completed successfully"
    log_info "Backup stored in: ${BACKUP_DIR}/"
}

# Execute main function with all arguments
main "$@"