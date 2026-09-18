/*
  ══════════════════════════════════════════════════════════════
  saved.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles saving places. All persistence goes through storage.js.
  ══════════════════════════════════════════════════════════════
*/

/* ── CREATE STAR ICON ── */

function createStarIcon() {
  return L.divIcon({
    className: "star-marker-icon",
    html: `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="var(--yellow)"
          stroke="white"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

/* ── CREATE MARKER FROM A SAVED PLACE OBJECT ── */

function createSavedMarker(place) {
  const marker = L.marker([place.lat, place.lng], { icon: createStarIcon() });

  marker.bindPopup("<strong>" + place.name + "</strong>");

  marker.on("click", function (e) {
    L.DomEvent.stopPropagation(e);

    /* Block on mobile if directions sheet is open */
    if (window.innerWidth < 768) {
      const dirOpen = document
        .getElementById("directions-sheet")
        ?.classList.contains("open");
      if (dirOpen) return;
    }

    clickedLat = place.lat;
    clickedLng = place.lng;

    showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));

    /* Mark save button as already saved */
    const saveBtn = document.querySelector(".card-btn:not(.primary)");
    if (saveBtn) {
      saveBtn.style.background = "var(--yellow)";
      saveBtn.style.borderColor = "var(--yellow)";
      saveBtn.style.color = "var(--saved-text)";
      const span = saveBtn.querySelector("span");
      if (span) span.textContent = "Saved";
    }
  });

  if (place.visible !== 0) marker.addTo(map);

  return marker;
}

/* ── RESTORE SAVED PLACES ON STARTUP ── */

/*
  restoreSavedPlaces() loads all saved places from the database
  and places star markers on the map immediately.
  Called once after the map is ready.
*/
function restoreSavedPlaces() {
  savedLoad().then(function (places) {
    if (!places || places.length === 0) return;

    places.forEach(function (place) {
      const marker = createSavedMarker(place);
      savedPlaces.push({
        id: place.id /* database row id — needed for updates/deletes */,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        visible: place.visible !== 0,
        marker: marker,
      });
    });

    console.log("Restored " + places.length + " saved places from database.");
  });
}

/* ── SAVE A PLACE ── */

function saveCurrentPlace() {
  const name = document.getElementById("info-title").textContent;
  const lat = parseFloat(clickedLat) || 0;
  const lng = parseFloat(clickedLng) || 0;

  /* Prevent saving the same coordinates twice */
  const alreadySaved = savedPlaces.some(function (p) {
    return p.lat === lat && p.lng === lng;
  });
  if (alreadySaved) {
    showToast("This location is already saved");
    /* Show yellow button */
    const saveBtn = document.querySelector(".card-btn:not(.primary)");
    if (saveBtn) {
      saveBtn.style.background = "var(--yellow)";
      saveBtn.style.borderColor = "var(--yellow)";
      saveBtn.style.color = "var(--saved-text)";
      const span = saveBtn.querySelector("span");
      if (span) span.textContent = "Saved";
    }
    return;
  }

  /* Add to database first, then to map */
  savedAdd(name, lat, lng).then(function (result) {
    if (!result || !result.id) {
      showToast("Could not save. Is the server running?");
      return;
    }

    const place = {
      id: result.id,
      name: name,
      lat: lat,
      lng: lng,
      visible: true,
    };
    const marker = createSavedMarker(place);
    place.marker = marker;
    savedPlaces.push(place);

    showToast('"' + name + '" saved!');
    document.getElementById("edit-name-btn").style.display = "flex";

    /* Update save button */
    const saveBtn = document.querySelector(".card-btn:not(.primary)");
    if (saveBtn) {
      saveBtn.style.background = "var(--yellow)";
      saveBtn.style.borderColor = "var(--yellow)";
      saveBtn.style.color = "var(--saved-text)";
      const span = saveBtn.querySelector("span");
      if (span) span.textContent = t("saved", "Saved");
    }
  });
}

/* ── DELETE A SAVED PLACE ── */

function deleteSavedPlace(index) {
  const place = savedPlaces[index];
  if (!place) return;

  savedDelete(place.id).then(function () {
    if (place.marker && map.hasLayer(place.marker)) {
      map.removeLayer(place.marker);
    }
    savedPlaces.splice(index, 1);
    buildSavedList();
    showToast('"' + place.name + '" removed');
  });
}

/* ── TOGGLE INDIVIDUAL MARKER ── */

function toggleSavedMarker(index) {
  const place = savedPlaces[index];
  if (!place || !place.marker) return;

  place.visible = !place.visible;

  if (place.visible) {
    place.marker.addTo(map);
  } else {
    map.removeLayer(place.marker);
  }

  /* Persist visibility to database */
  savedUpdate(place.id, { visible: place.visible });

  buildSavedList();
}

/* ── TOGGLE ALL MARKERS ── */

function toggleAllSavedMarkers() {
  allSavedVisible = !allSavedVisible;

  savedPlaces.forEach(function (place) {
    if (!place.marker) return;
    place.visible = allSavedVisible;
    if (allSavedVisible) {
      if (!map.hasLayer(place.marker)) place.marker.addTo(map);
    } else {
      if (map.hasLayer(place.marker)) map.removeLayer(place.marker);
    }
    savedUpdate(place.id, { visible: place.visible });
  });

  const iconClass = allSavedVisible
    ? "fa-solid fa-eye"
    : "fa-solid fa-eye-slash";
  ["saved-hide-all-icon", "saved-sheet-hide-all-icon"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.className = iconClass;
  });

  buildSavedList();
  showToast(
    allSavedVisible ? "All saved places visible" : "All saved places hidden",
  );
}

/* ── BUILD THE LIST ── */

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
        <button class="saved-item-delete" onclick="deleteSavedPlace(${index})" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  });

  if (popupList) popupList.innerHTML = html;
  if (sheetList) sheetList.innerHTML = html;
}

/* ── FLY TO SAVED PLACE ── */

function flyToSaved(index) {
  const place = savedPlaces[index];
  if (!place) return;
  map.flyTo([place.lat, place.lng], 15, { duration: 1.2 });
  showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
  closeSavedPlaces();
}

/* ── SHOW / CLOSE SAVED PANEL ── */

function showSavedPlaces() {
  buildSavedList();
  closeSidebar();

  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    const sheet = document.getElementById("saved-sheet");
    sheet.classList.add("open");
    document.getElementById("saved-sheet-overlay").classList.add("visible");
    sheetExpandedHeight = window.innerHeight * 0.5;
    sheet.style.height = sheetExpandedHeight + "px";
    sheet.style.transform = "translateY(0)";
    sheet.style.transition = "transform 0.3s ease, height 0.3s ease";
    initSheetDrag(sheet);
  } else {
    document.getElementById("saved-popup").classList.add("open");
  }
}

function closeSavedPlaces() {
  const sheet = document.getElementById("saved-sheet");
  sheet.style.transition = "transform 0.3s ease";
  sheet.style.transform = "translateY(100%)";
  setTimeout(function () {
    sheet.classList.remove("open");
    sheet.style.transform = "";
    sheet.style.height = "";
  }, 300);
  document.getElementById("saved-popup").classList.remove("open");
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

  /* Update in array and database */
  const place = savedPlaces.find(function (p) {
    return p.name === oldName;
  });
  if (place) {
    place.name = newName;
    if (place.marker)
      place.marker.setPopupContent("<strong>" + newName + "</strong>");
    savedUpdate(place.id, { name: newName });
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

/* ── MOBILE SHEET DRAG (unchanged from before) ── */

var sheetExpandedHeight = 0;
var dragStartY = 0;
var dragStartHeight = 0;
var isDragging = false;
var MIN_HEIGHT = 120;
var MAX_HEIGHT = window.innerHeight * 0.85;

function initSheetDrag(sheet) {
  const header = document.getElementById("saved-sheet-header");
  header.removeEventListener("touchstart", onTouchStart);
  header.removeEventListener("mousedown", onMouseDown);
  header.addEventListener("touchstart", onTouchStart, { passive: true });
  header.addEventListener("mousedown", onMouseDown);
}

function onTouchStart(e) {
  if (e.target.closest("button")) return;
  isDragging = true;
  dragStartY = e.touches[0].clientY;
  dragStartHeight = sheetExpandedHeight;
  document.getElementById("saved-sheet").style.transition = "none";
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
}
function onTouchMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  applySheetHeight(dragStartHeight - (e.touches[0].clientY - dragStartY));
}
function onTouchEnd() {
  if (!isDragging) return;
  isDragging = false;
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
  snapSheet();
}
function onMouseDown(e) {
  if (e.target.closest("button")) return;
  isDragging = true;
  dragStartY = e.clientY;
  dragStartHeight = sheetExpandedHeight;
  document.getElementById("saved-sheet").style.transition = "none";
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}
function onMouseMove(e) {
  if (!isDragging) return;
  applySheetHeight(dragStartHeight - (e.clientY - dragStartY));
}
function onMouseUp() {
  if (!isDragging) return;
  isDragging = false;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  snapSheet();
}
function applySheetHeight(newHeight) {
  const sheet = document.getElementById("saved-sheet");
  const clamped = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
  sheetExpandedHeight = clamped;
  sheet.style.height = clamped + "px";
}
function snapSheet() {
  const sheet = document.getElementById("saved-sheet");
  sheet.style.transition = "height 0.3s ease, transform 0.3s ease";
  const screenH = window.innerHeight;
  const halfHeight = screenH * 0.5;
  const fullHeight = screenH * 0.85;
  const closeH = screenH * 0.2;
  if (sheetExpandedHeight < closeH) {
    closeSavedPlaces();
  } else if (sheetExpandedHeight < (halfHeight + fullHeight) / 2) {
    sheetExpandedHeight = halfHeight;
    sheet.style.height = halfHeight + "px";
  } else {
    sheetExpandedHeight = fullHeight;
    sheet.style.height = fullHeight + "px";
  }
}
