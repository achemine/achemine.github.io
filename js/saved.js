/*
  ══════════════════════════════════════════════════════════════
  saved.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles saving places and displaying the saved places popup.
  Depends on: variables.js, click.js (showInfoCard), ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

/* Save the place currently shown in the info card */
function saveCurrentPlace() {
  const name = document.getElementById("info-title").textContent;

  const alreadySaved = savedPlaces.some(function (p) {
    return p.name === name;
  });
  if (alreadySaved) {
    showToast('"' + name + '" is already saved');
    return;
  }

  savedPlaces.push({
    name: name,
    lat: parseFloat(clickedLat) || 0,
    lng: parseFloat(clickedLng) || 0,
  });

  showToast('"' + name + '" saved!');

  /* Show the pencil button so the user can rename it */
  document.getElementById("edit-name-btn").style.display = "flex";
}

/*
  startEditingName() — called when the pencil is clicked.
  Hides the title, shows the text input pre-filled with the current name.
*/
function startEditingName() {
  const title = document.getElementById("info-title");
  const input = document.getElementById("edit-name-input");
  const editBtn = document.getElementById("edit-name-btn");

  /* Pre-fill the input with the current name */
  input.value = title.textContent;

  /* Hide the title row, show the input */
  title.style.display = "none";
  editBtn.style.display = "none";
  input.style.display = "block";
  input.focus();
  input.select(); /* select all text so user can type immediately */

  /* Confirm on Enter key */
  input.onkeydown = function (e) {
    if (e.key === "Enter") confirmEditName();
    if (e.key === "Escape") cancelEditName();
  };

  /* Confirm when clicking outside the input */
  input.onblur = confirmEditName;
}

/*
  confirmEditName() — saves the new name to the savedPlaces array
  and updates the info card title.
*/
function confirmEditName() {
  const title = document.getElementById("info-title");
  const input = document.getElementById("edit-name-input");
  const editBtn = document.getElementById("edit-name-btn");

  const oldName = title.textContent;
  const newName =
    input.value.trim() || oldName; /* fall back to old name if empty */

  /* Update the info card title */
  title.textContent = newName;

  /* Update the name in the savedPlaces array */
  const place = savedPlaces.find(function (p) {
    return p.name === oldName;
  });
  if (place) place.name = newName;

  /* Hide the input, show the title + pencil again */
  input.style.display = "none";
  title.style.display = "block";
  editBtn.style.display = "flex";

  /* Remove the blur listener to avoid double-firing */
  input.onblur = null;

  showToast('Renamed to "' + newName + '"');
}

/*
  cancelEditName() — discards the edit and restores the original title.
*/
function cancelEditName() {
  const title = document.getElementById("info-title");
  const input = document.getElementById("edit-name-input");
  const editBtn = document.getElementById("edit-name-btn");

  input.style.display = "none";
  title.style.display = "block";
  editBtn.style.display = "flex";
  input.onblur = null;
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
          <div class="saved-item-coords">${place.lat ? place.lat.toFixed(4) : "N/A"}, ${place.lng ? place.lng.toFixed(4) : "N/A"}</div>
        </div>
      `;
      /* Clicking a saved item flies the map to that location */
      div.onclick = function () {
        map.flyTo([place.lat, place.lng], 15, { duration: 1.2 });
        showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
      };
      list.appendChild(div);
    });
  }

  document.getElementById("saved-popup").style.display = "block";
  showSavedMarkers(); /* show stars on the map */
  closeSidebar();
}

function closeSavedPlaces() {
  document.getElementById("saved-popup").style.display = "none";
}

function showSavedMarkers() {
  /* Remove any existing star markers first */

  /* Create a star icon using a Font Awesome character */
  const starIcon = L.divIcon({
    className: "",
    html: `<div style="
      font-size: 18px;
      line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
    ">⭐</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });

  /* Create a Leaflet layer group to hold all star markers together */
  savedMarkersLayer = L.layerGroup();

  savedPlaces.forEach(function (place) {
    if (!place.lat || !place.lng) return; /* skip if coordinates missing */

    const marker = L.marker([place.lat, place.lng], { icon: starIcon });
    marker.bindPopup("<strong>" + place.name + "</strong>");

    /* Clicking a star also shows the info card */
    marker.on("click", function (e) {
      L.DomEvent.stopPropagation(e);
      showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
    });

    savedMarkersLayer.addLayer(marker);
  });

  savedMarkersLayer.addTo(map);
}

function hideSavedMarkers() {
  if (savedMarkersLayer) {
    map.removeLayer(savedMarkersLayer);
    savedMarkersLayer = null;
  }
}

function toggleSavedPlaces() {
  const popup = document.getElementById("saved-popup");
  if (popup.style.display === "block") {
    closeSavedPlaces();
  } else {
    showSavedPlaces();
  }
}
