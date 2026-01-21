# Cloud Agent Development Guide

## Quick Reference

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Frontend | `yarn workspace ff-mern start` | 3000 | Vite dev server |
| Backend | `yarn workspace backend start` | 3001 | Express + Socket.io |
| ff-types | `cd ff-types && npx tsc && npx rollup -c` | N/A | Build before running frontend/backend |

## Running the Application

### Frontend (React/Vite)
```bash
cd frontend && yarn start
```
- Runs on http://localhost:3000
- Hot reloading enabled
- Connects to backend at `VITE_PUBLIC_URL` (default: http://localhost:3001)

### Backend (Express)
```bash
cd backend && yarn start
```
- Runs on http://localhost:3001
- Requires `SERVICE_ACCOUNT` environment variable (base64-encoded Firebase service account JSON)
- Uses tsx for TypeScript execution

## Lint & Test Commands

| Workspace | Lint | Test |
|-----------|------|------|
| Frontend | `cd frontend && yarn lint` | N/A |
| Backend | `cd backend && yarn lint` | `cd backend && yarn test` (no tests currently) |

## Build Commands

| Workspace | Build |
|-----------|-------|
| ff-types | `cd ff-types && npx tsc && npx rollup -c` |
| Frontend | `cd frontend && yarn build` |
| Backend | `cd backend && yarn build` |

## Architecture Notes

- **ff-types** must be built before running frontend or backend (shared type definitions)
- Firebase Authentication is used for user management
- Firestore is the primary database; MongoDB is optional (for complex scoring calculations)
- Socket.io handles real-time draft functionality
- Frontend uses React Query for server state and Zustand for local state

## Required Environment Variables

### Backend
- `SERVICE_ACCOUNT`: Base64-encoded Firebase service account JSON (required for Firebase Admin SDK)

### Frontend
Already configured in `.env.development`:
- `VITE_PUBLIC_URL`: Backend URL (default: http://localhost:3001)
- `VITE_DEFAULT_LOGO`: Default logo path
