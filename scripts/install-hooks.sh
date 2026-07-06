#!/usr/bin/env bash
# scripts/install-hooks.sh
# Run once after cloning to install git hooks for this repo.
# Usage: bash scripts/install-hooks.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
SCRIPTS_DIR="$REPO_ROOT/scripts"

install_hook() {
  local HOOK_NAME="$1"
  local HOOK_DEST="$HOOKS_DIR/$HOOK_NAME"

  cat > "$HOOK_DEST" << 'HOOK'
#!/usr/bin/env bash
# Auto-generated pre-commit hook — do not edit directly.
# To update, edit scripts/install-hooks.sh and re-run it.
set -euo pipefail
bash "$(git rev-parse --show-toplevel)/scripts/bump-sw-version.sh"
HOOK

  chmod +x "$HOOK_DEST"
  echo "✅  Installed .git/hooks/$HOOK_NAME"
}

chmod +x "$SCRIPTS_DIR/bump-sw-version.sh"
install_hook "pre-commit"

echo ""
echo "🪝  Git hooks installed. Every commit will now auto-bump the PWA cache version."
echo "    PWA clients will detect the change and show the 'Update' banner within 30s."
