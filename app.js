/*
  ══════════════════════════════════════════════════════════════
  app.js  —  Transit Maps App
  ══════════════════════════════════════════════════════════════

  SECTIONS
  ────────
   1.  Create the map & tile layers
   2.  Landmark markers
   3.  Map click → marker + info card
   4.  Search (Nominatim API)
   5.  GPS "My Location"
   6.  Directions + stops (Routing Machine)
   7.  Sidebar open / close
   8.  Dark mode toggle
   9.  Saved places
  10.  Nearby search
  11.  Quick shortcuts (Home, Work, Share, Print)
  12.  Fullscreen
  13.  Toast notification helper
  14.  Keyboard shortcuts
  15.  Resize handler
  ══════════════════════════════════════════════════════════════
*/

/* ════════════════════════════════════════════════════════════
   1. CREATE THE MAP & TILE LAYERS
   ════════════════════════════════════════════════════════════ */

/*
  L.map('map') tells Leaflet to draw the map inside <div id="map">.
  center: [latitude, longitude] — Algiers city centre
  zoom: 13 — city-level (1 = whole world, 19 = street level)
  zoomControl: false — we use our own zoom buttons
*/
const map = L.map("map", {
  center: [36.737, 3.0865],
  zoom: 13,
  zoomControl: false,
  attributionControl: true,
});

/*
  Tile layers are the actual map images, cut into small squares.
  We define four styles so the user can switch between them.
*/
const tileLayers = {
  Default: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }),

  Satellite: L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: '© <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 19,
    },
  ),

  Terrain: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://opentopomap.org/">OpenTopoMap</a>',
    maxZoom: 17,
  }),

  Dark: L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution: '© <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    },
  ),
};

/* Add the Default layer when the page first loads */
tileLayers.Default.addTo(map);
let currentLayer = "Default";

/*
  switchLayer() cycles through the four styles one by one.
  Each call removes the current layer and adds the next one.
*/
function switchLayer() {
  const names =
    Object.keys(tileLayers); /* ['Default','Satellite','Terrain','Dark'] */
  const nextIndex = (names.indexOf(currentLayer) + 1) % names.length;
  const nextName = names[nextIndex];

  map.removeLayer(tileLayers[currentLayer]); /* remove old layer */
  tileLayers[nextName].addTo(map); /* add new layer    */

  currentLayer = nextName;
  document.getElementById("layer-label").textContent = nextName;
  document.getElementById("current-layer-name").textContent =
    "Currently: " + nextName;

  showToast("Map style: " + nextName);
}

/* ════════════════════════════════════════════════════════════
   2. LANDMARK MARKERS
   ════════════════════════════════════════════════════════════ */

/*
  A list of famous places in Algiers.
  Each object has: name, lat, lng, type, desc
  "type" is used to pick the marker colour.
*/
const landmarks = [];

/* One colour per landmark category */
const iconColors = {
  university: "#1a73e8" /* blue   */,
  mosque: "#34a853" /* green  */,
  monument: "#ea4335" /* red    */,
  airport: "#5f6368" /* grey   */,
  heritage: "#ff6d00" /* orange */,
  park: "#34a853" /* green  */,
  beach: "#0097a7" /* teal   */,
};

/*
  createIcon(color) builds a custom teardrop-shaped Leaflet marker.
  L.divIcon lets us use plain HTML+CSS instead of an image file.
*/
function createIcon(color) {
  return L.divIcon({
    className: "" /* remove Leaflet's default white square */,
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [16, 32] /* tip of the teardrop sits on the coordinate */,
    popupAnchor: [0, -36],
  });
}

/* Place a marker on the map for every landmark */
landmarks.forEach(function (place) {
  const color = iconColors[place.type] || "#1a73e8";
  const marker = L.marker([place.lat, place.lng], { icon: createIcon(color) });

  /* Small popup that appears when the marker is clicked */
  marker.bindPopup(`
    <strong style="font-size:14px;">${place.name}</strong><br>
    <span style="color:#5f6368; font-size:12px;">${place.desc}</span>
  `);

  /* Also show the info card at the bottom of the screen */
  marker.on("click", function () {
    showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
  });

  marker.addTo(map);
});

/* ════════════════════════════════════════════════════════════
   3. MAP CLICK → MARKER + INFO CARD
   ════════════════════════════════════════════════════════════ */

