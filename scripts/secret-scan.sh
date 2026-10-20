#!/bin/sh
# Secret scan: fails the build if a credential-like value is committed.
set -u
if gitleaks dir . --config .gitleaks.toml --redact --no-banner --verbose; then
  echo "Secret scan passed: no credentials found in the repo."
else
  echo ""
  echo "SECRET SCAN FAILED: a credential-like value was committed (see File and Line above)."
  echo "Remove it from the repo, rotate it if it was real, then push again. Nothing was deployed."
  exit 1
fi
