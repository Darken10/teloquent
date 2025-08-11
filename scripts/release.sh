#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh [patch|minor|major] [--publish] [--dry-run]
VERSION="patch"
PUBLISH=false
DRYRUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    patch|minor|major)
      VERSION="$1"; shift ;;
    --publish)
      PUBLISH=true; shift ;;
    --dry-run)
      DRYRUN=true; shift ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1 ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Commande requise introuvable: $1" >&2; exit 1; }
}

echo "==> Vérifications préalables"
require_cmd git
require_cmd pnpm
require_cmd npm
require_cmd node

# Vérifier l'état Git propre (sauf en DryRun)
if [ "$DRYRUN" = false ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "Le répertoire Git contient des modifications non commitées. Commit ou stash avant de lancer le script." >&2
    exit 1
  fi
fi

echo "==> Installation des dépendances"
pnpm install --frozen-lockfile

echo "==> Lancement des tests (si présents)"
pnpm --if-present test

echo "==> Build TypeScript"
pnpm run build

if [ "$DRYRUN" = true ]; then
  echo "==> Aperçu du package (dry-run)"
  npm pack --dry-run
  echo "==> Dry-run terminé (aucune modification de version, aucun push, aucune publication)"
  exit 0
fi

# Déterminer le nom du package
PKG_NAME=$(node -p "require('./package.json').name")

echo "==> Bump de version ($VERSION) via pnpm"
pnpm version "$VERSION"

echo "==> Push Git + tags"
git push --follow-tags

if [ "$PUBLISH" = true ]; then
  echo "==> Publication npm"
  if ! npm whoami >/dev/null 2>&1; then
    echo "Non authentifié sur npm. Exécutez 'npm login' puis relancez avec --publish." >&2
    exit 1
  fi
  if npm view "$PKG_NAME" version >/dev/null 2>&1; then
    pnpm publish
  else
    pnpm publish --access public
  fi
  echo "Publication terminée."
else
  echo "Publication non demandée. La CI GitHub publiera si un tag 'v*' a été poussé."
fi

echo "Terminé avec succès."