/*
  We store the last-clicked coordinates so other functions
  (Save, Share, Directions) know which place is selected.
*/
let clickedLat = 36.737;
let clickedLng = 3.0865;
let clickedMarker =
  null; /* the marker dropped on click — we keep a reference so we can remove it */

/*
  When the user clicks anywhere on the map (not on a marker):
  1. Remove the previous click marker if there is one
  2. Drop a new blue marker at the clicked spot
  3. Show the info card at the bottom
*/
map.on("click", function (event) {
  clickedLat = event.latlng.lat;
  clickedLng = event.latlng.lng;

  /* Remove the old marker */
  if (clickedMarker) map.removeLayer(clickedMarker);

  /* Drop a new marker */
  clickedMarker = L.marker([clickedLat, clickedLng], {
    icon: createIcon("#1a73e8"),
  }).addTo(map);

  showInfoCard("Custom Location", clickedLat.toFixed(5), clickedLng.toFixed(5));
});

/* Show the info card with a place name and coordinates */
function showInfoCard(name, lat, lng) {
  document.getElementById("info-title").textContent = name;
  document.getElementById("info-sub").textContent = lat + ", " + lng;
  document.getElementById("info-card").classList.add("open");
}

/* Close the info card AND remove the click marker */
function closeInfoCard() {
  document.getElementById("info-card").classList.remove("open");
  if (clickedMarker) {
    map.removeLayer(clickedMarker);
    clickedMarker = null;
  }
}

/* ════════════════════════════════════════════════════════════
   4. SEARCH  (Nominatim geocoding API — free, no key needed)
   ════════════════════════════════════════════════════════════ */

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const clearBtn = document.getElementById("clear-btn");

/* Show the × button when the user has typed something */
searchInput.addEventListener("input", function () {
  clearBtn.style.display = searchInput.value.length > 0 ? "flex" : "none";
});

/* × button: clear the input, hide results, refocus the input */
clearBtn.onclick = function () {
  searchInput.value = "";
  clearBtn.style.display = "none";
  searchResults.style.display = "none";
  searchInput.focus();
};

/* Trigger search on Enter key or the arrow button */
searchInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") doSearch();
});
document.getElementById("search-btn").onclick = doSearch;

/*
  doSearch() sends the user's text to the Nominatim API,
  which returns a list of matching places as JSON.
  fetch() is the modern way to make web requests in JavaScript.
*/
function doSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  /* Show a spinner while waiting for the API response */
  searchResults.innerHTML =
    '<div class="result-item"><i class="fa-solid fa-spinner fa-spin"></i> Searching…</div>';
  searchResults.style.display = "block";

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&q=" +
    encodeURIComponent(query) /* make text safe for URLs */ +
    "&limit=6&addressdetails=1";

  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (results) {
      searchResults.innerHTML = "";

      if (results.length === 0) {
        searchResults.innerHTML = `
          <div class="result-item">
            <i class="fa-solid fa-circle-exclamation"></i>
            <div class="result-item-text">
              <span class="result-item-name">No results found</span>
              <span class="result-item-detail">Try a different search term</span>
            </div>
          </div>`;
        return;
      }

      /* Build one clickable row per result */
      results.forEach(function (item) {
        const div = document.createElement("div");
        div.className = "result-item";

        /* Split the long address into a short name + detail */
        const parts = item.display_name.split(",");
        const title = parts[0].trim();
        const detail = parts.slice(1, 3).join(",").trim();

        div.innerHTML = `
          <i class="fa-solid fa-location-dot"></i>
          <div class="result-item-text">
            <span class="result-item-name">${title}</span>
            <span class="result-item-detail">${detail}</span>
          </div>
        `;

        /* Clicking a result: fly the map there, drop a marker, show info card */
        div.onclick = function () {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);

          map.flyTo([lat, lng], 16, { duration: 1.5 });

          /* Remove old click marker and place a new one */
          if (clickedMarker) map.removeLayer(clickedMarker);
          clickedMarker = L.marker([lat, lng], { icon: createIcon("#1a73e8") })
            .addTo(map)
            .bindPopup(title)
            .openPopup();

          clickedLat = lat;
          clickedLng = lng;
          showInfoCard(title, lat.toFixed(5), lng.toFixed(5));
          searchResults.style.display = "none";
          clearBtn.style.display = "flex";
        };

        searchResults.appendChild(div);
      });

      searchResults.style.display = "block";
    })
    .catch(function () {
      searchResults.innerHTML =
        '<div class="result-item">Search failed. Check your internet.</div>';
    });
}

