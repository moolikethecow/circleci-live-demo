#!/bin/sh
# Runs the test files CircleCI hands us (one split of the suite) and writes
# JUnit results so the Tests tab shows them. Used by: circleci tests run
set -eu
mkdir -p test-results
exec node --test \
  --test-reporter=spec --test-reporter-destination=stdout \
  --test-reporter=junit --test-reporter-destination="test-results/junit-${CIRCLE_NODE_INDEX:-0}.xml" \
  "$@"
