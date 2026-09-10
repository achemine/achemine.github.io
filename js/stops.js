/*
  ══════════════════════════════════════════════════════════════
  stops.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Loads transit stops from the SQLite database via the server.
  Uses stop id (integer) for all lookups — no name matching needed.
  ══════════════════════════════════════════════════════════════
*/

const stopCategories = [
  { type: "metro", color: "var(--blue)" },
  { type: "bus", color: "var(--red)" },
  { type: "tram", color: "var(--light-green)" },
  { type: "train", color: "var(--purple)" },
  { type: "telecabine", color: "var(--green)" },
];

function createStopIcon(color) {
  return L.divIcon({
    className: "stop-marker-icon",
    html: `
      <div style="
        width: 12px;
        height: 12px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid var(--white);
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

/*
  loadCategory(category) fetches stops from the server
  and places markers on the map.
*/
function loadCategory(category) {
  fetch("http://localhost:3000/api/stops/geojson/" + category.type)
    .then(function (r) {
      if (!r.ok) throw new Error("Could not load " + category.type + " stops");
      return r.json();
    })
    .then(function (data) {
      if (!data || !data.features) return;

      stopLayers[category.type] = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, { icon: createStopIcon(category.color) });
        },

        onEachFeature: function (feature, layer) {
          const stopId =
            feature.properties.id; /* integer — no name matching needed */
          const stopName = feature.properties.name || "Unknown stop";

          layer.bindPopup(`
            <strong style="font-size:14px;">${stopName}</strong><br>
            <span style="color:var(--text-secondary); font-size:12px; text-transform:capitalize;">
              ${category.type} stop
            </span>
          `);

          layer.on("click", function (e) {
            L.DomEvent.stopPropagation(e);

            /* If in pick mode — fill the input */
            if (pickingInputId) {
              const lat = feature.geometry.coordinates[1];
              const lng = feature.geometry.coordinates[0];
              const input = document.getElementById(pickingInputId);
              if (input) {
                input.value = stopName;
                input.dataset.lat = lat;
                input.dataset.lng = lng;
              }
              const sheet = document.getElementById("directions-sheet");
              if (sheet) {
                sheet.classList.remove("picking");
                sheet.style.height = pickingPrevHeight + "px";
              }
              pickingInputId = null;
              return;
            }

            /* Block on desktop if directions panel is open */
            const desktopDirOpen =
              document.getElementById("directions-panel")?.style.display ===
              "block";
            if (desktopDirOpen && window.innerWidth >= 768) return;

            /* Block on mobile if directions sheet is open */
            if (window.innerWidth < 768) {
              const dirOpen = document
                .getElementById("directions-sheet")
                ?.classList.contains("open");
              if (dirOpen) return;
            }

            const lat = feature.geometry.coordinates[1];
            const lng = feature.geometry.coordinates[0];

            if (clickedMarker) {
              map.removeLayer(clickedMarker);
              clickedMarker = null;
            }

            clickedLat = lat;
            clickedLng = lng;

            /* Store stop id and color for the Lines button */
            currentStopId = stopId;
            currentStopColor = category.color;

            showInfoCard(stopName, lat.toFixed(5), lng.toFixed(5));

            /* Refresh line slider if it is already open */
            const slider = document.getElementById("line-slider");
            if (slider && slider.classList.contains("open")) {
              openLineSliderById(stopId, stopName, category.color);
            }
          });
        },
      }).addTo(map);

      console.log(category.type + " stops loaded from database.");
    })
    .catch(function (error) {
      console.log("Error loading " + category.type + " stops:", error);
    });
}

/*
  fetchStopLines(stopId, categoryColor)
  Fetches lines by stop INTEGER id — no name matching.
  Updates the info card tags with colored line badges.
*/

function clearLineRoutes() {
  Object.keys(activeLineRoutes).forEach(function (lineId) {
    map.removeLayer(activeLineRoutes[lineId]);
  });
  activeLineRoutes = {};
}

/* Load all categories on startup */
stopCategories.forEach(function (category) {
  loadCategory(category);
});

/*
  toggleCategory(type) hides or shows one stop category.
  - First click  → hide that category (show closed eye icon)
  - Second click → show it again (hide the eye icon)
*/
function toggleCategory(type) {
  if (!stopLayers[type]) {
    showToast("Stops not loaded yet, please wait");
    return;
  }

  activeCategories[type] = !activeCategories[type];

  const eye = document.getElementById("eye-" + type);

  if (activeCategories[type]) {
    /* Just HIDDEN */
    if (map.hasLayer(stopLayers[type])) map.removeLayer(stopLayers[type]);
    if (eye) eye.style.display = "inline";
    showToast(type.charAt(0).toUpperCase() + type.slice(1) + " stops hidden");
  } else {
    /* Just SHOWN AGAIN */
    if (!map.hasLayer(stopLayers[type])) stopLayers[type].addTo(map);
    if (eye) eye.style.display = "none";
    showToast(type.charAt(0).toUpperCase() + type.slice(1) + " stops visible");
  }
}
