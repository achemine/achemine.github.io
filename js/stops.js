/*
  ══════════════════════════════════════════════════════════════
  stops.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Loads transit stop GeoJSON files and handles category toggling.

  HOW TO ADD A NEW CATEGORY IN THE FUTURE:
  1. Create a new .geojson file inside the stops/ folder
  2. Add one new object to the stopCategories array below
  That's it — no other code changes needed.

  Depends on: variables.js, map.js, click.js (showInfoCard), ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

/*
  stopCategories defines every transit type.
  Each object has:
    type  — label shown in the popup and toast ("metro stop" etc.)
    color — dot colour on the map
    file  — path to the GeoJSON file, relative to index.html
*/
const stopCategories = [
  { type: "metro", color: "#0077ff", file: "stops/metro.geojson" },
  { type: "bus", color: "#fd1500", file: "stops/bus.geojson" },
  { type: "tram", color: "#14ee4e", file: "stops/tram.geojson" },
  { type: "train", color: "#011985", file: "stops/train.geojson" },
  { type: "telecabine", color: "#028a36", file: "stops/telecabine.geojson" },
];

/*
  createStopIcon(color) builds a small filled circle marker.
  Simple dot shape so hundreds of stops don't clutter the map.
  The white border makes it visible on both light and dark tiles.
*/
function createStopIcon(color) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 12px;
        height: 12px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

/*
  loadCategory(category) fetches one GeoJSON file and stores
  its layer in stopLayers[type].
  Each category loads independently — a missing file doesn't
  stop the others from loading.
*/
function loadCategory(category) {
  fetch(category.file)
    .then(function (response) {
      if (!response.ok) {
        console.log(category.file + " not found — skipping.");
        return null;
      }
      return response.json();
    })
    .then(function (data) {
      if (!data) return;

      /* Store the layer so toggleCategory() can show/hide it */
      stopLayers[category.type] = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          /* Every stop in this file gets the same colour */
          return L.marker(latlng, { icon: createStopIcon(category.color) });
        },

        onEachFeature: function (feature, layer) {
          const name = feature.properties.name || "Unknown stop";

          layer.bindPopup(`
            <strong style="font-size:14px;">${name}</strong><br>
            <span style="color:#5f6368; font-size:12px; text-transform:capitalize;">
              ${category.type} stop
            </span>
          `);

          layer.on("click", function (e) {
            /*
              Stop the click from bubbling up to the map —
              otherwise the map click would also fire and drop
              an extra pin on top of the stop dot.
            */
            L.DomEvent.stopPropagation(e);

            const lat =
              feature.geometry.coordinates[1]; /* GeoJSON is [lng, lat] */
            const lng = feature.geometry.coordinates[0];

            if (clickedMarker) {
              map.removeLayer(clickedMarker);
              clickedMarker = null;
            }

            clickedLat = lat;
            clickedLng = lng;
            showInfoCard(name, lat.toFixed(5), lng.toFixed(5));
          });
        },
      }).addTo(map);

      console.log(category.file + " loaded successfully.");
    })
    .catch(function (error) {
      console.log("Error loading " + category.file + ":", error);
    });
}

/*
  toggleCategory(type) hides or shows one stop category.
  - First click  → hide that category (show closed eye icon)
  - Second click → show it again (hide the eye icon)
  - If some categories are hidden, only visible ones show
  - If all are visible again → everything is back to normal
*/
function toggleCategory(type) {
  if (!stopLayers[type]) {
    showToast("Stops not loaded yet, please wait");
    return;
  }

  /* Flip: true = hidden, false = visible */
  activeCategories[type] = !activeCategories[type];

  const eye = document.getElementById("eye-" + type);

  if (activeCategories[type]) {
    /* ── Just HIDDEN ── */
    /* Remove this category from the map */
    if (map.hasLayer(stopLayers[type])) {
      map.removeLayer(stopLayers[type]);
    }
    /* Show the closed eye icon */
    if (eye) eye.style.display = "inline";
    showToast(type.charAt(0).toUpperCase() + type.slice(1) + " stops hidden");
  } else {
    /* ── Just SHOWN AGAIN ── */
    /* Add this category back to the map */
    if (!map.hasLayer(stopLayers[type])) {
      stopLayers[type].addTo(map);
    }
    /* Hide the closed eye icon */
    if (eye) eye.style.display = "none";
    showToast(type.charAt(0).toUpperCase() + type.slice(1) + " stops visible");
  }
}

/* Load every category — all files load at the same time */
stopCategories.forEach(function (category) {
  loadCategory(category);
});
