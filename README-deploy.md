## Deployment Guide

This project deploys as:

- Frontend: Vercel (Create React App at repo root)
- Backend: Render (Node/Express in `server/`)

### Frontend (Vercel)

- Framework preset: `Create React App`
- Root directory: `.`
- Build command: `npm run build`
- Output directory: `build`
- Environment variable: `REACT_APP_API_URL` → your backend HTTPS URL

Notes:
- Do not commit `build/`. Vercel builds from source.
- If you later use the `frontend/` Vite app instead, set `REACT_APP_API_URL` appropriately and change Vercel settings to `root: frontend`, `build: npm run build`, `output: dist`.

### Backend (Render)

- Root directory: `server`
- Build command: `npm install`
- Start command: `node server.js` (or `npm start`)
- Environment variables:
  - `PORT` → 10000 or leave default
  - `JWT_SECRET` → strong random value
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `FRONTEND_URL` → your Vercel domain (e.g., `https://cicl.vercel.app`)

### CORS Hardening

- Server reads `FRONTEND_URL` and only allows requests from that origin.
- Local dev remains allowed (`http://localhost:3000`).

### Sanity Checks

- After deploy, verify:
  - Frontend loads and calls API via `REACT_APP_API_URL`
  - Auth works end-to-end (login, protected routes)
  - No mixed content warnings (HTTPS everywhere)

### Git Hygiene

- `.gitignore` excludes `node_modules/`, `build/`, `dist/`, `.env*`, logs, and editor junk.
- Keep secrets in env vars only; never commit `.env`.