/* Hide the dropdown when the user clicks anywhere outside the search box */
document.addEventListener("click", function (e) {
  if (
    !e.target.closest("#search-box") &&
    !e.target.closest("#search-results")
  ) {
    searchResults.style.display = "none";
  }
});

/* ════════════════════════════════════════════════════════════
   5. GPS "MY LOCATION"
   ════════════════════════════════════════════════════════════ */

let locationMarker = null; /* the blue dot showing the user's position */

document.getElementById("locate-btn").onclick = function () {
  /*
    navigator.geolocation is built into every modern browser.
    getCurrentPosition() asks for permission, then calls our callback
    with the user's GPS coordinates.
  */
  if (!navigator.geolocation) {
    showToast("Geolocation not supported by your browser");
    return;
  }

  showToast("Finding your location…");

  navigator.geolocation.getCurrentPosition(
    /* SUCCESS callback — we received the coordinates */
    function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      map.flyTo([lat, lng], 16, { duration: 1.5 });

      /* Remove the previous location dot if there was one */
      if (locationMarker) map.removeLayer(locationMarker);

      /* Draw a filled blue circle (like Google Maps' blue dot) */
      locationMarker = L.circleMarker([lat, lng], {
        radius: 10,
        color: "#ffffff" /* white ring */,
        weight: 3,
        fillColor: "#1a73e8" /* blue fill  */,
        fillOpacity: 0.9,
      }).addTo(map);

      locationMarker
        .bindPopup(
          "<strong>You are here</strong><br>" +
            lat.toFixed(5) +
            ", " +
            lng.toFixed(5),
        )
        .openPopup();

      clickedLat = lat;
      clickedLng = lng;
      showInfoCard("My Location", lat.toFixed(5), lng.toFixed(5));
      showToast("Location found!");
    },

    /* ERROR callback — permission denied or GPS unavailable */
    function (error) {
      const messages = {
        1: "Location access denied. Allow it in your browser settings.",
        2: "Position unavailable. Try again.",
        3: "Location request timed out.",
      };
      showToast(messages[error.code] || "Could not get your location.");
    },
  );
};

/* ════════════════════════════════════════════════════════════
   6. DIRECTIONS + STOPS  (Leaflet Routing Machine)
   ════════════════════════════════════════════════════════════ */

let routingControl = null; /* the active route drawn on the map */
let directionProfile = "driving"; /* current transport mode */

/* Show the directions panel */
function openDirections() {
  document.getElementById("directions-panel").style.display = "block";
  closeSidebar();
}

/* Hide the panel, clear stops, remove the route from the map */
function closeDirections() {
  document.getElementById("directions-panel").style.display = "none";
  document.getElementById("route-summary").innerHTML = "";
  document.getElementById("stops-container").innerHTML =
    ""; /* clear stop inputs */
  document.getElementById("stop-dots").innerHTML =
    ""; /* clear dot connectors */

  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
}

