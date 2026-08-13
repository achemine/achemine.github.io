/*
  ══════════════════════════════════════════════════════════════
  directions.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the directions panel (desktop) and bottom sheet (mobile).
  On mobile: no overlay, map stays interactive, only drag closes it.
  Depends on: variables.js, map.js, markers.js, ui.js
  ══════════════════════════════════════════════════════════════
*/

/* ════════════════════════════════════════════════════════════
   OPEN / CLOSE
   ════════════════════════════════════════════════════════════ */

function openDirections() {
  const isMobile = window.innerWidth < 768;
  closeSidebar();

  if (isMobile) {
    openDirectionsSheet();
  } else {
    document.getElementById("directions-panel").style.display = "block";
  }
}

function closeDirections() {
  /* Close desktop panel */
  document.getElementById("directions-panel").style.display = "none";
  document.getElementById("route-summary").innerHTML = "";
  document.getElementById("stops-container").innerHTML = "";
  document.getElementById("stop-dots").innerHTML = "";

  /* Close mobile sheet */
  closeDirectionsSheet();

  /* Remove route from map */
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
}

/* ════════════════════════════════════════════════════════════
   TRANSPORT MODE
   ════════════════════════════════════════════════════════════ */

function setDirectionMode(btn, mode) {
  directionProfile = mode;
  /* Update active state on ALL mode buttons (both panel and sheet) */
  document.querySelectorAll(".mode-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  btn.classList.add("active");
}

/* ════════════════════════════════════════════════════════════
   ADD STOP — DESKTOP PANEL
   ════════════════════════════════════════════════════════════ */

function addStop() {
  const container = document.getElementById("stops-container");
  const stopDots = document.getElementById("stop-dots");
  buildStopRow(container, stopDots, container.children.length + 1);
}

/* ════════════════════════════════════════════════════════════
   ADD STOP — MOBILE SHEET
   ════════════════════════════════════════════════════════════ */

function addSheetStop() {
  const container = document.getElementById("directions-sheet-stops-container");
  const stopDots = document.getElementById("directions-sheet-stop-dots");
  buildStopRow(container, stopDots, container.children.length + 1);
}

/*
  buildStopRow() is shared by both desktop and mobile.
  It creates one stop input row + matching dot in the connector.
*/
function buildStopRow(container, stopDots, stopNum) {
  const row = document.createElement("div");
  row.className = "stop-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "stop-input";
  input.placeholder = "Stop " + stopNum;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-stop-btn";
  removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  removeBtn.title = "Remove stop";

  removeBtn.onclick = function () {
    const index = Array.from(container.children).indexOf(row);
    container.removeChild(row);
    const dots = stopDots.querySelectorAll(".stop-dot-group");
    if (dots[index]) stopDots.removeChild(dots[index]);
  };

  row.appendChild(input);
  row.appendChild(removeBtn);
  container.appendChild(row);

  /* Add matching orange dot to the connector */
  const dotGroup = document.createElement("div");
  dotGroup.className = "stop-dot-group";
  dotGroup.style.display = "flex";
  dotGroup.style.flexDirection = "column";
  dotGroup.style.alignItems = "center";

  const dotLine = document.createElement("div");
  dotLine.className = "stop-dot-line";

  const dot = document.createElement("div");
  dot.className = "stop-dot";

  dotGroup.appendChild(dotLine);
  dotGroup.appendChild(dot);
  stopDots.appendChild(dotGroup);
}

/* ════════════════════════════════════════════════════════════
   GET ROUTE — DESKTOP
   ════════════════════════════════════════════════════════════ */

function getRoute() {
  const from = document.getElementById("from-input").value.trim();
  const to = document.getElementById("to-input").value.trim();
  const stops = Array.from(
    document.querySelectorAll("#stops-container .stop-input"),
  )
    .map(function (i) {
      return i.value.trim();
    })
    .filter(Boolean);

  calculateRoute(from, to, stops, "route-summary");
}

/* ════════════════════════════════════════════════════════════
   GET ROUTE — MOBILE SHEET
   ════════════════════════════════════════════════════════════ */

function getSheetRoute() {
  const from = document.getElementById("sheet-from-input").value.trim();
  const to = document.getElementById("sheet-to-input").value.trim();
  const stops = Array.from(
    document.querySelectorAll("#directions-sheet-stops-container .stop-input"),
  )
    .map(function (i) {
      return i.value.trim();
    })
    .filter(Boolean);

  calculateRoute(from, to, stops, "directions-sheet-summary");
}

/*
  calculateRoute() is shared by both desktop and mobile.
  summaryId = the id of the element to write distance/time into.
*/
function calculateRoute(from, to, stops, summaryId) {
  if (!from || !to) {
    showToast("Please fill in both start and destination");
    return;
  }

  const allAddresses = [from, ...stops, to];
  showToast("Calculating route…");

  const geocode = function (address) {
    return fetch(
      "https://nominatim.openstreetmap.org/search?format=json&q=" +
        encodeURIComponent(address) +
        "&limit=1",
    ).then(function (r) {
      return r.json();
    });
  };

  Promise.all(allAddresses.map(geocode))
    .then(function (results) {
      for (let i = 0; i < results.length; i++) {
        if (!results[i][0]) {
          showToast("Could not find: " + allAddresses[i]);
          return;
        }
      }

      const waypoints = results.map(function (result) {
        return L.latLng(parseFloat(result[0].lat), parseFloat(result[0].lon));
      });

      if (routingControl) map.removeControl(routingControl);

      routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true,
        show: false,
        lineOptions: {
          styles: [{ color: "#1a73e8", weight: 5, opacity: 0.85 }],
        },
        createMarker: function (i, wp) {
          let color = "#1a73e8";
          if (i === waypoints.length - 1) color = "#ea4335";
          else if (i > 0) color = "#ff6d00";
          return L.marker(wp.latLng, { icon: createIcon(color) });
        },
      }).addTo(map);

      routingControl.on("routesfound", function (e) {
        const route = e.routes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(1);
        const minutes = Math.round(route.summary.totalTime / 60);
        const html = `
          <span><i class="fa-solid fa-road"></i> ${distance} km</span>
          <span><i class="fa-solid fa-clock"></i> ~${minutes} min</span>
        `;
        document.getElementById(summaryId).innerHTML = html;
        showToast("Route found: " + distance + " km");
      });
    })
    .catch(function () {
      showToast("Route calculation failed. Check your internet.");
    });
}

