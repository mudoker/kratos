#!/usr/bin/env bash
# scripts/bump-sw-version.sh
# Increments the kratos-vN cache version in public/sw.js and stages the file.
# Called automatically by the pre-commit git hook.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SW_FILE="$REPO_ROOT/public/sw.js"

if [[ ! -f "$SW_FILE" ]]; then
  echo "⚠️  bump-sw-version: $SW_FILE not found, skipping."
  exit 0
fi

# Extract current version number
CURRENT=$(grep -oP 'kratos-v\K[0-9]+' "$SW_FILE" | head -1)

if [[ -z "$CURRENT" ]]; then
  echo "⚠️  bump-sw-version: Could not find 'kratos-vN' in $SW_FILE, skipping."
  exit 0
fi

NEXT=$((CURRENT + 1))

# Replace the version in-place
sed -i "s/kratos-v${CURRENT}/kratos-v${NEXT}/" "$SW_FILE"

# Stage the updated sw.js so the version bump is part of this commit
git add "$SW_FILE"

echo "🔄  PWA cache bumped: kratos-v${CURRENT} → kratos-v${NEXT}"
