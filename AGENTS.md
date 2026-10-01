# AGENTS.md

## Cloud-specific instructions

### Overview

Orca Fantasy Football is a Yarn Berry (3.8.5) monorepo with four workspaces: `ff-types/`, `backend/`, `frontend/`, and `functions/`. See `CLAUDE.md` for full architecture and development commands.

### Build order

`ff-types` must be built before `backend` or `frontend` can compile, since both depend on `@ff-mern/ff-types`. Build it with:

```
cd ff-types && PATH="/workspace/node_modules/.bin:$PATH" yarn build
```

The `PATH` prefix is needed because `ff-types` does not declare `typescript` as a direct dependency; it uses the root workspace's `tsc`.

### Running the backend

The backend requires a `SERVICE_ACCOUNT` environment variable (base64-encoded Firebase service account JSON). Without it, the process crashes on startup because `firebase-admin` initializes eagerly in `backend/src/config/firebase-config.ts`.

For local development without real Firebase credentials, start the backend with `FIRESTORE_EMULATOR_HOST` set to prevent real Firestore connections (this keeps the Express server alive even without a running emulator):

```
cd backend && FIRESTORE_EMULATOR_HOST="localhost:8080" SERVICE_ACCOUNT="<base64-encoded-sa>" yarn start
```

To generate a mock `SERVICE_ACCOUNT` for dev use (will pass Firebase Admin SDK init but fail on actual Firestore calls):

```bash
openssl genpkey -algorithm RSA -out /tmp/mock_key.pem -pkeyopt rsa_keygen_bits:2048 2>/dev/null
PRIVATE_KEY=$(cat /tmp/mock_key.pem | sed ':a;N;$!ba;s/\n/\\n/g')
export SERVICE_ACCOUNT=$(echo "{\"type\":\"service_account\",\"project_id\":\"ff-mern\",\"private_key_id\":\"dummy\",\"private_key\":\"${PRIVATE_KEY}\",\"client_email\":\"test@ff-mern.iam.gserviceaccount.com\",\"client_id\":\"123\",\"auth_uri\":\"https://accounts.google.com/o/oauth2/auth\",\"token_uri\":\"https://oauth2.googleapis.com/token\",\"auth_provider_x509_cert_url\":\"https://www.googleapis.com/oauth2/v1/certs\",\"client_x509_cert_url\":\"https://www.googleapis.com/robot/v1/metadata/x509/test%40ff-mern.iam.gserviceaccount.com\"}" | base64 -w 0)
```

### Running the frontend

The frontend Vite dev server uses `.env.development` which points `VITE_PUBLIC_URL` to `http://localhost:3001`. No extra setup needed:

```
cd frontend && yarn start
```

### Lint

- **Backend:** `cd backend && yarn lint` (uses root `.eslintrc.js`)
- **Frontend:** `cd frontend && yarn lint` has a pre-existing issue — the `package.json` `eslintConfig` extends `react-app` which is unavailable after the CRA-to-Vite migration. The root `.eslintrc.js` works for linting.

### Tests

- **Backend:** `yarn test` in `backend/` — no test files currently exist (exits with code 1).
- **Frontend:** `yarn test` in `frontend/` — configured but untested.

### Ports

| Service  | Port |
|----------|------|
| Frontend | 3000 |
| Backend  | 3001 |
