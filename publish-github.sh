#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
command -v gh >/dev/null || { echo 'Install GitHub CLI first: https://cli.github.com/'; exit 1; }
command -v git >/dev/null || { echo 'Install Git first.'; exit 1; }
[[ -f docs/index.html && -f docs/events.json ]] || { echo 'The prepared docs/ build is missing. Run npm ci and npm run build.'; exit 1; }
gh auth status >/dev/null 2>&1 || gh auth login --hostname github.com --git-protocol https --web
gocal_owner="$(gh api user --jq '.login')"
gocal_user_id="$(gh api user --jq '.id')"
gocal_repo="${1:-gocal}"
[[ "$gocal_repo" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo 'Choose a repository name using letters, numbers, dots, hyphens, or underscores.'; exit 1; }
if gh repo view "$gocal_owner/$gocal_repo" --json name >/dev/null 2>&1; then
  echo "Repository $gocal_owner/$gocal_repo already exists. Nothing was uploaded. Run this script with a new name, for example: bash publish-github.sh gocal-public"
  exit 1
fi
if [[ -d .git ]]; then
  echo 'This folder already has a Git repository. Nothing was uploaded; follow the update instructions in README.md.'
  exit 1
fi
git init -b main
git config user.name "$gocal_owner"
git config user.email "$gocal_user_id+$gocal_owner@users.noreply.github.com"
git add .
git commit -m 'Publish GoCal public calendar on GitHub Pages'
gh auth setup-git --hostname github.com
gh repo create "$gocal_owner/$gocal_repo" --public --source=. --remote=origin --push --description 'GoCal — Fayetteville community calendar, public preview'
if ! gh api --method POST "repos/$gocal_owner/$gocal_repo/pages" -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/docs' --jq '.html_url'; then
  echo "Repository uploaded. Enable Pages manually at https://github.com/$gocal_owner/$gocal_repo/settings/pages using main and /docs."
  exit 1
fi
echo "Upload complete. GitHub is building the site; this can take up to 10 minutes."
echo "Check deployment: https://github.com/$gocal_owner/$gocal_repo/settings/pages"
