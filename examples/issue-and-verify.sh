#!/usr/bin/env bash
# End-to-end demo: issue a DrivingLicense from the local issuer, then verify
# it via the local verifier. Requires docker compose up.

set -euo pipefail

ISSUER=${ISSUER:-http://localhost:3001}
VERIFIER=${VERIFIER:-http://localhost:3002}

echo "1. Health check issuer + verifier"
curl -s "$ISSUER/health" | jq '.'
curl -s "$VERIFIER/health" | jq '.'

echo
echo "2. Issue a DrivingLicense"
VC=$(curl -s -X POST "$ISSUER/issue" \
  -H 'content-type: application/json' \
  -d '{
    "type": "DrivingLicense",
    "subjectDid": "did:web:holder.example.cr",
    "claims": {
      "name": "Juan Carlos Prueba Ejemplo",
      "documentNumber": "9-9999-9999",
      "licenseClass": "B1"
    },
    "expirationDate": "2030-01-01T00:00:00Z"
  }')

echo "$VC" | jq '.'

echo
echo "3. Verify the issued credential"
curl -s -X POST "$VERIFIER/verify" \
  -H 'content-type: application/json' \
  -d "{ \"credential\": $VC }" | jq '.'
