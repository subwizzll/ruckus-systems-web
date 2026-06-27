#!/usr/bin/env bash
set -euo pipefail

# Vercel project root is the monorepo; installCommand runs from repo root.
git submodule update --init --recursive

# ruckus-integrations vendors an absolute symlink to typescript-config — repoint locally.
ln -sfn ../../typescript-config packages/ruckus-integrations/typescript-config

bun install
