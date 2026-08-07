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

  /* Prevent saving the same place twice */
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
        closeSavedPlaces();
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
  hideSavedMarkers(); /* remove stars from the map */
}

function showSavedMarkers() {
  /* Remove any existing star markers first */
  hideSavedMarkers();

  /* Create a star icon using a Font Awesome character */
  const starIcon = L.divIcon({
    className: "",
    html: `<div style="
      font-size: 18px;
      line-height: 1;
      border-color: white;
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
