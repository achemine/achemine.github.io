/*
  ══════════════════════════════════════════════════════════════
  shortcuts.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Quick action shortcuts: Home, Work, Share, Print, Settings.
  Depends on: variables.js, map.js, click.js (showInfoCard), ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

/* Fly to the "Home" location */
function goHome() {
  map.flyTo([36.7122, 3.1622], 16, { duration: 1.5 });
  showInfoCard("Home – USTHB", "36.71220", "3.16220");
  closeSidebar();
}

/* Fly to the "Work" location */
function goWork() {
  map.flyTo([36.7347, 3.0458], 16, { duration: 1.5 });
  showInfoCard("Work – Grande Poste", "36.73470", "3.04580");
  closeSidebar();
}

/* Copy a shareable OpenStreetMap link to the clipboard */
function shareLocation() {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const url =
    "https://www.openstreetmap.org/#map=" +
    zoom +
    "/" +
    center.lat.toFixed(5) +
    "/" +
    center.lng.toFixed(5);

  navigator.clipboard
    .writeText(url)
    .then(function () {
      showToast("Map link copied to clipboard!");
    })
    .catch(function () {
      showToast("Link: " + url);
    });

  closeSidebar();
}

/*
  printMap() uses the leaflet-image library to capture the map
  as a PNG file and trigger a browser download.
  Falls back to window.print() if leaflet-image is not loaded.
*/
function printMap() {
  closeSidebar();
  showToast("Capturing map…");

  window.onbeforeprint = function () {
    map.invalidateSize();
  };
  window.onafterprint = function () {
    map.invalidateSize();
  };

  if (typeof leafletImage !== "undefined") {
    setTimeout(function () {
      leafletImage(map, function (err, canvas) {
        if (err) {
          showToast("Could not capture map. Try again.");
          return;
        }
        const link = document.createElement("a");
        link.download = "transit-map.png";
        link.href = canvas.toDataURL();
        link.click();
        showToast("Map saved as transit-map.png!");
      });
    }, 800);
  } else {
    setTimeout(function () {
      window.print();
    }, 300);
  }
}
