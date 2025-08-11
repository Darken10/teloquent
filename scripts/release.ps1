param(
  [ValidateSet('patch','minor','major')]
  [string]$VersionType = 'patch',
  [switch]$Publish,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Require-Cmd($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "Commande requise introuvable: $name" }
}

Write-Host "==> Vérifications préalables" -ForegroundColor Cyan
Require-Cmd git.exe
Require-Cmd pnpm.cmd
Require-Cmd npm.cmd

# Vérifier l'état Git propre (sauf en DryRun)
if (-not $DryRun) {
  $gitStatus = git.exe status --porcelain
  if ($gitStatus) {
    throw "Le répertoire Git contient des modifications non commitées. Commit ou stash avant de lancer le script."
  }
}

Write-Host "==> Installation des dépendances" -ForegroundColor Cyan
pnpm.cmd install --frozen-lockfile

Write-Host "==> Lancement des tests (si présents)" -ForegroundColor Cyan
pnpm.cmd --if-present test

Write-Host "==> Build TypeScript" -ForegroundColor Cyan
pnpm.cmd run build

if ($DryRun) {
  Write-Host "==> Aperçu du package (dry-run)" -ForegroundColor Cyan
  npm.cmd pack --dry-run | Out-Host
  Write-Host "==> Dry-run terminé (aucune modification de version, aucun push, aucune publication)" -ForegroundColor Yellow
  exit 0
}

# Déterminer le nom du package
$pkgJson = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..' 'package.json') | ConvertFrom-Json
$pkgName = $pkgJson.name

Write-Host "==> Bump de version ($VersionType) via pnpm" -ForegroundColor Cyan
# pnpm version commit et tag par défaut, si le repo est propre
pnpm.cmd version $VersionType

Write-Host "==> Push Git + tags" -ForegroundColor Cyan
git.exe push --follow-tags

if ($Publish) {
  Write-Host "==> Publication npm" -ForegroundColor Cyan
  # Vérifier l'authentification npm
  $whoami = $null
  try {
    $whoami = npm.cmd whoami 2>$null
  } catch {}
  if (-not $whoami) {
    throw "Non authentifié sur npm. Exécutez 'npm.cmd login' puis relancez avec -Publish."
  }
  # Vérifier si le package existe déjà sur npm
  $exists = $true
  try {
    npm.cmd view $pkgName version | Out-Null
  } catch {
    $exists = $false
  }

  if ($exists) {
    pnpm.cmd publish
  } else {
    pnpm.cmd publish --access public
  }

  Write-Host "Publication terminée." -ForegroundColor Green
} else {
  Write-Host "Publication non demandée. La CI GitHub publiera si un tag 'v*' a été poussé." -ForegroundColor Yellow
}

Write-Host "Terminé avec succès." -ForegroundColor Green
