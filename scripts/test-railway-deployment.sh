#!/bin/bash
# Railway Deployment Test Script
# Tests deployment readiness before deploying to Railway

set -e

echo "🚀 Railway Deployment Readiness Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Railway CLI
echo "1️⃣  Checking Railway CLI..."
if command -v railway &> /dev/null; then
    RAILWAY_VERSION=$(railway --version 2>&1 | head -1)
    echo -e "${GREEN}✅ Railway CLI installed: $RAILWAY_VERSION${NC}"
else
    echo -e "${RED}❌ Railway CLI not found. Install: npm i -g @railway/cli${NC}"
    exit 1
fi

# Test 2: Check Railway login
echo ""
echo "2️⃣  Checking Railway authentication..."
if railway whoami &> /dev/null; then
    USER=$(railway whoami 2>&1 | grep -o "Logged in as [^@]*" | sed 's/Logged in as //')
    echo -e "${GREEN}✅ Logged in as: $USER${NC}"
else
    echo -e "${RED}❌ Not logged in. Run: railway login${NC}"
    exit 1
fi

# Test 3: Check Railway project link
echo ""
echo "3️⃣  Checking Railway project link..."
if railway status &> /dev/null; then
    echo -e "${GREEN}✅ Project is linked${NC}"
    railway status
else
    echo -e "${YELLOW}⚠️  Project not linked. Run: railway link${NC}"
    echo "   This will open an interactive prompt to select/create a project"
fi

# Test 4: Check configuration files
echo ""
echo "4️⃣  Checking Railway configuration files..."
CONFIG_FILES=(
    "apps/api/railway.toml"
    "apps/api/railway.worker.toml"
    "apps/api/railway.scheduler.toml"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
    fi
done

# Test 5: Check build
echo ""
echo "5️⃣  Testing build..."
cd apps/api
if npm run build &> /dev/null; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Check errors above.${NC}"
    exit 1
fi
cd ../..

# Test 6: Check start scripts exist
echo ""
echo "6️⃣  Checking start scripts..."
cd apps/api
if [ -f "dist/apps/api/src/main.js" ]; then
    echo -e "${GREEN}✅ API entry point exists: dist/apps/api/src/main.js${NC}"
else
    echo -e "${RED}❌ Missing: dist/apps/api/src/main.js${NC}"
fi

if [ -f "dist/apps/api/src/workers/worker.js" ]; then
    echo -e "${GREEN}✅ Worker entry point exists: dist/apps/api/src/workers/worker.js${NC}"
else
    echo -e "${RED}❌ Missing: dist/apps/api/src/workers/worker.js${NC}"
fi

if [ -f "dist/apps/api/src/workers/scheduler.js" ]; then
    echo -e "${GREEN}✅ Scheduler entry point exists: dist/apps/api/src/workers/scheduler.js${NC}"
else
    echo -e "${RED}❌ Missing: dist/apps/api/src/workers/scheduler.js${NC}"
fi
cd ../..

# Test 7: Check package.json scripts
echo ""
echo "7️⃣  Checking package.json scripts..."
cd apps/api
REQUIRED_SCRIPTS=("start:api" "start:worker" "start:scheduler")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo -e "${GREEN}✅ Script exists: $script${NC}"
    else
        echo -e "${RED}❌ Missing script: $script${NC}"
    fi
done
cd ../..

# Summary
echo ""
echo "===================================="
echo "📋 Summary"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Run 'railway link' to link your project (if not already linked)"
echo "2. Create 3 services in Railway Dashboard:"
echo "   - API Service (uses railway.toml)"
echo "   - Worker Service (uses railway.worker.toml)"
echo "   - Scheduler Service (uses railway.scheduler.toml)"
echo "3. Add environment variables (see docs/RAILWAY-DEPLOYMENT.md)"
echo "4. Deploy: railway up"
echo ""
echo "📚 Full guide: docs/RAILWAY-DEPLOYMENT.md"
