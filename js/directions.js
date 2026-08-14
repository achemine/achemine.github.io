/*
  ══════════════════════════════════════════════════════════════
  directions.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles directions panel (desktop) and redesigned bottom
  sheet (mobile) with:
    - Pin-on-map input
    - GPS input
    - Add/remove stops
    - Transport mode picker
    - Turn-by-turn steps view
    - Drag to resize / close
  ══════════════════════════════════════════════════════════════
*/

/* ════════════════════════════════════════════════════════════
   OPEN / CLOSE
   ════════════════════════════════════════════════════════════ */

function openDirections() {
  closeSidebar();
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    openDirectionsSheet();
  } else {
    document.getElementById("directions-panel").style.display = "block";
  }
}

function closeDirections() {
  /* Desktop */
  document.getElementById("directions-panel").style.display = "none";
  document.getElementById("route-summary").innerHTML = "";
  document.getElementById("stops-container").innerHTML = "";
  document.getElementById("stop-dots").innerHTML = "";

  /* Mobile */
  closeDirectionsSheet();

  /* Remove route */
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }

  /* Cancel any active map pick */
  cancelMapPick();
}

/* ════════════════════════════════════════════════════════════
   TRANSPORT MODE — DESKTOP
   ════════════════════════════════════════════════════════════ */

