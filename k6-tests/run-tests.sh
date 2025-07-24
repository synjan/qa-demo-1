#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL=${BASE_URL:-http://localhost:3000}

echo -e "${YELLOW}Starting k6 Performance Tests${NC}"
echo "Target URL: $BASE_URL"
echo "========================================="

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}k6 is not installed. Please install k6 first.${NC}"
    exit 1
fi

# Check if the application is running
if ! curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200\|307"; then
    echo -e "${RED}Application is not accessible at $BASE_URL${NC}"
    echo "Please ensure the application is running (npm run dev)"
    exit 1
fi

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "\n${YELLOW}Running $test_name...${NC}"
    echo "========================================="
    
    if k6 run --quiet "$test_file"; then
        echo -e "${GREEN}✓ $test_name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        return 1
    fi
}

# Track overall results
TESTS_RUN=0
TESTS_PASSED=0

# Run each test
if run_test "API Test" "api-test.js"; then
    ((TESTS_PASSED++))
fi
((TESTS_RUN++))

if run_test "Load Test" "load-test.js"; then
    ((TESTS_PASSED++))
fi
((TESTS_RUN++))

if run_test "Spike Test" "spike-test.js"; then
    ((TESTS_PASSED++))
fi
((TESTS_RUN++))

# Uncomment to run stress test (takes longer)
# if run_test "Stress Test" "stress-test.js"; then
#     ((TESTS_PASSED++))
# fi
# ((TESTS_RUN++))

# Summary
echo -e "\n========================================="
echo -e "${YELLOW}Performance Test Summary${NC}"
echo "========================================="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $((TESTS_RUN - TESTS_PASSED))"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "\n${GREEN}All performance tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some performance tests failed.${NC}"
    exit 1
fi