/* Highlight the selected transport mode button */
function setDirectionMode(btn, mode) {
  directionProfile = mode;
  document.querySelectorAll(".mode-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  btn.classList.add("active");
}

/*
  addStop() inserts a new text input between the origin and destination.
  It also adds a matching orange dot to the visual connector on the left.
*/
function addStop() {
  const container = document.getElementById("stops-container");
  const stopDots = document.getElementById("stop-dots");
  const stopNum = container.children.length + 1;

  /* ── Build the input row ── */
  const row = document.createElement("div");
  row.className = "stop-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "stop-input";
  input.placeholder = "Stop " + stopNum;

  /* × button to remove this stop */
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-stop-btn";
  removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  removeBtn.title = "Remove stop";

  removeBtn.onclick = function () {
    /* Find the index of this row among all stop rows */
    const index = Array.from(container.children).indexOf(row);
    container.removeChild(row);

    /* Remove the matching dot group from the visual connector */
    const dots = stopDots.querySelectorAll(".stop-dot-group");
    if (dots[index]) stopDots.removeChild(dots[index]);
  };

  row.appendChild(input);
  row.appendChild(removeBtn);
  container.appendChild(row);

  /* ── Add a matching orange dot to the left connector ── */
  const dotGroup = document.createElement("div");
  dotGroup.className = "stop-dot-group";
  dotGroup.style.display = "flex";
  dotGroup.style.flexDirection = "column";
  dotGroup.style.alignItems = "center";

  /* Dashed line above the dot */
  const dotLine = document.createElement("div");
  dotLine.className = "stop-dot-line";

  /* The orange dot itself */
  const dot = document.createElement("div");
  dot.className = "stop-dot";

  dotGroup.appendChild(dotLine);
  dotGroup.appendChild(dot);
  stopDots.appendChild(dotGroup);
}

/*
  getRoute() reads all inputs (from, stops, to),
  geocodes each address using Nominatim,
  then draws the route using Leaflet Routing Machine.
*/
function getRoute() {
  const from = document.getElementById("from-input").value.trim();
  const to = document.getElementById("to-input").value.trim();

  if (!from || !to) {
    showToast("Please fill in both start and destination");
    return;
  }

  /* Collect all stop inputs that have text in them */
  const stopInputs = document.querySelectorAll(".stop-input");
  const allAddresses = [from];
  stopInputs.forEach(function (input) {
    if (input.value.trim()) allAddresses.push(input.value.trim());
  });
  allAddresses.push(to);

  showToast("Calculating route…");

  /*
    geocode() converts one address string into GPS coordinates
    using the free Nominatim API.
  */
  const geocode = function (address) {
    return fetch(
      "https://nominatim.openstreetmap.org/search?format=json&q=" +
        encodeURIComponent(address) +
        "&limit=1",
    ).then(function (r) {
      return r.json();
    });
  };

  /*
    Promise.all() sends all geocode requests at the same time (faster).
    It waits until ALL of them are done, then gives us all the results.
  */
  Promise.all(allAddresses.map(geocode))
    .then(function (results) {
      /* Make sure every address was found */
      for (let i = 0; i < results.length; i++) {
        if (!results[i][0]) {
          showToast("Could not find: " + allAddresses[i]);
          return;
        }
      }

      /* Convert each result into a Leaflet LatLng object */
      const waypoints = results.map(function (result) {
        return L.latLng(parseFloat(result[0].lat), parseFloat(result[0].lon));
      });

      /* Remove any existing route before drawing the new one */
      if (routingControl) map.removeControl(routingControl);

      /* Draw the route through all waypoints */
      routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true,
        show: false /* hide Leaflet's default turn-by-turn panel */,
        lineOptions: {
          styles: [{ color: "#1a73e8", weight: 5, opacity: 0.85 }],
        },
        /*
          createMarker() lets us customise the start, stop, and end markers.
          i = index of the waypoint (0 = start, last = end, anything in between = stop)
        */
        createMarker: function (i, wp) {
          let color = "#1a73e8"; /* blue  = start */
          if (i === waypoints.length - 1) color = "#ea4335"; /* red   = end   */
          else if (i > 0) color = "#ff6d00"; /* orange = stop  */
          return L.marker(wp.latLng, { icon: createIcon(color) });
        },
      }).addTo(map);

      /* Once the route is calculated, show distance and time */
      routingControl.on("routesfound", function (e) {
        const route = e.routes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(
          1,
        ); /* metres → km */
        const minutes = Math.round(route.summary.totalTime / 60);

        document.getElementById("route-summary").innerHTML = `
          <span><i class="fa-solid fa-road"></i> ${distance} km</span>
          <span><i class="fa-solid fa-clock"></i> ~${minutes} min</span>
        `;
        showToast("Route found: " + distance + " km");
      });
    })
    .catch(function () {
      showToast("Route calculation failed. Check your internet.");
    });
}

/* ════════════════════════════════════════════════════════════
   7. SIDEBAR OPEN / CLOSE
   ════════════════════════════════════════════════════════════ */

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("visible");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("visible");
}

/* Hamburger button toggles the sidebar open/closed */
document.getElementById("menu-btn").onclick = function () {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
};

/* The × inside the sidebar header closes it */
document.getElementById("sidebar-close").onclick = closeSidebar;

/* ════════════════════════════════════════════════════════════
   8. DARK MODE TOGGLE
   ════════════════════════════════════════════════════════════ */

let darkMode = false;

