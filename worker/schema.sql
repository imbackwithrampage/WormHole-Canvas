-- Initial schema for Cloudflare D1 Database
CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    artist TEXT NOT NULL,
    album TEXT NOT NULL,
    song TEXT,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    uploadedAt TEXT NOT NULL,
    updatedAt TEXT
);

-- Indexing artist and album for fast searches
CREATE INDEX IF NOT EXISTS idx_artist_album ON canvases (artist, album);
