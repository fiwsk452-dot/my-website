require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const axios = require('axios');

const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
if (hasGoogle) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK || 'http://localhost:3000/auth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    const user = { id: profile.id, displayName: profile.displayName, emails: profile.emails };
    return done(null, user);
  }));

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/chat.html');
  });
} else {
  console.warn('WARNING: GOOGLE_CLIENT_ID / SECRET not set — running in demo auth mode.');
  app.get('/auth/google', (req, res) => {
    res.cookie('user', JSON.stringify({displayName: 'Test User', emails: [{value: 'test@example.com'}]}), {httpOnly: false});
    res.redirect('/chat.html');
  });
}

app.get('/logout', (req, res) => {
  try { req.logout(() => {}); } catch (e) {}
  res.clearCookie('user');
  res.redirect('/');
});

app.get('/api/whoami', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.json({ user: req.user });
  const u = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  return res.json({ user: u });
});

app.post('/api/chat', async (req, res) => {
    try {
        const isProtected = hasGoogle;
        // ...

  if (isProtected && (!req.isAuthenticated || !req.isAuthenticated())) return res.status(401).json({ error: 'unauthenticated' });
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'no_message' });

  const key = process.env.GEMINI_API_KEY;
  const forceDemo = process.env.FORCE_DEMO === '1' || process.env.FORCE_DEMO === 'true';
  if (forceDemo || !key) {
    return res.json({ reply: `AI (demo) — คุณพิมพ์ว่า: ${message}` });
  }

const resp = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
  {
    contents: [
      {
        parts: [
          {
            text: `คุณคือผู้ช่วย AI อย่างเป็นมิตร ตอบเป็นภาษาไทย

ผู้ใช้: ${message}`
          }
        ]
      }
    ]
  },
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);



    const reply =
  resp.data.candidates?.[0]?.content?.parts?.[0]?.text ||
  'ขออภัย ไม่มีคำตอบ';
    res.json({ reply });
} catch (err) {
    console.error('OpenAI error', err?.response?.data || err.message);
    res.status(500).json({ error: 'ai_error' });
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
