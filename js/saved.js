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
    className: "star-marker-icon",
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
    return p.lat === parseFloat(clickedLat) && p.lng === parseFloat(clickedLng);
  });
  if (alreadySaved) {
    showToast("This location is already saved");
    return;
  }

  const lat = parseFloat(clickedLat) || 0;
  const lng = parseFloat(clickedLng) || 0;

  /* Create the star marker and add it to the map immediately */
  const marker = L.marker([lat, lng], { icon: createStarIcon() });

  marker.on("click", function (e) {
    L.DomEvent.stopPropagation(e);

    clickedLat = lat;
    clickedLng = lng;

    showInfoCard(name, lat.toFixed(5), lng.toFixed(5));

    const saveBtn = document.querySelector(".card-btn:not(.primary)");
    if (saveBtn) {
      saveBtn.style.background = "var(--yellow)";
      saveBtn.style.borderColor = "var(--yellow)";
      saveBtn.style.color = "var(--bg-primary)";
      const span = saveBtn.querySelector("span");
      if (span) span.textContent = "Saved";
    }
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

  /* Update the save button appearance */
  const saveBtn = document.querySelector(".card-btn:not(.primary)");
  if (saveBtn) {
    saveBtn.style.background = "var(--yellow)";
    saveBtn.style.borderColor = "var(--yellow)";
    saveBtn.style.color = "var(--bg-primary)";
    saveBtn.querySelector("span").textContent = "Saved";
  }
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
    if (!place.marker) return;
    place.visible = allSavedVisible;
    if (allSavedVisible) {
      if (!map.hasLayer(place.marker)) place.marker.addTo(map);
    } else {
      if (map.hasLayer(place.marker)) map.removeLayer(place.marker);
    }
  });

  /* Update icon in both popup and sheet */
  const iconClass = allSavedVisible
    ? "fa-solid fa-eye"
    : "fa-solid fa-eye-slash";
  ["saved-hide-all-icon", "saved-sheet-hide-all-icon"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.className = iconClass;
  });

  /* Rebuild list rows to sync individual eye icons */
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
    <button class="saved-item-delete" onclick="deleteSavedPlace(${index})" title="Delete">
      <i class="fa-solid fa-trash"></i>
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
    const sheet = document.getElementById("saved-sheet");
    sheet.classList.add("open");
    document.getElementById("saved-sheet-overlay").classList.add("visible");

    /* Start at 50% height */
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

/* ════════════════════════════════════════════════════════════
   MOBILE SHEET DRAG LOGIC
   The user drags the yellow header to:
   - Expand the sheet (drag up)
   - Collapse the sheet (drag down)
   - Close the sheet  (drag far enough down)
   ════════════════════════════════════════════════════════════ */

var sheetExpandedHeight = 0; /* current height of the sheet in px  */
var dragStartY = 0; /* finger Y position when drag started */
var dragStartHeight = 0; /* sheet height when drag started      */
var isDragging = false;

var MIN_HEIGHT = 120; /* minimum height before snapping shut  */
var MAX_HEIGHT = window.innerHeight * 0.85; /* maximum expanded height */
var CLOSE_THRESHOLD = window.innerHeight * 0.25; /* drag below this → close */

function initSheetDrag(sheet) {
  const header = document.getElementById("saved-sheet-header");

  /* Remove old listeners to avoid stacking them */
  header.removeEventListener("touchstart", onTouchStart);
  header.removeEventListener("mousedown", onMouseDown);

  header.addEventListener("touchstart", onTouchStart, { passive: true });
  header.addEventListener("mousedown", onMouseDown);
}

/* ── TOUCH (mobile) ── */

function onTouchStart(e) {
  /* Don't start drag if the user tapped a button */
  if (e.target.closest("button")) return;

  isDragging = true;
  dragStartY = e.touches[0].clientY;
  dragStartHeight = sheetExpandedHeight;

  const sheet = document.getElementById("saved-sheet");
  sheet.style.transition = "none"; /* disable animation while dragging */

  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
}

function onTouchMove(e) {
  if (!isDragging) return;
  e.preventDefault(); /* prevent page scroll while dragging */

  const deltaY = e.touches[0].clientY - dragStartY; /* how far finger moved */
  const newHeight = dragStartHeight - deltaY; /* drag up = bigger     */

  applySheetHeight(newHeight);
}

function onTouchEnd(e) {
  if (!isDragging) return;
  isDragging = false;

  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);

  snapSheet();
}

/* ── MOUSE (desktop testing) ── */

function onMouseDown(e) {
  if (e.target.closest("button")) return;

  isDragging = true;
  dragStartY = e.clientY;
  dragStartHeight = sheetExpandedHeight;

  const sheet = document.getElementById("saved-sheet");
  sheet.style.transition = "none";

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e) {
  if (!isDragging) return;
  const deltaY = e.clientY - dragStartY;
  const newHeight = dragStartHeight - deltaY;
  applySheetHeight(newHeight);
}

function onMouseUp() {
  if (!isDragging) return;
  isDragging = false;

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);

  snapSheet();
}

/* ── SHARED HELPERS ── */

/*
  applySheetHeight() sets the sheet height during dragging.
  Clamps between MIN_HEIGHT and MAX_HEIGHT.
*/
function applySheetHeight(newHeight) {
  const sheet = document.getElementById("saved-sheet");
  const clamped = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
  sheetExpandedHeight = clamped;
  sheet.style.height = clamped + "px";
}

/*
  snapSheet() is called when the user releases.
  If height is below the close threshold → close.
  Otherwise snap to either 50% or 85% depending on direction.
*/
function snapSheet() {
  const sheet = document.getElementById("saved-sheet");
  sheet.style.transition = "height 0.3s ease, transform 0.3s ease";

  const screenH = window.innerHeight;
  const halfHeight = screenH * 0.5;
  const fullHeight = screenH * 0.85;
  const closeHeight = screenH * 0.2;

  if (sheetExpandedHeight < closeHeight) {
    /* Too low — close the sheet */
    closeSavedPlaces();
  } else if (sheetExpandedHeight < (halfHeight + fullHeight) / 2) {
    /* Closer to half — snap to 50% */
    sheetExpandedHeight = halfHeight;
    sheet.style.height = halfHeight + "px";
  } else {
    /* Closer to full — snap to 85% */
    sheetExpandedHeight = fullHeight;
    sheet.style.height = fullHeight + "px";
  }
}

function deleteSavedPlace(index) {
  const place = savedPlaces[index];
  if (!place) return;

  /* Remove the star marker from the map */
  if (place.marker && map.hasLayer(place.marker)) {
    map.removeLayer(place.marker);
  }

  /* Remove from the array */
  savedPlaces.splice(index, 1);

  /* Rebuild the list */
  buildSavedList();

  showToast('"' + place.name + '" removed');
}
