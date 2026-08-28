const db = require("./database");

/* Get all lines */
const lines = db.prepare("SELECT * FROM lines").all();

lines.forEach(function (line) {
  /* Get stops in order */
  const stops = db
    .prepare(
      `
    SELECT stops.lat, stops.lng
    FROM stops
    JOIN line_stops ON stops.id = line_stops.stop_id
    WHERE line_stops.line_id = ?
    ORDER BY line_stops.stop_order
  `,
    )
    .all(line.id);

  if (stops.length < 2) {
    console.log("Not enough stops for line:", line.id);
    return;
  }

  /* Build a GeoJSON LineString connecting all stops */
  const geojson = {
    type: "Feature",
    properties: { line_id: line.id, name: line.name, color: line.color },
    geometry: {
      type: "LineString",
      coordinates: stops.map(function (s) {
        return [s.lng, s.lat];
      }),
    },
  };

  /* Save to database */
  db.prepare(
    "INSERT OR REPLACE INTO line_routes (line_id, geojson) VALUES (?, ?)",
  ).run(line.id, JSON.stringify(geojson));

  console.log("Route generated for:", line.id, "(" + stops.length + " stops)");
});

console.log("Route generation complete.");