function setDirectionMode(btn, mode) {
  directionProfile = mode;
  document.querySelectorAll(".mode-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  btn.classList.add("active");
}

/* ════════════════════════════════════════════════════════════
   TRANSPORT MODE — MOBILE PICKER
   ════════════════════════════════════════════════════════════ */

/* Icons and labels per mode */
const modeConfig = {
  driving: { icon: "fa-solid fa-car", label: "Driving" },
  transit: { icon: "fa-solid fa-train", label: "Transit" },
  walking: { icon: "fa-solid fa-person-walking", label: "Walking" },
};

function toggleModePicker(e) {
  e.stopPropagation(); /* prevent the header drag from firing */
  const picker = document.getElementById("sheet-mode-picker");
  picker.classList.toggle("open");
}

function selectMode(mode) {
  directionProfile = mode;

  /* Update the header button icon */
  const modeIcon = document.getElementById("sheet-mode-icon");
  if (modeIcon) modeIcon.className = modeConfig[mode].icon;

  /* Update active state on picker options */
  document.querySelectorAll(".sheet-mode-option").forEach(function (opt) {
    opt.classList.remove("active");
    if (opt.textContent.trim().toLowerCase().startsWith(mode.charAt(0))) {
      opt.classList.add("active");
    }
  });

  /* Close the picker */
  document.getElementById("sheet-mode-picker").classList.remove("open");
  showToast("Mode: " + modeConfig[mode].label);
}

/* Close picker when tapping anywhere else */
document.addEventListener("click", function (e) {
  if (
    !e.target.closest("#sheet-mode-picker") &&
    !e.target.closest("#sheet-mode-btn")
  ) {
    const picker = document.getElementById("sheet-mode-picker");
    if (picker) picker.classList.remove("open");
  }
});

/* ════════════════════════════════════════════════════════════
   ADD / REMOVE STOPS — DESKTOP
   ════════════════════════════════════════════════════════════ */

function addStop() {
  const container = document.getElementById("stops-container");
  const stopDots = document.getElementById("stop-dots");
  buildDesktopStopRow(container, stopDots, container.children.length + 1);
}

function buildDesktopStopRow(container, stopDots, stopNum) {
  const row = document.createElement("div");
  row.className = "stop-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "stop-input";
  input.placeholder = "Stop " + stopNum;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-stop-btn";
  removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  removeBtn.onclick = function () {
    const index = Array.from(container.children).indexOf(row);
    container.removeChild(row);
    const dots = stopDots.querySelectorAll(".stop-dot-group");
    if (dots[index]) stopDots.removeChild(dots[index]);
  };

  row.appendChild(input);
  row.appendChild(removeBtn);
  container.appendChild(row);

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
   ADD / REMOVE STOPS — MOBILE SHEET
   ════════════════════════════════════════════════════════════ */

function addSheetStop() {
  const wrapper = document.getElementById("sheet-stops-wrapper");
  const stopNum = wrapper.children.length + 1;
  const inputId = "sheet-stop-" + Date.now(); /* unique id */

  const row = document.createElement("div");
  row.className = "sheet-input-row";

  /* Orange dot */
  const dot = document.createElement("div");
  dot.className = "sheet-input-dot stop";

  /* Connector line above */
  const connector = document.createElement("div");
  connector.className = "sheet-dot-connector";

  /* Input */
  const input = document.createElement("input");
  input.type = "text";
  input.id = inputId;
  input.placeholder = "Stop " + stopNum;

  /* Pin button */
  const pinBtn = document.createElement("button");
  pinBtn.className = "sheet-row-btn";
  pinBtn.title = "Pick on map";
  pinBtn.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
  pinBtn.onclick = function () {
    pickOnMap(inputId);
  };

  /* GPS button */
  const gpsBtn = document.createElement("button");
  gpsBtn.className = "sheet-row-btn";
  gpsBtn.title = "Use my location";
  gpsBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
  gpsBtn.onclick = function () {
    useGPS(inputId);
  };

  /* Remove button */
  const removeBtn = document.createElement("button");
  removeBtn.className = "sheet-remove-stop-btn";
  removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  removeBtn.onclick = function () {
    wrapper.removeChild(row);
  };

  row.appendChild(dot);
  row.appendChild(connector);
  row.appendChild(input);
  row.appendChild(pinBtn);
  row.appendChild(gpsBtn);
  row.appendChild(removeBtn);
  wrapper.appendChild(row);
}

/* ════════════════════════════════════════════════════════════
   PIN ON MAP
   Minimises the sheet so the user can tap a location,
   then fills the input and restores the sheet.
   ════════════════════════════════════════════════════════════ */

var pickingInputId = null; /* which input is waiting for a pick */
var pickingPrevHeight = 0; /* sheet height before minimising    */
var pickMapListener = null; /* the map click listener            */

function pickOnMap(inputId) {
  const sheet = document.getElementById("directions-sheet");
  if (!sheet) return;

  pickingInputId = inputId;
  pickingPrevHeight = directionSheetHeight;

  /* Minimise the sheet to just the header + hint */
  sheet.classList.add("picking");
  sheet.style.transition = "height 0.3s ease";
  sheet.style.height = "90px";

  showToast("Tap anywhere on the map to select a location");

  /* Listen for one map click */
  pickMapListener = map.once("click", function (e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    /* Fill the input with coordinates */
    const input = document.getElementById(pickingInputId);
    if (input) input.value = lat + ", " + lng;

    /* Restore the sheet */
    sheet.classList.remove("picking");
    sheet.style.height = pickingPrevHeight + "px";

    pickingInputId = null;
  });
}

function cancelMapPick() {
  const sheet = document.getElementById("directions-sheet");
  if (!sheet) return;
  sheet.classList.remove("picking");
  if (pickMapListener) {
    map.off("click", pickMapListener);
    pickMapListener = null;
  }
  pickingInputId = null;
}

/* ════════════════════════════════════════════════════════════
   USE GPS
   Fills the input with the current GPS position.
   ════════════════════════════════════════════════════════════ */

function useGPS(inputId) {
  if (!navigator.geolocation) {
    showToast("Geolocation not supported");
    return;
  }
  showToast("Getting your location…");
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);
      const input = document.getElementById(inputId);
      if (input) input.value = lat + ", " + lng;
      showToast("Location added");
    },
    function () {
      showToast("Could not get location. Check permissions.");
    },
  );
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

  calculateRoute(from, to, stops, null);
}

