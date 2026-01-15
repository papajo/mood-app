#!/bin/bash

# Comprehensive App Testing Script
# Tests all major features of MoodMingle

echo "🧪 MoodMingle Comprehensive Test Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3002"
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$API_URL" > /dev/null 2>&1; then
    echo -e "${RED}✗ Server is not running on $API_URL${NC}"
    echo "Please start the server with: cd server && npm start"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test User Management
echo "=== User Management Tests ==="
test_endpoint "Create User" "POST" "/api/users" '{"username":"TestUser123"}'
USER_ID=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"TestUser123"}' \
    "$API_URL/api/users" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -n "$USER_ID" ]; then
    test_endpoint "Get User" "GET" "/api/users/$USER_ID"
    test_endpoint "Update User" "PATCH" "/api/users/$USER_ID" '{"status":"Testing!"}'
fi
echo ""

# Test Mood Management
echo "=== Mood Management Tests ==="
if [ -n "$USER_ID" ]; then
    test_endpoint "Set Mood" "POST" "/api/mood" "{\"userId\":$USER_ID,\"moodId\":\"happy\"}"
    test_endpoint "Get User Mood" "GET" "/api/mood/$USER_ID"
fi
echo ""

# Test Journal
echo "=== Journal Tests ==="
if [ -n "$USER_ID" ]; then
    test_endpoint "Save Journal Entry" "POST" "/api/journal" \
        "{\"userId\":$USER_ID,\"text\":\"Test entry\",\"date\":\"2024-01-01\",\"time\":\"12:00\"}"
    test_endpoint "Get Journal Entries" "GET" "/api/journal/$USER_ID"
fi
echo ""

# Test Matching
echo "=== Matching Tests ==="
test_endpoint "Get Mood Matches" "GET" "/api/users/match/happy"
echo ""

# Summary
echo "======================================"
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
