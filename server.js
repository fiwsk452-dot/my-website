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

// Register user
app.post('/api/register', (req, res) => {
  const { name, handle, age, email } = req.body;
  if (!name || !handle || !age || !email) return res.status(400).json({ error: 'missing' });
  try {
    const stmt = db.prepare('INSERT INTO users (name, handle, age, email, verified, created_at) VALUES (?, ?, ?, ?, 0, ?)');
    const info = stmt.run(name, handle.startsWith('@') ? handle : '@' + handle, age, email, now());
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
  return res.json({ ok: true });
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