/* ════════════════════════════════════════════════════════════
   GET ROUTE — MOBILE SHEET
   ════════════════════════════════════════════════════════════ */

function getSheetRoute() {
  const from = document.getElementById("sheet-from-input").value.trim();
  const to = document.getElementById("sheet-to-input").value.trim();
  const stops = Array.from(
    document.querySelectorAll("#sheet-stops-wrapper input"),
  )
    .map(function (i) {
      return i.value.trim();
    })
    .filter(Boolean);

  calculateRoute(from, to, stops, "sheet");
}

/* ════════════════════════════════════════════════════════════
   CALCULATE ROUTE (shared)
   target = null (desktop) or 'sheet' (mobile)
   ════════════════════════════════════════════════════════════ */

function calculateRoute(from, to, stops, target) {
  if (!from || !to) {
    showToast("Please fill in both start and destination");
    return;
  }

  const allAddresses = [from, ...stops, to];
  showToast("Calculating route…");

  /*
    geocodeOrParse() handles two cases:
    - If the input is "lat, lng" (from pin/GPS pick) → parse directly
    - Otherwise → geocode via Nominatim
  */
  const geocodeOrParse = function (address) {
    const latLngPattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
    if (latLngPattern.test(address)) {
      const parts = address.split(",");
      return Promise.resolve([{ lat: parts[0].trim(), lon: parts[1].trim() }]);
    }
    return fetch(
      "https://nominatim.openstreetmap.org/search?format=json&q=" +
        encodeURIComponent(address) +
        "&limit=1",
    ).then(function (r) {
      return r.json();
    });
  };

  Promise.all(allAddresses.map(geocodeOrParse))
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

        if (target === "sheet") {
          /* Store route data for the steps view */
          buildStepsList(route, distance, minutes);
          showToast("Route found — tap ➤ for steps");
        } else {
          document.getElementById("route-summary").innerHTML = `
            <span><i class="fa-solid fa-road"></i> ${distance} km</span>
            <span><i class="fa-solid fa-clock"></i> ~${minutes} min</span>
          `;
          showToast("Route found: " + distance + " km");
        }
      });
    })
    .catch(function () {
      showToast("Route calculation failed. Check your internet.");
    });
}

/* ════════════════════════════════════════════════════════════
   TURN-BY-TURN STEPS VIEW
   ════════════════════════════════════════════════════════════ */

/*
  Leaflet Routing Machine gives us route.instructions —
  an array of step objects each with:
    type, text, distance, time, index, mode, modifier
*/

/* Maps instruction types to Font Awesome icons */
const stepIcons = {
  Straight: "fa-solid fa-arrow-up",
  SlightRight: "fa-solid fa-arrow-up-right",
  Right: "fa-solid fa-arrow-right",
  SharpRight: "fa-solid fa-turn-right",
  TurnAround: "fa-solid fa-rotate-left",
  SharpLeft: "fa-solid fa-turn-left",
  Left: "fa-solid fa-arrow-left",
  SlightLeft: "fa-solid fa-arrow-up-left",
  WaypointReached: "fa-solid fa-circle-dot",
  Roundabout: "fa-solid fa-rotate-right",
  StartAt: "fa-solid fa-circle",
  DestinationReached: "fa-solid fa-flag-checkered",
};

function buildStepsList(route, distance, minutes) {
  /* Update summary bar */
  document.getElementById("steps-distance").innerHTML =
    '<i class="fa-solid fa-road"></i> ' + distance + " km";
  document.getElementById("steps-time").innerHTML =
    '<i class="fa-solid fa-clock"></i> ~' + minutes + " min";

  const list = document.getElementById("steps-list");
  list.innerHTML = "";

  const instructions = route.instructions || [];

  instructions.forEach(function (step) {
    const item = document.createElement("div");
    item.className = "step-item";

    /* Pick icon based on step type */
    const iconClass = stepIcons[step.type] || "fa-solid fa-arrow-up";

    /* Format distance */
    let distText = "";
    if (step.distance >= 1000) {
      distText = (step.distance / 1000).toFixed(1) + " km";
    } else {
      distText = Math.round(step.distance) + " m";
    }

    item.innerHTML = `
      <div class="step-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="step-text">
        <div class="step-instruction">${step.text}</div>
        <div class="step-distance">${distText}</div>
      </div>
    `;

    list.appendChild(item);
  });
}

