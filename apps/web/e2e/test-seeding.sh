#!/bin/bash

# Test Seeding Endpoint Script
# Tests the seeding endpoint before running E2E tests

set -e

API_URL="${API_BASE_URL:-http://localhost:3801}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧪 Testing Seeding Endpoint"
echo "============================"
echo "API URL: $API_URL"
echo ""

# Test 1: Clear existing data
test_clear() {
    echo -e "${BLUE}Test 1: Clear existing test data${NC}"
    response=$(curl -s -X DELETE "$API_URL/v1/seeding/clear" -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Clear successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Clear response: $response${NC}"
        echo -e "${YELLOW}   (This is OK if no data exists)${NC}"
    fi
    echo ""
}

# Test 2: Seed data
test_seed() {
    echo -e "${BLUE}Test 2: Seed test data${NC}"
    response=$(curl -s -X POST "$API_URL/v1/seeding/seed" -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Seed successful${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 0
    else
        echo -e "${RED}❌ Seed failed${NC}"
        echo "$response"
        return 1
    fi
    echo ""
}

# Test 3: Idempotency (seed again)
test_idempotency() {
    echo -e "${BLUE}Test 3: Test idempotency (seed again)${NC}"
    response=$(curl -s -X POST "$API_URL/v1/seeding/seed" -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Idempotency test passed (no errors on second seed)${NC}"
        return 0
    else
        echo -e "${RED}❌ Idempotency test failed${NC}"
        echo "$response"
        return 1
    fi
    echo ""
}

# Test 4: Verify user authentication
test_auth() {
    echo -e "${BLUE}Test 4: Verify test users can authenticate${NC}"
    
    # Test user login
    echo "  Testing user login..."
    user_response=$(curl -s -X POST "$API_URL/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"testuser@example.com","password":"TestUser123!"}')
    
    if echo "$user_response" | grep -q '"success":true\|"accessToken"'; then
        echo -e "${GREEN}  ✅ User login successful${NC}"
    else
        echo -e "${RED}  ❌ User login failed${NC}"
        echo "  Response: $user_response"
        return 1
    fi
    
    # Test admin login
    echo "  Testing admin login..."
    admin_response=$(curl -s -X POST "$API_URL/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"AdminPass123!"}')
    
    if echo "$admin_response" | grep -q '"success":true\|"accessToken"'; then
        echo -e "${GREEN}  ✅ Admin login successful${NC}"
    else
        echo -e "${RED}  ❌ Admin login failed${NC}"
        echo "  Response: $admin_response"
        return 1
    fi
    
    echo ""
    return 0
}

# Main execution
main() {
    # Check if API is accessible
    if ! curl -s "$API_URL/v1/seeding/seed" > /dev/null 2>&1; then
        echo -e "${RED}❌ API is not accessible at $API_URL${NC}"
        echo "   Start API with: cd apps/api && npm run dev"
        exit 1
    fi
    
    echo -e "${GREEN}✅ API is accessible${NC}"
    echo ""
    
    # Run tests
    test_clear
    test_seed || exit 1
    test_idempotency || exit 1
    test_auth || exit 1
    
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ All seeding tests passed!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo ""
    echo "Ready to run E2E tests!"
}

main "$@"
