/*
  ══════════════════════════════════════════════════════════════
  import_lines.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Imports line routes from GeoJSON files into the SQLite database.

  HOW TO USE:
  1. Place your GeoJSON files in the lines/ folder
  2. Run: node import_lines.js
  3. Open your SQLite editor and update the name column
     with the correct line numbers (1→35, 2→43 etc.)

  HOW LINES ARE STORED:
  - Each pair of directions = one line entry in the lines table
  - Both directions stored in line_routes with suffix _out and _ret
  - line_id = the outbound route name from GeoJSON
  - name = sequential number (1, 2, 3...) — update later
  ══════════════════════════════════════════════════════════════
*/

const fs = require("fs");
const path = require("path");
const db = require("./database");

/* ── CONFIGURATION ── */
/* Add your GeoJSON files here with their transport type and color */
const LINE_FILES = [
  {
    file: "../lines/Bus_lines.geojson",
    type: "bus",
    color: "#ea4335" /* default bus color — overridden by stroke if present */,
  },

  {
    file: "../lines/Metro_lines.geojson",
    type: "metro",
    color: "#0077ff",
  },
  {
    file: "../lines/Tram_lines.geojson",
    type: "tram",
    color: "#14ee4e",
  },
  {
    file: "../lines/Train_lines.geojson",
    type: "train",
    color: "#011985",
  },
];

/*
  pairDirections(features) groups features into outbound/return pairs.
  Features at even indexes (0,2,4...) = outbound
  Features at odd indexes  (1,3,5...) = return
  This works because your GeoJSON alternates: out, ret, out, ret...
*/
function pairDirections(features) {
  const pairs = [];
  for (let i = 0; i < features.length; i += 2) {
    pairs.push({
      outbound: features[i],
      return: features[i + 1] || null,
    });
  }
  return pairs;
}

/* ── MAIN IMPORT FUNCTION ── */

let globalLineCounter = 1; /* sequential name counter across all files */

LINE_FILES.forEach(function (config) {
  const filePath = path.join(__dirname, config.file);

  if (!fs.existsSync(filePath)) {
    console.log("File not found, skipping:", config.file);
    return;
  }

  const geojson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const features = geojson.features || [];
  const pairs = pairDirections(features);

  console.log(
    "\n=== Importing",
    config.type,
    "lines from",
    path.basename(config.file),
    "===",
  );
  console.log("Found", features.length, "features →", pairs.length, "lines");

  pairs.forEach(function (pair) {
    const outbound = pair.outbound;
    const ret = pair.return;

    /*
      line_id = the outbound route name (unique identifier)
      name    = sequential number — you update this later to the real line number
    */
    const lineId = outbound.properties.name;
    const lineName = String(globalLineCounter);
    const color = outbound.properties.stroke || config.color;

    /* Insert the line into the lines table */
    try {
      db.prepare(
        `
        INSERT OR IGNORE INTO lines (id, name, type, color)
        VALUES (?, ?, ?, ?)
      `,
      ).run(lineId, lineName, config.type, color);
    } catch (e) {
      console.log("  Skipped duplicate line:", lineId);
      globalLineCounter++;
      return;
    }

    /* Store the outbound route geometry */
    const outboundGeoJSON = {
      type: "Feature",
      properties: {
        line_id: lineId,
        name: lineName,
        type: config.type,
        color: color,
        direction: "outbound",
      },
      geometry: outbound.geometry,
    };

    db.prepare(
      `
      INSERT OR REPLACE INTO line_routes (line_id, geojson)
      VALUES (?, ?)
    `,
    ).run(lineId + "_out", JSON.stringify(outboundGeoJSON));

    /* Store the return route geometry if it exists */
    if (ret) {
      const returnGeoJSON = {
        type: "Feature",
        properties: {
          line_id: lineId,
          name: lineName,
          type: config.type,
          color: color,
          direction: "return",
        },
        geometry: ret.geometry,
      };

      db.prepare(
        `
        INSERT OR REPLACE INTO line_routes (line_id, geojson)
        VALUES (?, ?)
      `,
      ).run(lineId + "_ret", JSON.stringify(returnGeoJSON));
    }

    console.log(
      "  [" +
        lineName +
        "] " +
        lineId.substring(0, 60) +
        (lineId.length > 60 ? "..." : "") +
        " (" +
        color +
        ")",
    );

    globalLineCounter++;
  });
});

console.log("\n✓ Import complete.");
console.log("Total lines imported:", globalLineCounter - 1);
console.log("\nNext steps:");
console.log("1. Open transit.db in your SQLite editor");
console.log(
  '2. Update the "name" column in the lines table with real line numbers',
);
console.log(
  "3. Run generate-routes.js if you want auto-generated routes from stops",
);