function showStepsView() {
  if (!routingControl) {
    showToast("Calculate a route first");
    return;
  }
  document.getElementById("directions-sheet-input-view").style.display = "none";
  document.getElementById("directions-sheet-steps-view").classList.add("open");
}

function hideStepsView() {
  document
    .getElementById("directions-sheet-steps-view")
    .classList.remove("open");
  document.getElementById("directions-sheet-input-view").style.display = "flex";
}

/* ════════════════════════════════════════════════════════════
   MOBILE SHEET OPEN / CLOSE
   ════════════════════════════════════════════════════════════ */

var directionSheetHeight = 0;

function openDirectionsSheet() {
  const sheet = document.getElementById("directions-sheet");
  sheet.classList.add("open");
  sheet.classList.remove("picking");

  directionSheetHeight = window.innerHeight * 0.5;
  sheet.style.height = directionSheetHeight + "px";
  sheet.style.transform = "translateY(0)";
  sheet.style.transition = "transform 0.3s ease, height 0.3s ease";

  /* Reset to input view */
  hideStepsView();

  initDirectionSheetDrag(sheet);
}

function closeDirectionsSheet() {
  const sheet = document.getElementById("directions-sheet");
  sheet.classList.remove("picking");
  sheet.style.transition = "transform 0.3s ease";
  sheet.style.transform = "translateY(100%)";

  document.getElementById("sheet-stops-wrapper").innerHTML = "";
  document.getElementById("steps-list").innerHTML = "";
  document.getElementById("steps-distance").innerHTML =
    '<i class="fa-solid fa-road"></i> --';
  document.getElementById("steps-time").innerHTML =
    '<i class="fa-solid fa-clock"></i> --';

  setTimeout(function () {
    sheet.classList.remove("open");
    sheet.style.transform = "";
    sheet.style.height = "";
    hideStepsView();
  }, 300);
}

/* ════════════════════════════════════════════════════════════
   DRAG TO RESIZE / CLOSE
   ════════════════════════════════════════════════════════════ */

var dirDragStartY = 0;
var dirDragStartHeight = 0;
var dirIsDragging = false;

var DIR_MIN_HEIGHT = 120;
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
  document.getElementById("directions-sheet").style.transition = "none";
  document.addEventListener("touchmove", dirOnTouchMove, { passive: false });
  document.addEventListener("touchend", dirOnTouchEnd);
}
function dirOnTouchMove(e) {
  if (!dirIsDragging) return;
  e.preventDefault();
  applyDirSheetHeight(
    dirDragStartHeight - (e.touches[0].clientY - dirDragStartY),
  );
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
  document.getElementById("directions-sheet").style.transition = "none";
  document.addEventListener("mousemove", dirOnMouseMove);
  document.addEventListener("mouseup", dirOnMouseUp);
}
function dirOnMouseMove(e) {
  if (!dirIsDragging) return;
  applyDirSheetHeight(dirDragStartHeight - (e.clientY - dirDragStartY));
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
  const maxH = window.innerHeight * 0.85;
  const clamped = Math.max(DIR_MIN_HEIGHT, Math.min(maxH, newHeight));
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

function turn_by_turn() {
  if (window.innerWidth < 768) {
    showStepsView();
  } else {
    const stepsPanel = document.getElementById("steps-panel");
    stepsPanel.style.display = "block";
  }
}
