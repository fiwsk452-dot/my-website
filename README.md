# MyWebProject (local test)

Run a small local server to test the static site, fake Google auth, and API endpoints.

Install and start:

```bash
npm install
npm start
```

Open http://localhost:3000 and click "Sign in with Google" to be redirected to `/chat` without 404.
# Ply (demo)

Local demo of Ply (frontend + backend).

This repo now includes a small Node/Express backend and a SQLite database for local testing.

## What was added

## Prerequisites

## Install and run locally
Open a terminal in the project folder and run:

```bash
npm install
npm run seed   # creates ply.db and inserts sample data
npm start      # starts API on http://localhost:3000
```

Then open `index.html` in your browser (or use a static server). The frontend will try to call `http://localhost:3000/api` for data.

## API endpoints (summary)

If you'd like, I can try to run the server here — but earlier checks showed no `node` on this machine. You can run the commands above locally and tell me any errors; I'll help debug.
# AI Chat (Google Sign-in)

This project is a minimal local demo: sign in with Google, then chat with an AI assistant.

Setup
1. Copy `.env.example` to `.env` and set values: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`. Optionally set `OPENAI_API_KEY` to enable real AI responses.
2. Ensure OAuth callback in Google Console is set to `http://localhost:3000/auth/google/callback`.
3. Install and run:

```powershell
npm install
node server.js
```

Usage
- Visit `http://localhost:3000/` and click "Sign in with Google".
- After login you are redirected to `/chat.html` where you can chat. If `OPENAI_API_KEY` is not set the server will use a simple echo fallback.

Security
- Keep `.env` out of source control. Don't commit secrets.

If you want, I can also:
- Add Dockerfile for easy deployment
- Add persistent user storage
- Replace OpenAI proxy with streaming responses
