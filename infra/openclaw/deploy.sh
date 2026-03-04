#!/bin/bash
set -e

echo "================================================="
echo " Deploying OpenClaw Master Gateway to AWS EC2"
echo "================================================="

# Fetch the latest Ubuntu 24.04 ARM64 AMI for this region
echo "Fetching latest Ubuntu 24.04 ARM64 AMI..."
AMI_ID=$(aws ssm get-parameters --names /aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id --query "Parameters[0].Value" --output text || echo "None")

if [ "$AMI_ID" == "None" ] || [ -z "$AMI_ID" ]; then
    echo "❌ Error fetching AMI ID. Your AWS session might have expired."
    echo "👉 Please run 'aws login' to re-authenticate, then run this script again."
    exit 1
fi
echo "✅ Using AMI: $AMI_ID"

# Get Default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query "Vpcs[0].VpcId" --output text)

# Security Group
SG_NAME="openclaw-gateway-sg"
SG_ID=$(aws ec2 describe-security-groups --filters Name=group-name,Values=$SG_NAME --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")

if [ "$SG_ID" == "None" ]; then
    echo "Creating Security Group ($SG_NAME)..."
    SG_ID=$(aws ec2 create-security-group --group-name $SG_NAME --description "Security group for OpenClaw Gateway" --vpc-id $VPC_ID --query "GroupId" --output text)
    
    # ⚠️ We open port 22 temporarily just for initial debugging. 
    # Once Tailscale is running, you should remove this ingress rule via AWS console!
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
    echo "✅ Created Security Group: $SG_ID"
else
    echo "✅ Using existing Security Group: $SG_ID"
fi

# SSH Key Pair
KEY_NAME="openclaw-deploy-key"
KEY_CHECK=$(aws ec2 describe-key-pairs --key-names $KEY_NAME --query "KeyPairs[0].KeyName" --output text 2>/dev/null || echo "None")

if [ "$KEY_CHECK" == "None" ]; then
    echo "Creating Key Pair ($KEY_NAME)..."
    aws ec2 create-key-pair --key-name $KEY_NAME --query "KeyMaterial" --output text > ~/.ssh/$KEY_NAME.pem
    chmod 400 ~/.ssh/$KEY_NAME.pem
    echo "✅ Saved private key to ~/.ssh/$KEY_NAME.pem"
else
    echo "✅ Using existing Key Pair: $KEY_NAME"
fi

# Prepare User Data Script
echo "Preparing startup script..."
cp user-data.sh /tmp/user-data-deploy.sh

# Source .env if it exists so we can pick up credentials automatically
if [ -f .env ]; then
    # safely export vars from .env
    export $(grep -v '^#' .env | xargs -R) 2>/dev/null || export $(grep -v '^#' .env | xargs) 2>/dev/null || true
fi

if [ -n "$DOCKER_USERNAME" ] && [ -n "$DOCKER_PASSWORD" ]; then
    echo "✅ Docker credentials found. Injecting login into startup script to prevent rate limits..."
    perl -pi -e "s|(usermod -aG docker ubuntu)|\\1\n\necho \"$DOCKER_PASSWORD\" \| docker login -u \"$DOCKER_USERNAME\" --password-stdin\nsudo -H -u ubuntu bash -c 'echo \"$DOCKER_PASSWORD\" \| docker login -u \"$DOCKER_USERNAME\" --password-stdin'\n|g" /tmp/user-data-deploy.sh
else
    echo "ℹ️  No DOCKER_USERNAME / DOCKER_PASSWORD found in environment or .env."
    echo "   Continuing without authentication. (You can add them to a .env file later if needed)"
fi

# Run Instance
echo "Launching EC2 instance (t4g.small)..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type t4g.small \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --user-data file:///tmp/user-data-deploy.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=openclaw-gateway}]' \
    --query "Instances[0].InstanceId" --output text)

echo "✅ Instance $INSTANCE_ID launched!"
echo "⏳ Waiting for instance to become running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID
IP_ADDRESS=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

echo "================================================="
echo " 🎉 INSTANCE DEPLOYED SUCCESSFULLY!"
echo "================================================="
echo "Public IP: $IP_ADDRESS"
echo ""
echo "It will take 2-4 minutes for the startup script to finish installing Docker, Tailscale, and building OpenClaw."
echo ""
echo "👉 1. SSH into the instance:"
echo "   ssh -i ~/.ssh/$KEY_NAME.pem ubuntu@$IP_ADDRESS"
echo ""
echo "👉 2. Authenticate Tailscale (run on the server):"
echo "   sudo tailscale up"
echo ""
echo "👉 3. Start OpenClaw Gateway:"
echo "   cd ~/openclaw && docker compose up -d"
echo "================================================="
