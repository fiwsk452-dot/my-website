const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const { db, init } = require('./db');

init();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const now = () => Date.now();

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Register user (supports autoHandle: if handle taken and autoHandle=true, system will generate one)
app.post('/api/register', (req, res) => {
  const { name, handle, age, email, autoHandle } = req.body;
  if (!name || !age || !email) return res.status(400).json({ error: 'missing' });
  // normalize handle if provided
  let normalized = handle ? (handle.startsWith('@') ? handle : '@' + handle) : null;
  try {
    if (normalized) {
      const exists = db.prepare('SELECT id FROM users WHERE handle = ?').get(normalized);
      if (exists) {
        if (!autoHandle) return res.status(409).json({ error: 'handle_taken' });
        // fallthrough to auto-generate
        normalized = null;
      }
    }

    if (!normalized) {
      // generate handle from name
      const base = String(name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0,20) || 'user';
      let tryHandle = '@' + base;
      let suffix = 0;
      while (db.prepare('SELECT id FROM users WHERE handle = ?').get(tryHandle)) {
        suffix += 1;
        tryHandle = '@' + base + suffix;
      }
      normalized = tryHandle;
    }

    const stmt = db.prepare('INSERT INTO users (name, handle, age, email, verified, created_at) VALUES (?, ?, ?, ?, 0, ?)');
    const info = stmt.run(name, normalized, age, email, now());
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    return res.json({ ok: true, user });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Verify (simple rule: age>=13 and name length>=2)
app.post('/api/verify', (req, res) => {
  const { handle } = req.body;
  if (!handle) return res.status(400).json({ error: 'missing handle' });
  const user = db.prepare('SELECT * FROM users WHERE handle = ?').get(handle);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const passed = user.age >= 13 && user.name.length >= 2;
  db.prepare('UPDATE users SET verified = ? WHERE id = ?').run(passed ? 1 : 0, user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  return res.json({ ok: true, passed, user: updated });
});

// Follow endpoint
app.post('/api/follow', (req, res) => {
  const { follower_handle, following_handle } = req.body;
  const follower = db.prepare('SELECT * FROM users WHERE handle = ?').get(follower_handle);
  const following = db.prepare('SELECT * FROM users WHERE handle = ?').get(following_handle);
  if (!follower || !following) return res.status(404).json({ error: 'user not found' });
  const exists = db.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?').get(follower.id, following.id);
  if (exists) return res.json({ ok: true, message: 'already following' });
  db.prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)').run(follower.id, following.id, now());
  // return updated follower count
  const followers = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(following.id).c;
  return res.json({ ok: true, followers });
});

// Like a clip
app.post('/api/clips/:id/like', (req, res) => {
  const id = Number(req.params.id);
  const clip = db.prepare('SELECT * FROM clips WHERE id = ?').get(id);
  if (!clip) return res.status(404).json({ error: 'clip not found' });
  db.prepare('UPDATE clips SET likes = likes + 1 WHERE id = ?').run(id);
  const updated = db.prepare('SELECT likes FROM clips WHERE id = ?').get(id);
  return res.json({ ok: true, likes: updated.likes });
});

// Get profile with follower count and clips
app.get('/api/profile/:handle', (req, res) => {
  const handle = req.params.handle.startsWith('@') ? req.params.handle : '@' + req.params.handle;
  const user = db.prepare('SELECT * FROM users WHERE handle = ?').get(handle);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const followers = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id).c;
  const clips = db.prepare('SELECT * FROM clips WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  return res.json({ ok: true, user, followers, clips });
});

// Get feed (simple latest clips)
app.get('/api/feed', (req, res) => {
  const clips = db.prepare('SELECT c.*, u.name, u.handle FROM clips c JOIN users u ON u.id = c.user_id ORDER BY created_at DESC').all();
  return res.json({ ok: true, clips });
});

// Upload clip (multipart optional)
app.post('/api/upload', upload.none(), (req, res) => {
  const { handle, title, tags, cover } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE handle = ?').get(handle);
  if (!user) return res.status(404).json({ error: 'user not found' });
  db.prepare('INSERT INTO clips (user_id, title, tags, cover, likes, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(user.id, title, tags || '', cover || '', now());
  return res.json({ ok: true });
});

// Search
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const users = db.prepare('SELECT id, name, handle FROM users WHERE LOWER(name) LIKE ? OR LOWER(handle) LIKE ? LIMIT 10').all('%' + q + '%', '%' + q + '%');
  const clips = db.prepare('SELECT c.id, c.title, c.tags, u.handle FROM clips c JOIN users u ON u.id = c.user_id WHERE LOWER(c.title) LIKE ? OR LOWER(c.tags) LIKE ? LIMIT 10').all('%' + q + '%', '%' + q + '%');
  return res.json({ ok: true, users, clips });
});

// Notifications (simple list)
app.get('/api/notifications/:handle', (req, res) => {
  const handle = req.params.handle.startsWith('@') ? req.params.handle : '@' + req.params.handle;
  const user = db.prepare('SELECT * FROM users WHERE handle = ?').get(handle);
  if (!user) return res.status(404).json({ error: 'user not found' });
  const notes = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  return res.json({ ok: true, notifications: notes });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Ply API running on port', PORT));
