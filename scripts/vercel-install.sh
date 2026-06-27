#!/usr/bin/env bash
set -euo pipefail

# Vercel install runs from monorepo root (after cd ../.. from apps/jared).
if [ -d packages/ruckus-integrations ]; then
  git submodule update --init --recursive packages/ruckus-integrations packages/typescript-config
  ln -sfn ../../typescript-config packages/ruckus-integrations/typescript-config
fi

bun install
