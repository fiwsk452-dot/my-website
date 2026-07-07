const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'ply.db'));

function init() {
  db.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      age INTEGER,
      email TEXT,
      verified INTEGER DEFAULT 0,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER,
      following_id INTEGER,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      tags TEXT,
      cover TEXT,
      likes INTEGER DEFAULT 0,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at INTEGER
    );
  `);
}

module.exports = { db, init };
