const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* ════════════════════════════════════════════════════════
   STOPS
   ════════════════════════════════════════════════════════ */

/* Get all stops, optionally filtered by type */
app.get("/api/stops", function (req, res) {
  const type = req.query.type;
  const stops = type
    ? db.prepare("SELECT * FROM stops WHERE type = ?").all(type)
    : db.prepare("SELECT * FROM stops").all();
  res.json(stops);
});

/* Get one stop by id, including its lines */
app.get("/api/stops/:id", function (req, res) {
  const stop = db
    .prepare("SELECT * FROM stops WHERE id = ?")
    .get(req.params.id);
  if (!stop) return res.status(404).json({ error: "Stop not found" });

  /* Get all lines that serve this stop */
  stop.lines = db
    .prepare(
      `
    SELECT lines.id, lines.name, lines.color, lines.type
    FROM lines
    JOIN line_stops ON lines.id = line_stops.line_id
    WHERE line_stops.stop_id = ?
    ORDER BY lines.type, lines.id
  `,
    )
    .all(req.params.id);

  res.json(stop);
});

/* Get lines for a stop by name (used when clicking a stop marker) */
app.get("/api/stops/by-name/:name", function (req, res) {
  const stop = db
    .prepare("SELECT * FROM stops WHERE name = ? COLLATE NOCASE")
    .get(req.params.name);
  if (!stop) return res.status(404).json({ error: "Stop not found" });

  stop.lines = db
    .prepare(
      `
    SELECT lines.id, lines.name, lines.color, lines.type
    FROM lines
    JOIN line_stops ON lines.id = line_stops.line_id
    WHERE line_stops.stop_id = ?
    ORDER BY lines.type, lines.id
  `,
    )
    .all(stop.id);

  res.json(stop);
});

/* Add a new stop */
app.post("/api/stops", function (req, res) {
  const { name, lat, lng, type } = req.body;
  const result = db
    .prepare("INSERT INTO stops (name, lat, lng, type) VALUES (?, ?, ?, ?)")
    .run(name, lat, lng, type);
  res.json({ id: result.lastInsertRowid });
});

/* ════════════════════════════════════════════════════════
   LINES
   ════════════════════════════════════════════════════════ */

/* Get all lines, optionally filtered by type */
app.get("/api/lines", function (req, res) {
  const type = req.query.type;
  const lines = type
    ? db.prepare("SELECT * FROM lines WHERE type = ?").all(type)
    : db.prepare("SELECT * FROM lines").all();
  res.json(lines);
});

/* Get one line with its stops in order */
app.get("/api/lines/:id", function (req, res) {
  const line = db
    .prepare("SELECT * FROM lines WHERE id = ?")
    .get(req.params.id);
  if (!line) return res.status(404).json({ error: "Line not found" });

  line.stops = db
    .prepare(
      `
    SELECT stops.*, line_stops.stop_order
    FROM stops
    JOIN line_stops ON stops.id = line_stops.stop_id
    WHERE line_stops.line_id = ?
    ORDER BY line_stops.stop_order
  `,
    )
    .all(req.params.id);

  res.json(line);
});

/* Get the route (GeoJSON) for a line */
app.get("/api/lines/:id/route", function (req, res) {
  const route = db
    .prepare("SELECT geojson FROM line_routes WHERE line_id = ?")
    .get(req.params.id);
  if (!route) return res.status(404).json({ error: "Route not found" });
  res.json(JSON.parse(route.geojson));
});

/* Add a new line */
app.post("/api/lines", function (req, res) {
  const { id, name, type, color } = req.body;
  db.prepare(
    "INSERT OR REPLACE INTO lines (id, name, type, color) VALUES (?, ?, ?, ?)",
  ).run(id, name, type, color);
  res.json({ id });
});

/* Save a line route (auto-generated or manually traced) */
app.post("/api/lines/:id/route", function (req, res) {
  db.prepare(
    "INSERT OR REPLACE INTO line_routes (line_id, geojson) VALUES (?, ?)",
  ).run(req.params.id, JSON.stringify(req.body));
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════
   LINE STOPS (linking lines to stops)
   ════════════════════════════════════════════════════════ */

/* Link a stop to a line */
app.post("/api/line-stops", function (req, res) {
  const { line_id, stop_id, stop_order } = req.body;
  db.prepare(
    "INSERT OR REPLACE INTO line_stops (line_id, stop_id, stop_order) VALUES (?, ?, ?)",
  ).run(line_id, stop_id, stop_order);
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════
   SAVED PLACES
   ════════════════════════════════════════════════════════ */

/* Get all saved places */
app.get("/api/saved", function (req, res) {
  res.json(
    db.prepare("SELECT * FROM saved_places ORDER BY created_at DESC").all(),
  );
});

/* Add a saved place */
app.post("/api/saved", function (req, res) {
  const { name, lat, lng } = req.body;
  const result = db
    .prepare("INSERT INTO saved_places (name, lat, lng) VALUES (?, ?, ?)")
    .run(name, lat, lng);
  res.json({ id: result.lastInsertRowid });
});

/* Update a saved place (name or visibility) */
app.put("/api/saved/:id", function (req, res) {
  const { name, visible } = req.body;
  if (name !== undefined) {
    db.prepare("UPDATE saved_places SET name = ? WHERE id = ?").run(
      name,
      req.params.id,
    );
  }
  if (visible !== undefined) {
    db.prepare("UPDATE saved_places SET visible = ? WHERE id = ?").run(
      visible ? 1 : 0,
      req.params.id,
    );
  }
  res.json({ ok: true });
});

/* Delete a saved place */
app.delete("/api/saved/:id", function (req, res) {
  db.prepare("DELETE FROM saved_places WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════
   SETTINGS
   ════════════════════════════════════════════════════════ */

/* Get all settings as a key-value object */
app.get("/api/settings", function (req, res) {
  const rows = db.prepare("SELECT * FROM settings").all();
  const settings = {};
  rows.forEach(function (row) {
    settings[row.key] = row.value;
  });
  res.json(settings);
});

/* Update one setting */
app.put("/api/settings/:key", function (req, res) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    req.params.key,
    req.body.value,
  );
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════
   START SERVER
   ════════════════════════════════════════════════════════ */

app.listen(PORT, function () {
  console.log("Transit server running at http://localhost:" + PORT);
});