document.getElementById("dark-mode-btn").onclick = function () {
  darkMode = !darkMode;

  /* Adding/removing the "dark" class on <body> triggers dark-mode CSS rules */
  document.body.classList.toggle("dark", darkMode);

  /* Swap the moon icon for a sun icon (and back) */
  const icon = this.querySelector("i");
  icon.className = darkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";

  /* Also switch the map tile layer to match */
  if (darkMode && currentLayer !== "Dark") {
    map.removeLayer(tileLayers[currentLayer]);
    tileLayers["Dark"].addTo(map);
    currentLayer = "Dark";
    document.getElementById("layer-label").textContent = "Dark";
    document.getElementById("current-layer-name").textContent =
      "Currently: Dark";
  } else if (!darkMode && currentLayer === "Dark") {
    map.removeLayer(tileLayers["Dark"]);
    tileLayers["Default"].addTo(map);
    currentLayer = "Default";
    document.getElementById("layer-label").textContent = "Default";
    document.getElementById("current-layer-name").textContent =
      "Currently: Default";
  }

  showToast(darkMode ? "Dark mode on" : "Dark mode off");
};

/* ════════════════════════════════════════════════════════════
   9. SAVED PLACES
   ════════════════════════════════════════════════════════════ */

/*
  savedPlaces stores the user's bookmarks as an array of objects.
  Each object: { name, lat, lng }
*/
let savedPlaces = [{ name: "USTHB University", lat: 36.7122, lng: 3.1622 }];

/* Save the place currently shown in the info card */
function saveCurrentPlace() {
  const name = document.getElementById("info-title").textContent;

  /* Prevent saving the same place twice */
  const alreadySaved = savedPlaces.some(function (p) {
    return p.name === name;
  });
  if (alreadySaved) {
    showToast('"' + name + '" is already saved');
    return;
  }

  savedPlaces.push({ name: name, lat: clickedLat, lng: clickedLng });
  showToast('"' + name + '" saved!');
}

/* Build and show the saved places popup */
function showSavedPlaces() {
  const list = document.getElementById("saved-list");
  list.innerHTML = "";

  if (savedPlaces.length === 0) {
    list.innerHTML = `
      <div class="saved-empty">
        <i class="fa-regular fa-star" style="font-size:24px; display:block; margin-bottom:8px;"></i>
        No saved places yet.<br>Click "Save" on any location.
      </div>`;
  } else {
    savedPlaces.forEach(function (place) {
      const div = document.createElement("div");
      div.className = "saved-item";
      div.innerHTML = `
        <i class="fa-solid fa-star"></i>
        <div>
          <div class="saved-item-text">${place.name}</div>
          <div class="saved-item-coords">${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}</div>
        </div>
      `;
      /* Clicking a saved item flies the map to that location */
      div.onclick = function () {
        map.flyTo([place.lat, place.lng], 15, { duration: 1.2 });
        showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
        closeSavedPlaces();
      };
      list.appendChild(div);
    });
  }

  document.getElementById("saved-popup").style.display = "block";
  closeSidebar();
}

function closeSavedPlaces() {
  document.getElementById("saved-popup").style.display = "none";
}

/* ════════════════════════════════════════════════════════════
   10. NEARBY SEARCH
   ════════════════════════════════════════════════════════════ */

/*
  showNearby(category) searches for places of a given type
  (e.g. 'metro stations', 'bus stations') near Algiers
  using the Nominatim API and drops orange markers on the map.
*/
function showNearby(category) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&q=" +
    encodeURIComponent(category + " Algiers") +
    "&limit=5";

  showToast("Searching for " + category + "…");
  closeSidebar();

  fetch(url)
    .then(function (r) {
      return r.json();
    })
    .then(function (results) {
      if (results.length === 0) {
        showToast("No " + category + " found nearby");
        return;
      }

      /* Drop an orange marker for each result */
      results.forEach(function (item) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const name = item.display_name.split(",")[0];

        L.marker([lat, lng], { icon: createIcon("#ff6d00") })
          .addTo(map)
          .bindPopup("<strong>" + name + "</strong>");
      });

      showToast("Found " + results.length + " " + category);
    })
    .catch(function () {
      showToast("Search failed. Check your internet.");
    });
}

/* ════════════════════════════════════════════════════════════
   11. QUICK SHORTCUTS  (Home, Work, Share, Print)
   ════════════════════════════════════════════════════════════ */

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
  This is more reliable than window.print() for maps.
