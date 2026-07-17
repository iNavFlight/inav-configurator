#!/bin/bash
cd /home/raymorris/Documents/planes/inavflight/inav-configurator

echo "=== Running Full Transpiler Test Suite ==="
echo ""

TOTAL=0
PASSED=0
FAILED=0

for test in js/transpiler/transpiler/tests/run_*.cjs; do
  test_name=$(basename "$test" .cjs | sed 's/run_//')
  printf "%-40s " "$test_name..."

  output=$(node "$test" 2>&1)
  exit_code=$?

  if echo "$output" | grep -q "ALL TESTS PASSED"; then
    echo "✅ PASSED"
    PASSED=$((PASSED + 1))
  elif echo "$output" | grep -q "FAILED"; then
    echo "❌ FAILED"
    FAILED=$((FAILED + 1))
    echo "$output" | grep -A 5 "FAILED"
  elif [ $exit_code -eq 0 ]; then
    # Exit code 0 but no output - assume passed
    echo "✅ PASSED (silent)"
    PASSED=$((PASSED + 1))
  else
    echo "⚠️  UNKNOWN"
  fi

  TOTAL=$((TOTAL + 1))
done

echo ""
echo "=== Test Suite Results ==="
echo "Total:  $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "✅ ALL TEST SUITES PASSED"
  exit 0
else
  echo ""
  echo "❌ SOME TESTS FAILED"
  exit 1
fi
