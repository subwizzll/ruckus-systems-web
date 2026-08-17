#!/usr/bin/env bash
set -euo pipefail

# Runs from the monorepo root (web) or after `cd ../..` (Jared).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .gitmodules ] && grep -q 'packages/ruckus-integrations' .gitmodules; then
  TOKEN="${GITHUB_TOKEN:-${NPM_TOKEN:-}}"
  if [ -n "${TOKEN}" ]; then
    git config url."https://x-access-token:${TOKEN}@github.com/".insteadOf "https://github.com/"
  fi
  git submodule update --init --recursive packages/ruckus-integrations
fi

bun install
