#!/bin/bash
# E2E verify: sign in dev user against Auth emulator, hit backend with ID token.
set -u
EMU_AUTH="http://127.0.0.1:9099"
BACKEND="http://127.0.0.1:3001"

echo "--- 1. sign in dev@orca.local via Auth emulator ---"
SIGNIN_RESP=$(curl -s -m 10 -X POST "${EMU_AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo" \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@orca.local","password":"OrcaDev123!","returnSecureToken":true}')
echo "$SIGNIN_RESP" | head -c 300
echo
IDTOKEN=$(echo "$SIGNIN_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('idToken',''))")
if [ -z "$IDTOKEN" ]; then
  echo "SIGNIN_FAILED"
  exit 1
fi
echo "GOT_IDTOKEN len=${#IDTOKEN}"

echo "--- 2. backend health (no auth) ---"
curl -s -m 5 "${BACKEND}/" -w '\nHTTP:%{http_code}\n'

echo "--- 3. authed POST create league (expect NOT 401) ---"
curl -s -m 15 -X POST "${BACKEND}/api/v1/league/create/" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${IDTOKEN}" \
  -d '{"league":"E2E Test League","teams":[{"name":"Dev Team","ownerName":"dev@orca.local","isCommissioner":true}],"logo":"","posInfo":{"QB":1},"scoring":"PPR","numWeeks":1,"numSuperflex":0}' \
  -w '\nHTTP:%{http_code}\n' | head -c 800
echo
echo "--- 4. unauthed POST (expect 401) ---"
curl -s -m 5 -X POST "${BACKEND}/api/v1/league/create/" \
  -H 'Content-Type: application/json' -d '{}' -w '\nHTTP:%{http_code}\n'