*/
function printMap() {
  closeSidebar();
  showToast("Capturing map…");

  /* onbeforeprint fires at the right moment before the print dialog */
  window.onbeforeprint = function () {
    map.invalidateSize();
  };
  window.onafterprint = function () {
    map.invalidateSize();
  };

  /* Use leaflet-image if it is loaded, otherwise fall back to print */
  if (typeof leafletImage !== "undefined") {
    setTimeout(function () {
      leafletImage(map, function (err, canvas) {
        if (err) {
          showToast("Could not capture map. Try again.");
          return;
        }
        /* Create a temporary download link and click it */
        const link = document.createElement("a");
        link.download = "transit-map.png";
        link.href = canvas.toDataURL();
        link.click();
        showToast("Map saved as transit-map.png!");
      });
    }, 800);
  } else {
    /* Fallback: open the browser print dialog */
    setTimeout(function () {
      window.print();
    }, 300);
  }
}

/* Placeholder for a future settings panel */
function openSettings() {
  showToast("Settings coming soon!");
  closeSidebar();
}

/* ════════════════════════════════════════════════════════════
   12. FULLSCREEN
   ════════════════════════════════════════════════════════════ */

function toggleFullscreen() {
  const icon = document.getElementById("fullscreen-icon");

  if (!document.fullscreenElement) {
    /* Ask the browser to go fullscreen */
    document.documentElement.requestFullscreen().then(function () {
      icon.className = "fa-solid fa-compress";
      showToast("Fullscreen — press Esc to exit");
    });
  } else {
    document.exitFullscreen().then(function () {
      icon.className = "fa-solid fa-expand";
    });
  }
}

/* Keep the icon in sync when the user presses Esc to exit fullscreen */
document.addEventListener("fullscreenchange", function () {
  const icon = document.getElementById("fullscreen-icon");
  icon.className = document.fullscreenElement
    ? "fa-solid fa-compress"
    : "fa-solid fa-expand";
});

/* ════════════════════════════════════════════════════════════
   13. TOAST NOTIFICATION HELPER
   ════════════════════════════════════════════════════════════ */

let toastTimer = null;

/*
  showToast(message) slides a small pill notification up from the bottom,
  displays it for 2.5 seconds, then fades it out automatically.
*/
function showToast(message) {
  const toast = document.getElementById("toast");

  /* Cancel any existing timer so toasts don't overlap */
  if (toastTimer) clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}

/* ════════════════════════════════════════════════════════════
   14. KEYBOARD SHORTCUTS
   ════════════════════════════════════════════════════════════ */

document.addEventListener("keydown", function (e) {
  /* Do nothing when the user is typing inside an input field */
  if (e.target.tagName === "INPUT") return;

  switch (e.key) {
    case "Escape":
      /* Close everything */
      closeInfoCard();
      closeSavedPlaces();
      closeDirections();
      closeSidebar();
      searchResults.style.display = "none";
      break;

    case "+":
    case "=" /* = is the unshifted + on most keyboards */:
      map.zoomIn();
      break;

    case "-":
      map.zoomOut();
      break;

    case "f":
    case "F":
      toggleFullscreen();
      break;

    case "d":
    case "D":
      document.getElementById("dark-mode-btn").click();
      break;

    case "/":
      e.preventDefault(); /* stop browser's built-in find bar */
      searchInput.focus();
      break;
  }
});

/* ════════════════════════════════════════════════════════════
   15. RESIZE HANDLER
   Resets the sidebar state when the window is resized.
   On desktop (≥ 768px) the overlay is never needed.
   ════════════════════════════════════════════════════════════ */

function handleResize() {
  if (window.innerWidth >= 768) {
    document.getElementById("sidebar-overlay").classList.remove("visible");
  }
}

window.addEventListener("resize", handleResize);
handleResize(); /* run once on page load */

/*
  invalidateSize() tells Leaflet to remeasure the map container.
  We call it after a short delay to ensure the layout has settled
  before Leaflet tries to calculate the tile grid.
*/
setTimeout(function () {
  map.invalidateSize();
}, 300);

/* the database of landmarks is loaded from a separate file */
/* ════════════════════════════════════════════════════════════
   TRANSIT STOPS — one GeoJSON file per category
   ════════════════════════════════════════════════════════════

   HOW TO ADD A NEW CATEGORY IN THE FUTURE:
   1. Create a new .geojson file inside the stops/ folder
   2. Add one new line to the stopCategories array below
   That's it — no other code changes needed.
   ════════════════════════════════════════════════════════════ */

