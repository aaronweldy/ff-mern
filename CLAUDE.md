# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orca Fantasy Football is a MERN stack application with a monorepo structure using Yarn workspaces. It's a season-long, total-score-based fantasy football platform with real-time draft functionality and comprehensive league management.

## Workspace Structure

- **frontend/**: React TypeScript app with React Router, React Query, Socket.io client, and Zustand for state management
- **backend/**: Express.js API server with Socket.io for real-time features
- **ff-types/**: Shared TypeScript definitions across all workspaces
- **functions/**: Firebase Cloud Functions for web scraping and external data

## Development Commands

### Frontend (from frontend/)
- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run tests
- `yarn lint` - Run ESLint
- `yarn deploy` - Build and deploy to Firebase

### Backend (from backend/)
- `yarn start` - Build and start server (tsc -b -v && node .)
- `yarn build` - Compile TypeScript (tsc -b -v)
- `yarn test` - Run Jest tests with coverage
- `yarn lint` - Run ESLint
- `yarn dbon` - Start MongoDB locally
- `yarn dboff` - Stop MongoDB

### ff-types (from ff-types/)
- `yarn build` - Build TypeScript definitions and bundle with Rollup

### Functions (from functions/)
- `yarn build` - Compile TypeScript
- `yarn serve` - Start Firebase emulator
- `yarn deploy` - Deploy to Firebase

## Architecture

### Authentication & Data Flow
- Firebase Authentication for user management
- Backend uses Firebase Admin SDK with service account for auth verification
- Firestore for primary data storage (leagues, teams, users)
- MongoDB for complex scoring calculations and temporary data

### Real-time Features
- Socket.io for live draft room functionality
- Custom socket context in frontend with typed events from ff-types
- Draft state management using Zustand store

### Frontend State Management
- React Query for server state and caching
- Zustand for local state (draft room, selected players)
- Context providers for socket connections

### API Structure
Backend routes are organized by domain:
- `/api/v1/user/` - User management
- `/api/v1/league/` - League CRUD operations
- `/api/v1/team/` - Team management and roster operations
- `/api/v1/nflData/` - NFL stats and schedule data
- `/api/v1/trade/` - Trade system
- `/api/v1/draft` - Draft management

### Key Patterns
- All routes use Express Router modules in backend/src/route/
- Frontend components are organized by feature with co-located styles
- Shared types ensure type safety across the full stack
- Web scraping handled in Firebase Functions to avoid CORS issues

## Environment Setup

### Frontend
Create `.env` file with:
- `REACT_APP_PUBLIC_URL`
- `REACT_APP_BACKEND_URL` 
- `REACT_APP_DEFAULT_LOGO`

### Backend
Requires `SERVICE_ACCOUNT` environment variable (base64 encoded Firebase service account)