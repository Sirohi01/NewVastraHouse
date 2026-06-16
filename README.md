# The Vastra House

Fashion commerce operating system for The Vastra House, built according to the planning blueprint in `docs/`.

## Phase 1 Scope

This repository starts with the architecture foundation:

- `apps/frontend`: Next.js 15 + TypeScript storefront/admin shell.
- `apps/backend`: Express + TypeScript API.
- `packages/shared`: shared constants and types.
- Centralized environment loading, logging, error handling, MongoDB connection, and `/api/v1/health`.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and adjust values if needed.

3. Start both apps:

   ```bash
   npm run dev
   ```

4. Open:

   - Frontend: `http://localhost:3000`
   - Backend health: `http://localhost:4000/api/v1/health`

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
