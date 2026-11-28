CREATE TABLE IF NOT EXISTS catalog_invites (
  digest TEXT PRIMARY KEY, expires INTEGER NOT NULL, claimed TEXT
);
CREATE TABLE IF NOT EXISTS catalog_editors (
  id TEXT PRIMARY KEY, login TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, verifier TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_sessions (
  digest TEXT PRIMARY KEY, editor TEXT NOT NULL REFERENCES catalog_editors(id), expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_attempts (
  bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_documents (
  kind TEXT NOT NULL, id TEXT NOT NULL, draft TEXT NOT NULL, live TEXT,
  revision INTEGER NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(kind,id)
);
CREATE TABLE IF NOT EXISTS catalog_seo (
  slug TEXT PRIMARY KEY, draft TEXT NOT NULL, live TEXT,
  revision INTEGER NOT NULL, updated INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS traffic_days (
  day TEXT PRIMARY KEY, salt TEXT, visitors INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS traffic_pages (
  day TEXT NOT NULL, path TEXT NOT NULL, views INTEGER NOT NULL, PRIMARY KEY(day,path)
);
CREATE TABLE IF NOT EXISTS traffic_visitors (
  day TEXT NOT NULL, fingerprint TEXT NOT NULL, PRIMARY KEY(day,fingerprint)
);
CREATE TRIGGER IF NOT EXISTS traffic_count_visitor AFTER INSERT ON traffic_visitors BEGIN
  UPDATE traffic_days SET visitors=visitors+1 WHERE day=NEW.day;
END;
CREATE TABLE IF NOT EXISTS catalog_images (
  id TEXT PRIMARY KEY, bytes BLOB NOT NULL, created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_public_images (
  kind TEXT NOT NULL, document TEXT NOT NULL, image TEXT NOT NULL REFERENCES catalog_images(id),
  PRIMARY KEY(kind,document,image)
);
CREATE INDEX IF NOT EXISTS catalog_image_visibility ON catalog_public_images(image);
CREATE TRIGGER IF NOT EXISTS catalog_images_on_insert AFTER INSERT ON catalog_documents
WHEN NEW.live IS NOT NULL BEGIN
  INSERT OR IGNORE INTO catalog_public_images
    SELECT NEW.kind, NEW.id, substr(j.value,21) FROM json_tree(NEW.live) AS j
    JOIN catalog_images AS i ON i.id=substr(j.value,21)
    WHERE j.type='text' AND j.value LIKE '/catalog-api/images/%';
END;
CREATE TRIGGER IF NOT EXISTS catalog_images_on_publish AFTER UPDATE OF live ON catalog_documents
WHEN NEW.live IS NOT OLD.live BEGIN
  DELETE FROM catalog_public_images WHERE kind=NEW.kind AND document=NEW.id;
  INSERT OR IGNORE INTO catalog_public_images
    SELECT NEW.kind,NEW.id,substr(j.value,21) FROM json_tree(NEW.live) AS j
    JOIN catalog_images AS i ON i.id=substr(j.value,21)
    WHERE j.type='text' AND j.value LIKE '/catalog-api/images/%';
END;
