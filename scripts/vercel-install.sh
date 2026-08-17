#!/usr/bin/env bash
set -euo pipefail

# Always run from the monorepo root, even when Vercel Root Directory is apps/web or apps/jared.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TOKEN="${SUBMODULE_GITHUB_TOKEN:-}"

write_ssh_key() {
  local key_file="$1"
  # Vercel env vars may store literal \n sequences.
  printf '%s\n' "${SUBMODULE_SSH_KEY}" | sed 's/\r$//' | sed 's/\\n/\n/g' > "${key_file}"
  chmod 600 "${key_file}"
}

clone_integrations() {
  local dest="packages/ruckus-integrations"
  local sub_sha
  sub_sha="$(git rev-parse HEAD:packages/ruckus-integrations)"
  export GIT_TERMINAL_PROMPT=0

  rm -rf "${dest}"

  if [ -n "${SUBMODULE_SSH_KEY:-}" ]; then
    local key_file
    key_file="$(mktemp)"
    write_ssh_key "${key_file}"
    GIT_SSH_COMMAND="ssh -i ${key_file} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
      git clone --no-recurse-submodules git@github.com:subwizzll/ruckus-integrations.git "${dest}"
    rm -f "${key_file}"
  elif [ -n "${TOKEN}" ]; then
    # oauth2: username works for classic PATs, fine-grained PATs, and gho_ tokens.
    # Do not use x-access-token with ghp_ — GitHub returns 403 "Write access to repository not granted".
    git clone --no-recurse-submodules "https://oauth2:${TOKEN}@github.com/subwizzll/ruckus-integrations.git" "${dest}"
  else
    echo "Missing SUBMODULE_SSH_KEY or SUBMODULE_GITHUB_TOKEN with read access to subwizzll/ruckus-integrations" >&2
    echo "NPM_TOKEN is packages-only and cannot clone the private submodule." >&2
    exit 1
  fi

  git -C "${dest}" checkout --force "${sub_sha}"
}

if [ -f .gitmodules ] && grep -q 'packages/ruckus-integrations' .gitmodules; then
  if [ ! -f packages/ruckus-integrations/package.json ]; then
    clone_integrations
  fi
fi

bun install
