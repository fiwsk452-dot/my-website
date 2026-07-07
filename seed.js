const { db, init } = require('./db');
init();

const now = Date.now();

const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, handle, age, email, verified, created_at) VALUES (?, ?, ?, ?, ?, ?)');
insertUser.run('นัทธินันท์', '@nattinun', 21, 'nattinun@example.com', 1, now - 1000*60*60*24*365);
insertUser.run('Mimii', '@mimii', 24, 'mimii@example.com', 1, now - 1000*60*60*24*200);
insertUser.run('Zoe', '@zoe', 20, 'zoe@example.com', 1, now - 1000*60*60*24*150);
insertUser.run('Mint', '@mint', 19, 'mint@example.com', 0, now - 1000*60*60*24*90);

const getUser = db.prepare('SELECT id FROM users WHERE handle = ?');
const mimii = getUser.get('@mimii');
const zoe = getUser.get('@zoe');
const mint = getUser.get('@mint');
const natt = getUser.get('@nattinun');

const insertClip = db.prepare('INSERT INTO clips (user_id, title, tags, cover, likes, created_at) VALUES (?, ?, ?, ?, ?, ?)');
if (mimii) insertClip.run(mimii.id, 'Sunset in the city', '#dailyvibes', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80', 4200, now - 1000*60*60);
if (zoe) insertClip.run(zoe.id, 'Morning routine', '#lifestyle', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', 8100, now - 1000*60*60*8);
if (mint) insertClip.run(mint.id, 'Dance challenge', '#dance', 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=900&q=80', 5700, now - 1000*60*60*15);
if (natt) insertClip.run(natt.id, 'Mini travel hacks', '#travel', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 3900, now - 1000*60*60*23);

const insertFollow = db.prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)');
// make a follower example: mimii follows nattinun
if (mimii && natt) insertFollow.run(mimii.id, natt.id, now - 1000*60*60*5);

console.log('Seed complete');
