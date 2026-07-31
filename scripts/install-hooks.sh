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
bash "$(git rev-parse --show-toplevel)/scripts/bump-sw-version.sh" "${KRATOS_VERSION_BUMP:-$(git config --get kratos.versionBump || true)}"
HOOK

  chmod +x "$HOOK_DEST"
  echo "✅  Installed .git/hooks/$HOOK_NAME"
}

chmod +x "$SCRIPTS_DIR/bump-sw-version.sh"
install_hook "pre-commit"

git config alias.commit-patch '!KRATOS_VERSION_BUMP=patch git commit'
git config alias.commit-minor '!KRATOS_VERSION_BUMP=minor git commit'
git config alias.commit-major '!KRATOS_VERSION_BUMP=major git commit'

echo ""
echo "🪝  Git hooks installed. Every commit will now auto-bump the PWA cache version."
echo "    Default bump: patch."
echo "    Bump choices:"
echo "      git commit-patch -m \"message\""
echo "      git commit-minor -m \"message\""
echo "      git commit-major -m \"message\""
echo "      KRATOS_VERSION_BUMP=minor git commit -m \"message\""
echo "    PWA clients will detect the change and show the update modal within 30s while open."
