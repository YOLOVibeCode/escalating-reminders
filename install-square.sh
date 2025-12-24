#!/bin/bash
# Install Square SDK - Workaround for workspace protocol issues

set -e

echo "📦 Installing Square SDK..."

# Try installing at root first
cd "$(dirname "$0")"

echo "Attempting to install squareup at root level..."

# Create a temporary package.json approach
# Install squareup without workspace resolution
npm install squareup --no-workspaces --legacy-peer-deps 2>&1 | grep -v "EUNSUPPORTEDPROTOCOL" || {
  echo ""
  echo "⚠️  Direct install failed. Trying alternative methods..."
  echo ""
  echo "📝 Manual Installation Instructions:"
  echo ""
  echo "1. Install squareup manually:"
  echo "   cd /Users/admin/Dev/YOLOProjects/escalating-reminders"
  echo "   npm install squareup --no-workspaces"
  echo ""
  echo "2. Or use npx to run the script (no installation needed):"
  echo "   npx --yes tsx apps/api/src/scripts/square-setup.ts"
  echo ""
  echo "3. Or install in a temp directory and symlink:"
  echo "   mkdir -p temp-square && cd temp-square"
  echo "   npm init -y && npm install squareup"
  echo "   cd .. && ln -s temp-square/node_modules/squareup node_modules/squareup"
  echo ""
  exit 1
}

echo "✅ Square SDK installed successfully!"
echo ""
echo "You can now run: npm run square:setup"
