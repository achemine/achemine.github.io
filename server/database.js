const Database = require("better-sqlite3");
const path = require("path");

/* Database file lives inside the server folder */
const db = new Database(path.join(__dirname, "transit.db"));

/* Enable WAL mode for better performance */
db.pragma("journal_mode = WAL");

/* Create all tables if they don't exist yet */
db.exec(`

  CREATE TABLE IF NOT EXISTS stops (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL,
    lat   REAL    NOT NULL,
    lng   REAL    NOT NULL,
    type  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lines (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    type  TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS line_stops (
    line_id    TEXT    NOT NULL REFERENCES lines(id),
    stop_id    INTEGER NOT NULL REFERENCES stops(id),
    stop_order INTEGER NOT NULL,
    PRIMARY KEY (line_id, stop_id)
  );

  CREATE TABLE IF NOT EXISTS line_routes (
    line_id TEXT PRIMARY KEY REFERENCES lines(id),
    geojson TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saved_places (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    lat        REAL    NOT NULL,
    lng        REAL    NOT NULL,
    visible    INTEGER NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

`);

module.exports = db;
