/*
  ══════════════════════════════════════════════════════════════
  saved.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles saving places, star markers on the map,
  the desktop popup, and the mobile bottom sheet.
  ══════════════════════════════════════════════════════════════
*/

/* ── CREATE STAR ICON ── */

/*
  createStarIcon() builds a CSS clip-path star shape.
  clip-path: polygon() draws a 5-pointed star using coordinates.
*/
function createStarIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #fbbc04;
        clip-path: polygon(
          50% 0%, 61% 35%, 98% 35%,
          68% 57%, 79% 91%, 50% 70%,
          21% 91%, 32% 57%, 2% 35%,
          39% 35%
        );
        filter: drop-shadow(0 0 2px white) drop-shadow(0 1px 3px rgba(0,0,0,0.4));
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });
}

/* ── SAVE A PLACE ── */

function saveCurrentPlace() {
  const name = document.getElementById("info-title").textContent;

  const alreadySaved = savedPlaces.some(function (p) {
    return p.name === name;
  });
  if (alreadySaved) {
    showToast('"' + name + '" is already saved');
    return;
  }

  const lat = parseFloat(clickedLat) || 0;
  const lng = parseFloat(clickedLng) || 0;

  /* Create the star marker and add it to the map immediately */
  const marker = L.marker([lat, lng], { icon: createStarIcon() });

  marker.bindPopup("<strong>" + name + "</strong>");
  marker.on("click", function (e) {
    L.DomEvent.stopPropagation(e);
    showInfoCard(name, lat.toFixed(5), lng.toFixed(5));
  });
  marker.addTo(map);

  /* Save everything together */
  savedPlaces.push({
    name: name,
    lat: lat,
    lng: lng,
    marker: marker /* reference so we can show/hide it later */,
    visible: true /* tracks whether this marker is on the map */,
  });

  showToast('"' + name + '" saved!');
  document.getElementById("edit-name-btn").style.display = "flex";
}

/* ── TOGGLE INDIVIDUAL MARKER VISIBILITY ── */

function toggleSavedMarker(index) {
  const place = savedPlaces[index];
  if (!place || !place.marker) return;

  place.visible = !place.visible;

  if (place.visible) {
    place.marker.addTo(map);
  } else {
    map.removeLayer(place.marker);
  }

  /* Rebuild the list to update the eye icon */
  buildSavedList();
}

/* ── TOGGLE ALL MARKERS AT ONCE ── */

var allSavedVisible = true;

function toggleAllSavedMarkers() {
  allSavedVisible = !allSavedVisible;

  savedPlaces.forEach(function (place) {
    place.visible = allSavedVisible;
    if (allSavedVisible) {
      place.marker.addTo(map);
    } else {
      map.removeLayer(place.marker);
    }
  });

  /* Update both the popup and sheet eye icons */
  const iconClass = allSavedVisible
    ? "fa-solid fa-eye"
    : "fa-solid fa-eye-slash";
  const popupIcon = document.getElementById("saved-hide-all-icon");
  const sheetIcon = document.getElementById("saved-sheet-hide-all-icon");
  if (popupIcon) popupIcon.className = iconClass;
  if (sheetIcon) sheetIcon.className = iconClass;

  /* Rebuild the list to update individual eye icons */
  buildSavedList();

  showToast(
    allSavedVisible ? "All saved places visible" : "All saved places hidden",
  );
}

/* ── BUILD THE LIST (used by both popup and sheet) ── */

