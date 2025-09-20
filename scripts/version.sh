#!/bin/bash
# scripts/version.sh
# Version management script for hacksaws2x4

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "🚀 hacksaws2x4 Version Management"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  current     Show current version"
    echo "  patch       Bump patch version (1.0.0 -> 1.0.1)"
    echo "  minor       Bump minor version (1.0.0 -> 1.1.0)"
    echo "  major       Bump major version (1.0.0 -> 2.0.0)"
    echo "  tag         Create tag for current version"
    echo "  release     Create and push release tag"
    echo "  status      Show version and git status"
    echo ""
    echo "Options:"
    echo "  --dry-run   Show what would be done without making changes"
    echo "  --push      Push changes and tags to remote"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 current                    # Show current version"
    echo "  $0 patch --dry-run           # Preview patch bump"
    echo "  $0 minor --push              # Bump minor and push"
    echo "  $0 release                   # Create release tag"
}

# Function to get current version
get_current_version() {
    node -p "require('./package.json').version" 2>/dev/null || echo "unknown"
}

# Function to validate git status
check_git_status() {
    if [[ -n $(git status --porcelain) ]]; then
        print_error "Working directory is not clean. Please commit or stash changes first."
        git status --short
        exit 1
    fi
}

# Function to run pre-version checks
run_pre_checks() {
    print_status "Running pre-version checks..."

    # Check if on main branch
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        print_warning "Not on main branch (currently on: $current_branch)"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check git status
    check_git_status

    # Run tests and linting
    print_status "Running tests and linting..."
    npm run lint || {
        print_error "Linting failed"
        exit 1
    }

    npm run test:ci || {
        print_error "Tests failed"
        exit 1
    }

    # Generate SBOM
    print_status "Generating SBOM..."
    npm run build:sbom || {
        print_error "SBOM generation failed"
        exit 1
    }

    print_success "Pre-checks completed (including SBOM generation)"
}

# Function to bump version
bump_version() {
    local version_type=$1
    local dry_run=$2
    local push_changes=$3

    if [[ "$dry_run" == "true" ]]; then
        print_status "DRY RUN: Would bump $version_type version"
        local current_version=$(get_current_version)
        print_status "Current version: $current_version"

        # Calculate what the new version would be
        case $version_type in
            patch)
                local new_version=$(npm version patch --no-git-tag-version --dry-run 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "calculate-error")
                ;;
            minor)
                local new_version=$(npm version minor --no-git-tag-version --dry-run 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "calculate-error")
                ;;
            major)
                local new_version=$(npm version major --no-git-tag-version --dry-run 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "calculate-error")
                ;;
        esac

        print_status "Would create version: v$new_version"
        return 0
    fi

    # Run pre-checks
    run_pre_checks

    # Bump version
    print_status "Bumping $version_type version..."
    npm version $version_type --no-git-tag-version

    local new_version=$(get_current_version)
    print_success "Version bumped to: $new_version"

    # Commit changes
    git add package.json package-lock.json
    git commit -m "🔢 bump: version $new_version

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    # Create tag
    git tag -a "v$new_version" -m "🚀 Release v$new_version

Automated $version_type version bump.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    print_success "Created tag: v$new_version"

    # Push if requested
    if [[ "$push_changes" == "true" ]]; then
        print_status "Pushing changes and tags..."
        git push origin main
        git push origin "v$new_version"
        print_success "Changes and tags pushed to remote"

        # Show GitHub release URL
        local repo_url=$(git remote get-url origin | sed 's/\.git$//')
        if [[ "$repo_url" =~ github\.com ]]; then
            print_success "GitHub release will be created automatically at:"
            echo "  $repo_url/releases/tag/v$new_version"
        fi
    else
        print_warning "Changes committed locally. Use --push to push to remote."
        print_status "To push manually:"
        echo "  git push origin main"
        echo "  git push origin v$new_version"
    fi
}

# Function to create release tag
create_release() {
    local push_changes=$1

    run_pre_checks

    local current_version=$(get_current_version)
    local tag_name="v$current_version"

    # Check if tag already exists
    if git tag -l | grep -q "^$tag_name$"; then
        print_error "Tag $tag_name already exists"
        exit 1
    fi

    print_status "Creating release tag for version $current_version..."

    # Create annotated tag
    git tag -a "$tag_name" -m "🚀 Release $tag_name

Current version release.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    print_success "Created release tag: $tag_name"

    # Push if requested
    if [[ "$push_changes" == "true" ]]; then
        print_status "Pushing tag..."
        git push origin "$tag_name"
        print_success "Tag pushed to remote"

        # Show GitHub release URL
        local repo_url=$(git remote get-url origin | sed 's/\.git$//')
        if [[ "$repo_url" =~ github\.com ]]; then
            print_success "GitHub release will be created automatically at:"
            echo "  $repo_url/releases/tag/$tag_name"
        fi
    else
        print_warning "Tag created locally. Use --push to push to remote."
        print_status "To push manually:"
        echo "  git push origin $tag_name"
    fi
}

# Function to show version status
show_status() {
    local current_version=$(get_current_version)
    local latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
    local commit_count=$(git rev-list --count HEAD 2>/dev/null || echo "unknown")
    local current_branch=$(git branch --show-current)

    echo "🚀 hacksaws2x4 Version Status"
    echo "═══════════════════════════════"
    echo "📦 Package Version:    $current_version"
    echo "🏷️  Latest Tag:        $latest_tag"
    echo "🌿 Current Branch:     $current_branch"
    echo "📊 Total Commits:      $commit_count"
    echo ""

    # Show git status
    if [[ -n $(git status --porcelain) ]]; then
        echo "⚠️  Working Directory Status:"
        git status --short
    else
        echo "✅ Working directory is clean"
    fi

    # Show recent tags
    echo ""
    echo "🏷️  Recent Tags:"
    git tag -l --sort=-version:refname | head -5 || echo "  No tags found"

    # Show recent commits
    echo ""
    echo "📝 Recent Commits:"
    git log --oneline -5
}

# Parse command line arguments
COMMAND=""
DRY_RUN=false
PUSH_CHANGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        current|patch|minor|major|tag|release|status)
            COMMAND=$1
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --push)
            PUSH_CHANGES=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found"
    exit 1
fi

# Execute command
case $COMMAND in
    current)
        echo $(get_current_version)
        ;;
    patch|minor|major)
        bump_version $COMMAND $DRY_RUN $PUSH_CHANGES
        ;;
    tag)
        create_release $PUSH_CHANGES
        ;;
    release)
        create_release $PUSH_CHANGES
        ;;
    status)
        show_status
        ;;
    "")
        print_error "No command specified"
        show_usage
        exit 1
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac