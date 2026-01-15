#!/bin/bash

# Comprehensive Test Runner for MoodMingle
# Runs all test suites and generates reports

echo "🧪 MoodMingle Test Suite Runner"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Function to run tests
run_test_suite() {
    local name=$1
    local command=$2
    
    echo -n "Running $name... "
    
    if eval "$command" > /tmp/test-output.log 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Error output:"
        tail -10 /tmp/test-output.log | sed 's/^/    /'
        ((FAILED++))
        return 1
    fi
}

# Check if server is running
echo "Checking prerequisites..."
if ! curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Server not running. Starting server...${NC}"
    cd server && npm start > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 3
    cd ..
fi

echo ""

# Run frontend unit tests
echo "=== Frontend Tests ==="
run_test_suite "Frontend Unit Tests" "npm test -- --run"

# Run frontend integration tests
run_test_suite "Frontend Integration Tests" "npm test -- --run src/__tests__/integration"

# Run backend API tests
echo ""
echo "=== Backend Tests ==="
cd server
run_test_suite "Backend API Tests" "npm test"
cd ..

# Run API integration tests
echo ""
echo "=== API Integration Tests ==="
run_test_suite "API Integration" "./scripts/test-app.sh"

# Summary
echo ""
echo "================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
