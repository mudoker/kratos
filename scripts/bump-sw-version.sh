#!/usr/bin/env bash
# scripts/bump-sw-version.sh
# Increments the kratos-vN cache version in public/sw.js and stages the file.
# Called automatically by the pre-commit git hook.
# Usage:
#   scripts/bump-sw-version.sh [patch|minor|major|--patch|--minor|--major]
#   KRATOS_VERSION_BUMP=minor git commit -m "..."
#   git -c kratos.versionBump=major commit -m "..."

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SW_FILE="$REPO_ROOT/public/sw.js"
BUMP_ARG="${1:-${KRATOS_VERSION_BUMP:-$(git config --get kratos.versionBump || true)}}"
BUMP_KIND="${BUMP_ARG#--}"

if [[ -z "$BUMP_KIND" ]]; then
  BUMP_KIND="patch"
fi

case "$BUMP_KIND" in
  major|minor|patch)
    ;;
  *)
    echo "❌  bump-sw-version: Unknown bump kind '$BUMP_ARG'. Use patch, minor, or major."
    exit 1
    ;;
esac

if [[ ! -f "$SW_FILE" ]]; then
  echo "⚠️  bump-sw-version: $SW_FILE not found, skipping."
  exit 0
fi

# Extract current semantic version from SW_VERSION.
CURRENT=$(grep -oE 'SW_VERSION = "[0-9]+\.[0-9]+\.[0-9]+"' "$SW_FILE" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')

if [[ -z "$CURRENT" ]]; then
  echo "⚠️  bump-sw-version: Could not find SW_VERSION in $SW_FILE, skipping."
  exit 0
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "$BUMP_KIND" in
  major)
    NEXT="$((MAJOR + 1)).0.0"
    ;;
  minor)
    NEXT="${MAJOR}.$((MINOR + 1)).0"
    ;;
  patch)
    NEXT="${MAJOR}.${MINOR}.$((PATCH + 1))"
    ;;
esac

# Replace the version in-place
sed -i "s/SW_VERSION = \"${CURRENT}\"/SW_VERSION = \"${NEXT}\"/" "$SW_FILE"

# Stage the updated sw.js so the version bump is part of this commit
git add "$SW_FILE"

echo "🔄  PWA cache bumped (${BUMP_KIND}): kratos-v${CURRENT} → kratos-v${NEXT}"
