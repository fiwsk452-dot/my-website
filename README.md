# Ply (demo)

Local demo of Ply (frontend + backend).

This repo now includes a small Node/Express backend and a SQLite database for local testing.

## What was added
- `server.js` — Express API server
- `db.js` — SQLite helper (better-sqlite3)
- `seed.js` — populate sample users/clips/follows
- `package.json` — dependencies and scripts
- Updated `index.html` — frontend now calls the API

## Prerequisites
- Node.js (16+ recommended)
- npm

## Install and run locally
Open a terminal in the project folder and run:

```bash
npm install
npm run seed   # creates ply.db and inserts sample data
npm start      # starts API on http://localhost:3000
```

Then open `index.html` in your browser (or use a static server). The frontend will try to call `http://localhost:3000/api` for data.

## API endpoints (summary)
- `POST /api/register` {name, handle, age, email}
- `POST /api/verify` {handle}
- `POST /api/follow` {follower_handle, following_handle}
- `GET /api/profile/:handle`
- `GET /api/feed`
- `POST /api/upload` (form data: handle, title, tags, cover)
- `GET /api/search?q=`
- `GET /api/notifications/:handle`

If you'd like, I can try to run the server here — but earlier checks showed no `node` on this machine. You can run the commands above locally and tell me any errors; I'll help debug.
