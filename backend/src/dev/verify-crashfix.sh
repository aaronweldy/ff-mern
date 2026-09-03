#!/bin/bash
# Verify bad payloads return 400/401 and never crash the server.
set -u
EMU_AUTH="http://127.0.0.1:9099"
BACKEND="http://127.0.0.1:3001"

IDTOKEN=$(curl -s -m 10 -X POST "${EMU_AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo" \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@orca.local","password":"OrcaDev123!","returnSecureToken":true}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('idToken',''))")
echo "GOT_IDTOKEN len=${#IDTOKEN}"

echo "--- bad scoring (was: server crash) ---"
curl -s -m 10 -X POST "${BACKEND}/api/v1/league/create/" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${IDTOKEN}" \
  -d '{"league":"Bad League","teams":[],"logo":"","posInfo":{},"scoring":[],"numWeeks":1,"numSuperflex":0}' \
  -w '\nHTTP:%{http_code}\n'

echo "--- missing league name ---"
curl -s -m 10 -X POST "${BACKEND}/api/v1/league/create/" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${IDTOKEN}" \
  -d '{"teams":[],"scoring":"PPR"}' \
  -w '\nHTTP:%{http_code}\n'

echo "--- server still alive: health ---"
curl -s -m 5 "${BACKEND}/" -w '\nHTTP:%{http_code}\n'

echo "--- valid create still works ---"
curl -s -m 15 -X POST "${BACKEND}/api/v1/league/create/" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${IDTOKEN}" \
  -d '{"league":"Post Fix League","teams":[{"name":"Dev Team","ownerName":"dev@orca.local","isCommissioner":true}],"logo":"","posInfo":{"QB":1},"scoring":"PPR","numWeeks":1,"numSuperflex":0}' \
  -w '\nHTTP:%{http_code}\n' | head -c 400
echo
