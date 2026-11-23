CREATE TABLE IF NOT EXISTS chat_turn (
  id INTEGER PRIMARY KEY, session TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_session ON chat_turn(session,id);
CREATE INDEX IF NOT EXISTS chat_created ON chat_turn(created);
CREATE TABLE IF NOT EXISTS website_ticket (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL,
  payload TEXT NOT NULL, created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_limit (
  bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS limit_expiry ON chat_limit(expires);
