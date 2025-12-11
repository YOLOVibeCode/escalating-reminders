#!/bin/bash

# E2E Test Execution Script - Fail-Fast Pyramid
# Executes tests layer by layer, stopping on first failure

set -e  # Exit on error

API_URL="${API_BASE_URL:-http://localhost:3801}"
WEB_URL="${BASE_URL:-http://localhost:3800}"
TEST_RESULTS_DIR="e2e-results"

echo "🧪 E2E Test Execution - Fail-Fast Pyramid"
echo "=========================================="
echo "API URL: $API_URL"
echo "WEB URL: $WEB_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API is running
check_api() {
    echo "🔍 Checking API..."
    if curl -s "$API_URL/health" > /dev/null 2>&1 || curl -s "$API_URL/v1/seeding/seed" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is running${NC}"
        return 0
    else
        echo -e "${RED}❌ API is not running on $API_URL${NC}"
        echo "   Start API with: cd apps/api && npm run dev"
        return 1
    fi
}

# Check if Web app is running
check_web() {
    echo "🔍 Checking Web app..."
    if curl -s "$WEB_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web app is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Web app is not running on $WEB_URL${NC}"
        echo "   Start Web app with: cd apps/web && npm run dev"
        return 1
    fi
}

# Seed test data
seed_data() {
    echo ""
    echo "🌱 Seeding test data..."
    response=$(curl -s -X POST "$API_URL/v1/seeding/seed" -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Test data seeded successfully${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Seeding response: $response${NC}"
        echo -e "${YELLOW}⚠️  Continuing anyway (data might already exist)${NC}"
        return 0
    fi
}

# Run test layer
run_layer() {
    local layer=$1
    local layer_name=$2
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🧪 Layer $layer: $layer_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if npx playwright test --config=e2e/playwright.config.ts --project=$layer; then
        echo -e "${GREEN}✅ Layer $layer ($layer_name) PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ Layer $layer ($layer_name) FAILED${NC}"
        echo -e "${RED}🛑 STOPPING - Fail-fast enabled${NC}"
        return 1
    fi
}

# Main execution
main() {
    # Create results directory
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Check prerequisites
    if ! check_api; then
        exit 1
    fi
    
    if ! check_web; then
        exit 1
    fi
    
    # Seed test data
    seed_data
    
    # Execute tests layer by layer (fail-fast)
    echo ""
    echo "🚀 Starting test execution..."
    echo ""
    
    # Layer 0: Critical (MUST pass first)
    if ! run_layer "critical" "@critical"; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  TEST EXECUTION STOPPED - Layer 0 Failed${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        exit 1
    fi
    
    # Layer 1: Auth (depends on Layer 0)
    if ! run_layer "auth" "@auth"; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  TEST EXECUTION STOPPED - Layer 1 Failed${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        exit 1
    fi
    
    # Layer 2: Dashboard (depends on Layer 1)
    if ! run_layer "dashboard" "@dashboard"; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  TEST EXECUTION STOPPED - Layer 2 Failed${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        exit 1
    fi
    
    # Layer 3: Navigation (depends on Layer 2)
    if ! run_layer "navigation" "@navigation"; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  TEST EXECUTION STOPPED - Layer 3 Failed${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        exit 1
    fi
    
    # Layer 4: Features (depends on Layer 3)
    if ! run_layer "features" "@feature"; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  TEST EXECUTION STOPPED - Layer 4 Failed${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        exit 1
    fi
    
    # Layer 5: Integration (depends on Layer 4)
    if ! run_layer "integration" "@integration"; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  TEST EXECUTION STOPPED - Layer 5 Failed${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        exit 1
    fi
    
    # Layer 6: Error (depends on Layer 5)
    if ! run_layer "error" "@error"; then
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        echo -e "${RED}  TEST EXECUTION STOPPED - Layer 6 Failed${NC}"
        echo -e "${RED}═══════════════════════════════════════════════${NC}"
        exit 1
    fi
    
    # All layers passed!
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo ""
    echo "📊 Test results available in: $TEST_RESULTS_DIR/"
    echo "📖 View report: npm run e2e:report"
}

main "$@"
