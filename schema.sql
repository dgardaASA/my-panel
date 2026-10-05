CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    uuid TEXT UNIQUE,
    email TEXT,
    traffic_limit INTEGER DEFAULT 0,
    traffic_used INTEGER DEFAULT 0,
    expire_date INTEGER,
    created_at INTEGER,
    active INTEGER DEFAULT 1
);