/* ════════════════════════════════════════════════════════════
   MOBILE SHEET OPEN / CLOSE
   ════════════════════════════════════════════════════════════ */

var directionSheetHeight = 0;

function openDirectionsSheet() {
  const sheet = document.getElementById("directions-sheet");
  sheet.classList.add("open");

  /* Start at 50% height */
  directionSheetHeight = window.innerHeight * 0.5;
  sheet.style.height = directionSheetHeight + "px";
  sheet.style.transform = "translateY(0)";
  sheet.style.transition = "transform 0.3s ease, height 0.3s ease";

  initDirectionSheetDrag(sheet);
}

function closeDirectionsSheet() {
  const sheet = document.getElementById("directions-sheet");
  sheet.style.transition = "transform 0.3s ease";
  sheet.style.transform = "translateY(100%)";

  /* Clear summary and stops */
  document.getElementById("directions-sheet-summary").innerHTML = "";
  document.getElementById("directions-sheet-stops-container").innerHTML = "";
  document.getElementById("directions-sheet-stop-dots").innerHTML = "";

  setTimeout(function () {
    sheet.classList.remove("open");
    sheet.style.transform = "";
    sheet.style.height = "";
  }, 300);
}

/* ════════════════════════════════════════════════════════════
   MOBILE SHEET DRAG
   Same pattern as saved places sheet.
   No overlay — map stays fully interactive.
   Only dragging the header closes the sheet.
   ════════════════════════════════════════════════════════════ */

var dirDragStartY = 0;
var dirDragStartHeight = 0;
var dirIsDragging = false;

var DIR_MIN_HEIGHT = 120;
var DIR_MAX_HEIGHT = window.innerHeight * 0.85;
var DIR_CLOSE_THRESHOLD = window.innerHeight * 0.2;

function initDirectionSheetDrag(sheet) {
  const header = document.getElementById("directions-sheet-header");

  header.removeEventListener("touchstart", dirOnTouchStart);
  header.removeEventListener("mousedown", dirOnMouseDown);

  header.addEventListener("touchstart", dirOnTouchStart, { passive: true });
  header.addEventListener("mousedown", dirOnMouseDown);
}

function dirOnTouchStart(e) {
  if (e.target.closest("button")) return;
  dirIsDragging = true;
  dirDragStartY = e.touches[0].clientY;
  dirDragStartHeight = directionSheetHeight;

  const sheet = document.getElementById("directions-sheet");
  sheet.style.transition = "none";

  document.addEventListener("touchmove", dirOnTouchMove, { passive: false });
  document.addEventListener("touchend", dirOnTouchEnd);
}

function dirOnTouchMove(e) {
  if (!dirIsDragging) return;
  e.preventDefault();
  const deltaY = e.touches[0].clientY - dirDragStartY;
  const newHeight = dirDragStartHeight - deltaY;
  applyDirSheetHeight(newHeight);
}

function dirOnTouchEnd() {
  if (!dirIsDragging) return;
  dirIsDragging = false;
  document.removeEventListener("touchmove", dirOnTouchMove);
  document.removeEventListener("touchend", dirOnTouchEnd);
  snapDirSheet();
}

function dirOnMouseDown(e) {
  if (e.target.closest("button")) return;
  dirIsDragging = true;
  dirDragStartY = e.clientY;
  dirDragStartHeight = directionSheetHeight;

  const sheet = document.getElementById("directions-sheet");
  sheet.style.transition = "none";

  document.addEventListener("mousemove", dirOnMouseMove);
  document.addEventListener("mouseup", dirOnMouseUp);
}

function dirOnMouseMove(e) {
  if (!dirIsDragging) return;
  const deltaY = e.clientY - dirDragStartY;
  const newHeight = dirDragStartHeight - deltaY;
  applyDirSheetHeight(newHeight);
}

function dirOnMouseUp() {
  if (!dirIsDragging) return;
  dirIsDragging = false;
  document.removeEventListener("mousemove", dirOnMouseMove);
  document.removeEventListener("mouseup", dirOnMouseUp);
  snapDirSheet();
}

function applyDirSheetHeight(newHeight) {
  const sheet = document.getElementById("directions-sheet");
  const clamped = Math.max(DIR_MIN_HEIGHT, Math.min(DIR_MAX_HEIGHT, newHeight));
  directionSheetHeight = clamped;
  sheet.style.height = clamped + "px";
}

function snapDirSheet() {
  const sheet = document.getElementById("directions-sheet");
  sheet.style.transition = "height 0.3s ease";

  const screenH = window.innerHeight;
  const halfHeight = screenH * 0.5;
  const fullHeight = screenH * 0.85;
  const closeH = screenH * 0.2;

  if (directionSheetHeight < closeH) {
    /* Slide off — remove route too */
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
    closeDirectionsSheet();
  } else if (directionSheetHeight < (halfHeight + fullHeight) / 2) {
    directionSheetHeight = halfHeight;
    sheet.style.height = halfHeight + "px";
  } else {
    directionSheetHeight = fullHeight;
    sheet.style.height = fullHeight + "px";
  }
}
