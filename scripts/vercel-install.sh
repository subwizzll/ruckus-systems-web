#!/usr/bin/env bash
set -euo pipefail

# Always run from the monorepo root, even when Vercel Root Directory is apps/web or apps/jared.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TOKEN="${SUBMODULE_GITHUB_TOKEN:-${NPM_TOKEN:-}}"

if [ -f .gitmodules ] && grep -q 'packages/ruckus-integrations' .gitmodules; then
  if [ -z "${TOKEN}" ]; then
    echo "Missing SUBMODULE_GITHUB_TOKEN (or NPM_TOKEN) with repo access to clone packages/ruckus-integrations" >&2
    exit 1
  fi

  SUB_SHA="$(git rev-parse HEAD:packages/ruckus-integrations)"
  export GIT_TERMINAL_PROMPT=0
  git config --global url."https://x-access-token:${TOKEN}@github.com/".insteadOf "https://github.com/"

  if [ ! -f packages/ruckus-integrations/package.json ]; then
    rm -rf packages/ruckus-integrations
    git clone --no-recurse-submodules "https://github.com/subwizzll/ruckus-integrations.git" packages/ruckus-integrations
    git -C packages/ruckus-integrations checkout --force "${SUB_SHA}"
  fi
fi

bun install
