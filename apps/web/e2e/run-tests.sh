#!/bin/bash

# Simplified test runner that handles service startup
# This script will attempt to start services if they're not running

set -e

API_URL="${API_BASE_URL:-http://localhost:3801}"
WEB_URL="${BASE_URL:-http://localhost:3800}"

echo "🧪 E2E Test Runner"
echo "=================="
echo ""

# Check if API is running
check_api() {
    if curl -s "$API_URL/v1/seeding/seed" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Check if Web is running
check_web() {
    if curl -s "$WEB_URL" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Start API if not running
if ! check_api; then
    echo "⚠️  API not running. Attempting to start..."
    echo "   Please start API manually:"
    echo "   Terminal 1: cd apps/api && npm run dev"
    echo ""
    echo "   Or use turbo: npm run dev (from root)"
    echo ""
    read -p "Press Enter once API is running, or Ctrl+C to cancel..."
fi

# Start Web if not running
if ! check_web; then
    echo "⚠️  Web app not running. Attempting to start..."
    echo "   Please start Web manually:"
    echo "   Terminal 2: cd apps/web && npm run dev"
    echo ""
    echo "   Or use turbo: npm run dev (from root)"
    echo ""
    read -p "Press Enter once Web app is running, or Ctrl+C to cancel..."
fi

# Verify services
echo "🔍 Verifying services..."
if check_api && check_web; then
    echo "✅ Both services are running"
    echo ""
    
    # Seed test data
    echo "🌱 Seeding test data..."
    curl -s -X POST "$API_URL/v1/seeding/seed" > /dev/null && echo "✅ Test data seeded" || echo "⚠️  Seeding may have failed (check manually)"
    echo ""
    
    # Run tests
    echo "🚀 Running E2E tests..."
    echo ""
    
    # Run Layer 0 first (critical)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Layer 0: @critical (MUST PASS FIRST)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if npm run e2e:critical; then
        echo ""
        echo "✅ Layer 0 passed! Continuing..."
        echo ""
        
        # Continue with other layers
        npm run e2e
    else
        echo ""
        echo "❌ Layer 0 failed! Stopping (fail-fast)."
        exit 1
    fi
else
    echo "❌ Services not ready. Please start them first."
    exit 1
fi
