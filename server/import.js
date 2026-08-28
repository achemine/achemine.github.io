const db = require("./database");
const fs = require("fs");
const path = require("path");

/* Path to your stops folder */
const STOPS_DIR = path.join(__dirname, "..", "stops");

/* Categories to import */
const categories = [
  { type: "metro", file: "metro.geojson", color: "#0077ff" },
  { type: "bus", file: "bus.geojson", color: "#ea4335" },
  { type: "tram", file: "tram.geojson", color: "#14ee4e" },
  { type: "train", file: "train.geojson", color: "#011985" },
  { type: "telecabine", file: "telecabine.geojson", color: "#009439" },
];

/* Insert default lines */
const defaultLines = [
  { id: "metro-L1", name: "L1", type: "metro", color: "#0077ff" },
  { id: "tram-T1", name: "T1", type: "tram", color: "#14ee4e" },
];

defaultLines.forEach(function (line) {
  db.prepare(
    "INSERT OR IGNORE INTO lines (id, name, type, color) VALUES (?, ?, ?, ?)",
  ).run(line.id, line.name, line.type, line.color);
  console.log("Line inserted:", line.id);
});

/* Import stops from each GeoJSON file */
categories.forEach(function (cat) {
  const filePath = path.join(STOPS_DIR, cat.file);

  if (!fs.existsSync(filePath)) {
    console.log("File not found, skipping:", cat.file);
    return;
  }

  const geojson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const features = geojson.features || [];
  let count = 0;

  features.forEach(function (feature) {
    const name = feature.properties.name || "Unknown stop";
    const lng = feature.geometry.coordinates[0];
    const lat = feature.geometry.coordinates[1];

    const result = db
      .prepare("INSERT INTO stops (name, lat, lng, type) VALUES (?, ?, ?, ?)")
      .run(name, lat, lng, cat.type);

    count++;
  });

  console.log("Imported " + count + " " + cat.type + " stops");
});

console.log("Import complete.");
