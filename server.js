const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.json());

// Serve static public folder
app.use(express.static(path.join(__dirname, 'public')));

// Simple auth simulation: /auth/google sets a cookie and redirects to /chat
app.get('/auth/google', (req, res) => {
  res.cookie('user', JSON.stringify({displayName: 'Test User', emails: [{value: 'test@example.com'}]}), {httpOnly: false});
  res.redirect('/chat');
});

app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/');
});

app.get('/api/whoami', (req, res) => {
  const u = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.json({user: u});
});

app.post('/api/chat', (req, res) => {
  const msg = req.body.message || '';
  // echo back for demo
  res.json({reply: `AI (demo) — คุณพิมพ์ว่า: ${msg}`});
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on http://localhost:' + port));
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('WARNING: GOOGLE_CLIENT_ID / SECRET not set — Google OAuth will not work until configured.');
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET',
  callbackURL: process.env.GOOGLE_CALLBACK || 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  const user = { id: profile.id, displayName: profile.displayName, emails: profile.emails };
  return done(null, user);
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/chat.html');
});

app.post('/api/chat', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) return res.status(401).json({ error: 'unauthenticated' });
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'no_message' });

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.json({ reply: `AI (offline mode): คุณพูดว่า "${message}"` });
  }

  try {
    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that replies concisely in Thai.' },
        { role: 'user', content: message }
      ],
      max_tokens: 600
    }, {
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
    });

    const reply = resp.data.choices?.[0]?.message?.content || 'ขออภัย ไม่มีคำตอบ';
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI error', err?.response?.data || err.message);
    res.status(500).json({ error: 'ai_error' });
  }
});

app.get('/api/whoami', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.json({ user: req.user });
  return res.json({ user: null });
});

app.get('/logout', (req, res) => { req.logout(() => {}); res.redirect('/'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