/*
  stopCategories defines every transit type.
  Each object has:
    type  — the label shown in the popup ("metro stop", "bus stop" etc.)
    color — the dot color on the map
    file  — path to the GeoJSON file, relative to index.html
*/
const stopCategories = [
  {
    type: "metro",
    color: "#0077ff",
    file: "stops/metro.geojson",
  } /* light blue  */,
  {
    type: "bus",
    color: "#ea4335",
    file: "stops/bus.geojson",
  } /* red         */,
  {
    type: "tram",
    color: "#14ee4e",
    file: "stops/tram.geojson",
  } /* green       */,
  {
    type: "train",
    color: "#011985",
    file: "stops/train.geojson",
  } /* orange      */,
  {
    type: "telecabine",
    color: "#009439",
    file: "stops/telecabine.geojson",
  } /* purple      */,
];

/*
  createStopIcon(color) builds a small filled circle marker.
  We use a simple dot (not the teardrop shape) so that hundreds
  of stops don't visually clutter the map.

  The white border (2px solid white) makes the dot visible
  on both light and dark map tile styles.
*/
function createStopIcon(color) {
  return L.divIcon({
    className: "" /* remove Leaflet's default white square background */,
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
    iconSize: [12, 12] /* total size of the icon in pixels      */,
    iconAnchor: [6, 6] /* center of the dot sits on the coordinate */,
    popupAnchor: [0, -8] /* popup appears just above the dot      */,
  });
}

/*
  loadCategory(category) fetches one GeoJSON file and adds
  all its stops to the map.

  Each category is loaded independently — if one file is
  missing or has an error, the other categories still load fine.
*/
function loadCategory(category) {
  fetch(category.file)
    .then(function (response) {
      /*
        response.ok is false if the file was not found (404 error).
        We skip missing files silently instead of crashing.
      */
      if (!response.ok) {
        console.log(category.file + " not found — skipping.");
        return null;
      }
      return response.json(); /* parse the file contents as JSON */
    })
    .then(function (data) {
      if (!data) return; /* skip if the file was missing */

      /*
        L.geoJSON() is Leaflet's built-in GeoJSON loader.
        It reads the features array and calls our two functions
        for each stop: pointToLayer() and onEachFeature().
      */
      L.geoJSON(data, {
        /*
          pointToLayer() is called for each stop.
          It decides what kind of marker to place on the map.
          latlng is already converted by Leaflet (it handles
          the GeoJSON [longitude, latitude] → [latitude, longitude] flip).
        */
        pointToLayer: function (feature, latlng) {
          /*
            Every stop in this file gets the same color
            because color is defined per file in stopCategories —
            no need to check feature.properties.type here.
          */
          return L.marker(latlng, { icon: createStopIcon(category.color) });
        },

        /*
          onEachFeature() is called for each stop after it's placed.
          We use it to add a popup and connect the stop to the info card.
        */
        onEachFeature: function (feature, layer) {
          /*
            feature.properties contains the stop's data from the GeoJSON file.
            We read "name" — if it's missing we fall back to "Unknown stop".
          */
          const name = feature.properties.name || "Unknown stop";

          /* Popup shown when the user clicks the dot */
          layer.bindPopup(`
            <strong style="font-size:14px;">${name}</strong><br>
            <span style="color:#5f6368; font-size:12px; text-transform:capitalize;">
              ${category.type} stop
            </span>
          `);

          layer.on("click", function (e) {
            /* Stop the click from bubbling up to the map
     (otherwise the map click event would also fire
     and drop an extra marker on top of the stop) */
            L.DomEvent.stopPropagation(e);

            const lat = feature.geometry.coordinates[1];
            const lng = feature.geometry.coordinates[0];

            /* Remove any previously dropped pin */
            if (clickedMarker) {
              map.removeLayer(clickedMarker);
              clickedMarker = null;
            }

            /* Update the clicked coordinates so Save and Share work correctly */
            clickedLat = lat;
            clickedLng = lng;

            /* Show the info card with the stop name and coordinates */
            showInfoCard(name, lat.toFixed(5), lng.toFixed(5));
          });
        },
      }).addTo(map); /* add all stops from this file to the map at once */

      console.log(category.file + " loaded successfully.");
    })
    .catch(function (error) {
      /* Network error or malformed JSON — log it but don't crash */
      console.log("Error loading " + category.file + ":", error);
    });
}

/*
  Load every category.
  forEach() loops through the stopCategories array and calls
  loadCategory() once for each entry.
  All files load at the same time (not one after another) — faster.
*/
stopCategories.forEach(function (category) {
  loadCategory(category);
});
