#!/bin/bash
set -e

# System update
apt-get update
apt-get install -y curl wget git unzip jq

# 1. Install Docker & Compose Plugins
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# 2. Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# 3. Setup OpenClaw
sudo -u ubuntu mkdir -p /home/ubuntu/.openclaw/workspace

# Clone OpenClaw
sudo -u ubuntu git clone https://github.com/openclaw/openclaw.git /home/ubuntu/openclaw
cd /home/ubuntu/openclaw

# Build the Gateway image and Sandbox image (backgrounded to not block instance boot fully)
sudo -H -u ubuntu bash -c 'cd /home/ubuntu/openclaw && docker build -t openclaw:local .'
sudo -H -u ubuntu bash -c 'cd /home/ubuntu/openclaw && docker build -t openclaw-sandbox:bookworm-slim -f Dockerfile.sandbox .'

# Let the user know it's ready!
echo "Setup complete! Docker, Tailscale, and OpenClaw images are ready." > /home/ubuntu/setup-status.txt