/*
  buildSavedList() generates the same HTML for both
  #saved-list (desktop) and #saved-sheet-list (mobile).
*/
function buildSavedList() {
  const emptyHTML = `
    <div class="saved-empty">
      <i class="fa-regular fa-star" style="font-size:24px; display:block; margin-bottom:8px;"></i>
      No saved places yet.<br>Click "Save" on any location.
    </div>`;

  const popupList = document.getElementById("saved-list");
  const sheetList = document.getElementById("saved-sheet-list");

  if (savedPlaces.length === 0) {
    if (popupList) popupList.innerHTML = emptyHTML;
    if (sheetList) sheetList.innerHTML = emptyHTML;
    return;
  }

  /* Build the rows HTML */
  let html = "";
  savedPlaces.forEach(function (place, index) {
    const eyeIcon = place.visible ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";

    html += `
      <div class="saved-item">
        <div class="saved-item-info" onclick="flyToSaved(${index})">
          <div class="saved-item-text">${place.name}</div>
          <div class="saved-item-coords">
            ${place.lat ? place.lat.toFixed(4) : "N/A"},
            ${place.lng ? place.lng.toFixed(4) : "N/A"}
          </div>
        </div>
        <button class="saved-item-eye" onclick="toggleSavedMarker(${index})" title="Toggle visibility">
          <i class="${eyeIcon}"></i>
        </button>
      </div>
    `;
  });

  /* Apply to both popup and sheet */
  if (popupList) popupList.innerHTML = html;
  if (sheetList) sheetList.innerHTML = html;
}

/* Fly the map to a saved place when clicked in the list */
function flyToSaved(index) {
  const place = savedPlaces[index];
  if (!place) return;
  map.flyTo([place.lat, place.lng], 15, { duration: 1.2 });
  showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
  closeSavedPlaces();
}

/* ── SHOW / CLOSE ── */

/*
  showSavedPlaces() shows the popup on desktop
  and the bottom sheet on mobile.
*/
function showSavedPlaces() {
  buildSavedList();
  closeSidebar();

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    /* Show bottom sheet */
    document.getElementById("saved-sheet").classList.add("open");
    document.getElementById("saved-sheet-overlay").classList.add("visible");
  } else {
    /* Show popup */
    document.getElementById("saved-popup").classList.add("open");
  }
}

function closeSavedPlaces() {
  document.getElementById("saved-popup").classList.remove("open");
  document.getElementById("saved-sheet").classList.remove("open");
  document.getElementById("saved-sheet-overlay").classList.remove("visible");
}

function toggleSavedPlaces() {
  const popup = document.getElementById("saved-popup");
  const sheet = document.getElementById("saved-sheet");

  const isOpen =
    popup.classList.contains("open") || sheet.classList.contains("open");

  if (isOpen) {
    closeSavedPlaces();
  } else {
    showSavedPlaces();
  }
}

/* ── RENAME ── */

function startEditingName() {
  const title = document.getElementById("info-title");
  const input = document.getElementById("edit-name-input");
  const editBtn = document.getElementById("edit-name-btn");

  input.value = title.textContent;
  title.style.display = "none";
  editBtn.style.display = "none";
  input.style.display = "block";
  input.focus();
  input.select();

  input.onkeydown = function (e) {
    if (e.key === "Enter") confirmEditName();
    if (e.key === "Escape") cancelEditName();
  };
  input.onblur = confirmEditName;
}

function confirmEditName() {
  const title = document.getElementById("info-title");
  const input = document.getElementById("edit-name-input");
  const editBtn = document.getElementById("edit-name-btn");

  const oldName = title.textContent;
  const newName = input.value.trim() || oldName;

  title.textContent = newName;

  /* Update in the savedPlaces array and the marker popup */
  const place = savedPlaces.find(function (p) {
    return p.name === oldName;
  });
  if (place) {
    place.name = newName;
    if (place.marker) {
      place.marker.setPopupContent("<strong>" + newName + "</strong>");
    }
  }

  input.style.display = "none";
  title.style.display = "block";
  editBtn.style.display = "flex";
  input.onblur = null;

  showToast('Renamed to "' + newName + '"');
}

function cancelEditName() {
  const title = document.getElementById("info-title");
  const input = document.getElementById("edit-name-input");
  const editBtn = document.getElementById("edit-name-btn");

  input.style.display = "none";
  title.style.display = "block";
  editBtn.style.display = "flex";
  input.onblur = null;
}
