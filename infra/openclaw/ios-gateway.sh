#!/usr/bin/env bash
# OpenClaw iOS Gateway helper — runs gateway-side commands over SSH.
# Usage:
#   scripts/ios-gateway.sh status        — show connected nodes and devices
#   scripts/ios-gateway.sh approve       — approve the latest device pairing request
#   scripts/ios-gateway.sh watch-status  — check Apple Watch connectivity
#   scripts/ios-gateway.sh watch-test    — send a test notification to Apple Watch
#   scripts/ios-gateway.sh serve-setup   — enable Tailscale Serve on the gateway
#   scripts/ios-gateway.sh logs [N]      — show last N lines of gateway logs (default 30)

set -euo pipefail

# --- Configuration ---
SSH_KEY="${OPENCLAW_SSH_KEY:-$HOME/.ssh/openclaw-deploy-key.pem}"
SSH_HOST="${OPENCLAW_SSH_HOST:-54.91.101.144}"
SSH_USER="${OPENCLAW_SSH_USER:-ubuntu}"
CONTAINER="${OPENCLAW_CONTAINER:-openclaw-openclaw-gateway-1}"

ssh_cmd() {
  ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
    "${SSH_USER}@${SSH_HOST}" "$@"
}

gateway_cli() {
  ssh_cmd "TOKEN=\$(grep OPENCLAW_GATEWAY_TOKEN ~/openclaw/.env | cut -d= -f2) && \
    docker exec $CONTAINER node dist/index.js $* --token \"\$TOKEN\""
}

case "${1:-help}" in
  status)
    echo "=== Nodes ==="
    gateway_cli "nodes list"
    echo ""
    echo "=== Devices ==="
    gateway_cli "devices list"
    ;;

  approve)
    echo "Approving latest device pairing request..."
    gateway_cli "devices approve --latest"
    ;;

  watch-status)
    echo "Checking Apple Watch status..."
    gateway_cli "nodes invoke --node openclaw-ios --command watch.status"
    ;;

  watch-test)
    TITLE="${2:-Hello from Gateway}"
    BODY="${3:-Test notification on your wrist!}"
    echo "Sending watch notification: $TITLE — $BODY"
    gateway_cli "nodes invoke --node openclaw-ios --command watch.notify \
      --params '{\"title\":\"$TITLE\",\"body\":\"$BODY\",\"actions\":[{\"id\":\"ack\",\"label\":\"Got it\"},{\"id\":\"snooze\",\"label\":\"Snooze\",\"style\":\"cancel\"}]}'"
    ;;

  serve-setup)
    echo "Setting up Tailscale Serve..."
    ssh_cmd "sudo tailscale serve --bg http://localhost:18789"
    echo ""
    echo "Serve status:"
    ssh_cmd "sudo tailscale serve status"
    ;;

  logs)
    LINES="${2:-30}"
    ssh_cmd "docker logs $CONTAINER --tail $LINES 2>&1"
    ;;

  help|*)
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  status        Show connected nodes and paired devices"
    echo "  approve       Approve the latest device pairing request"
    echo "  watch-status  Check Apple Watch connectivity via the iPhone node"
    echo "  watch-test    Send a test notification to Apple Watch"
    echo "  serve-setup   Enable Tailscale Serve (TLS proxy) on the gateway"
    echo "  logs [N]      Show last N gateway log lines (default 30)"
    echo ""
    echo "Environment overrides:"
    echo "  OPENCLAW_SSH_KEY   SSH key path  (default: ~/.ssh/openclaw-deploy-key.pem)"
    echo "  OPENCLAW_SSH_HOST  EC2 host      (default: 54.91.101.144)"
    echo "  OPENCLAW_SSH_USER  SSH user      (default: ubuntu)"
    echo "  OPENCLAW_CONTAINER Docker container (default: openclaw-openclaw-gateway-1)"
    ;;
esac
