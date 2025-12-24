#!/bin/bash
# Install Square SDK and dotenv manually
# This script works around workspace protocol issues

cd "$(dirname "$0")"

echo "📦 Installing Square SDK and dotenv..."

# Try npm install first
if npm install squareup dotenv 2>/dev/null; then
  echo "✅ Installed via npm"
  exit 0
fi

# Fallback: manual installation
echo "⚠️  npm install failed, trying manual installation..."

# Create node_modules if it doesn't exist
mkdir -p node_modules

# Install packages directly
npm install squareup dotenv --no-save --legacy-peer-deps 2>&1 | grep -v "EUNSUPPORTEDPROTOCOL" || true

echo "✅ Installation complete"
echo ""
echo "If installation failed, try:"
echo "  cd apps/api"
echo "  npm install squareup dotenv --no-save"
