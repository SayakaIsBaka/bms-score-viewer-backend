DROP TABLE IF EXISTS Charts;
CREATE TABLE IF NOT EXISTS Charts (md5 TEXT PRIMARY KEY, title TEXT, artist TEXT, keys INTEGER, bpm REAL, notes INTEGER, date INTEGER, filename TEXT, is_private INTEGER);
CREATE INDEX IF NOT EXISTS idx_title ON Charts(title);
CREATE INDEX IF NOT EXISTS idx_artist ON Charts(artist);