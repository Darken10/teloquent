# Guide technique — Déploiement et Release de `teloquent`

Ce document décrit le processus complet pour construire, versionner et publier la librairie `teloquent` (TypeScript + CLI) sur npm, ainsi que l’automatisation via GitHub Actions.

## 1) Aperçu du projet

- Package npm: défini par `package.json` (entrée lib `dist/index.js`, binaire CLI `bin.teloquent -> dist/cli/index.js`).
- Build TS: `tsc` avec `tsconfig.json` (CommonJS, declarations, sourcemaps, décorateurs activés).
- CLI: source `src/cli/index.ts` avec shebang `#!/usr/bin/env node` (préservé par tsc par défaut).
- Docs internes: répertoire `docs/` (Markdown).

## 2) Prérequis

- Node.js LTS, pnpm, npm, git installés.
- Accès au dépôt GitHub (push + tags).
- Compte npm avec droits de publication sur le package.

## 3) Build et tests

- Installer: `pnpm install`
- Lancer les tests (optionnels): `pnpm --if-present test`
- Compiler: `pnpm run build`
- Aperçu du package (sans publier): `npm pack --dry-run`

## 4) Scripts d’automatisation (release)

Des scripts multiplateformes sont fournis dans `scripts/` pour standardiser les releases.

- PowerShell Windows: `scripts/release.ps1`
- Batch Windows: `scripts/release.bat`
- Shell Linux/macOS: `scripts/release.sh`

Tous implémentent la séquence:
- install → test (si présent) → build → (dry-run optionnel) → bump version → push + tags → publication npm optionnelle

### 4.1 Utilisation (Windows PowerShell)

- Dry-run (aucune modification):
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\release.ps1 -VersionType patch -DryRun
```
- Release sans publier (CI publiera si configurée):
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\release.ps1 -VersionType patch
```
- Release + publication npm (nécessite `npm.cmd login`):
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\release.ps1 -VersionType patch -Publish
```

### 4.2 Utilisation (Windows Batch)

- Dry-run:
```bat
scripts\release.bat patch --dry-run
```
- Release sans publier:
```bat
scripts\release.bat patch
```
- Release + publier sur npm:
```bat
scripts\release.bat patch --publish
```

### 4.3 Utilisation (Linux/macOS)

- Autoriser l’exécution (une fois):
```bash
chmod +x scripts/release.sh
```
- Dry-run:
```bash
./scripts/release.sh patch --dry-run
```
- Release sans publier:
```bash
./scripts/release.sh patch
```
- Release + publier:
```bash
./scripts/release.sh patch --publish
```

Notes:
- `VersionType`: `patch`, `minor`, `major` (défaut: `patch`).
- En `--dry-run`, aucune modification de version, aucun push, aucune publication.
- En `--publish`, une vérification d’authentification npm (`npm whoami`) est effectuée.
- Si le package n’existe pas encore sur npm, la publication utilise `--access public`.

## 5) Intégration Continue (CI) — GitHub Actions

Le workflow `/.github/workflows/release.yml` publie automatiquement sur npm lorsqu’un tag Git au format `v*` est poussé.

### 5.1 Préparation

- Créer le secret repo `NPM_TOKEN` (Settings → Secrets and variables → Actions → New repository secret):
  - Name: `NPM_TOKEN`
  - Value: Token npm avec permission de publication sur ce package.

### 5.2 Déclenchement

- Créer un tag version sémantique et le pousser:
```bash
git tag v1.0.1
git push --tags
```
- Alternativement, `pnpm version <patch|minor|major>` puis `git push --follow-tags`.

### 5.3 Pipeline

- Checkout → Node 20 → pnpm → install → build → test → `npm publish` (mode public si 1ère fois).

## 6) Bonnes pratiques de versionnement

- Respecter SemVer: `MAJOR.MINOR.PATCH`.
- `patch`: corrections rétro-compatibles.
- `minor`: nouvelles fonctionnalités rétro-compatibles.
- `major`: changements non rétro-compatibles.
- Mettre à jour `CHANGELOG.md` si présent (sinon considérer son ajout futur).

## 7) Vérifications et contrôles avant release

- `git status` propre (pas de changements non commitées).
- Build sans erreur.
- (Optionnel) `npm pack --dry-run` pour inspecter les fichiers inclus.
- Vérifier le nom du package (`package.json:name`) est correct et unique s’il s’agit d’un premier publish.
- Vérifier `bin.teloquent` pointe vers `dist/cli/index.js` (présent dans l’archive dry-run).

## 8) Rollback (en cas de problème)

- Git: revenir au tag précédent / revert commit:
```bash
git revert <commit_sha>
# ou
git reset --hard <tag_precedent>
git push --force-with-lease
```
- npm: publier un correctif rapide (nouveau `patch`) et déprécier la version fautive si nécessaire:
```bash
npm deprecate teloquent@1.0.x "Issue critique, mise à jour recommandée"
```

## 9) Résolution d’erreurs courantes

- Erreur Jest « Unrecognized option \"if-present\" »:
  - Exécuter les tests avec `pnpm --if-present test` (le flag appartient à pnpm, pas à jest).
- `TS5023: Unknown compiler option`:
  - Option non supportée dans `tsconfig.json`. Exemple: `preserveShebangs` retirée.
- Problèmes de type Knex:
  - Utiliser `import type { Knex } from 'knex'` pour les types.
- Non authentifié npm lors de `-Publish`:
  - Exécuter `npm login` (Windows: `npm.cmd login`).

## 10) Sécurité

- Ne jamais committer de token dans le repo.
- Stocker `NPM_TOKEN` uniquement dans les secrets GitHub.
- Activer 2FA sur le compte npm.

## 11) Références

- Fichiers clés:
  - `package.json`, `tsconfig.json`
  - `src/cli/index.ts`, `src/utils/connection.ts`
  - `scripts/release.ps1`, `scripts/release.bat`, `scripts/release.sh`
  - `.github/workflows/release.yml`
- Commandes utiles:
  - `pnpm install`, `pnpm run build`, `pnpm --if-present test`
  - `npm pack --dry-run`, `pnpm publish`
  - `git push --follow-tags`

---

Pour toute question ou pour étendre ce flux (ex: génération auto du CHANGELOG, release notes GitHub), ouvre une issue ou demande une amélioration.
