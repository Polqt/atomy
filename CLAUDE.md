# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**atomy** is a React Native mobile app (Expo) with a separate Express.js backend. The frontend and backend are in the same repo but managed independently.

## Commands

### Frontend (root directory)
```sh
npm start          # Start Expo dev server (interactive)
npm run android    # Launch on Android
npm run ios        # Launch on iOS simulator
npm run web        # Launch web version
```

### Backend (`server/` directory)
```sh
cd server
node index.js      # Start Express server (once index.js exists)
```

## Architecture

**Monorepo structure** — root is the Expo/React Native app; `server/` is a separate Node.js package with its own `node_modules` and `package.json`.

- **Frontend**: Expo 54 + React Native 0.81 + React 19, TypeScript strict mode, entry point `App.tsx` registered via `index.ts`
- **Backend**: Express 5 (CommonJS), entry point `server/index.js`
- **Database/Auth**: Supabase — frontend uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env`; backend has its own `.env`
- **AI**: Anthropic SDK is installed in the backend

### Environment Variables

Frontend `.env` (Expo public vars, committed):
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Backend `server/.env` (private, not committed):
- Supabase service key and Anthropic API key go here

### React Native New Architecture
`newArchEnabled: true` is set in `app.json` — the app uses React Native's new architecture (Fabric/TurboModules).
