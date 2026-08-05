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
  const name = document.getElementById('info-title').textContent;

  /* Prevent saving the same place twice */
  const alreadySaved = savedPlaces.some(function(p) { return p.name === name; });
  if (alreadySaved) {
    showToast('"' + name + '" is already saved');
    return;
  }

  savedPlaces.push({ name: name, lat: clickedLat, lng: clickedLng });
  showToast('"' + name + '" saved!');
}

/* Build and show the saved places popup */
function showSavedPlaces() {
  const list = document.getElementById('saved-list');
  list.innerHTML = '';

  if (savedPlaces.length === 0) {
    list.innerHTML = `
      <div class="saved-empty">
        <i class="fa-regular fa-star" style="font-size:24px; display:block; margin-bottom:8px;"></i>
        No saved places yet.<br>Click "Save" on any location.
      </div>`;
  } else {
    savedPlaces.forEach(function(place) {
      const div     = document.createElement('div');
      div.className = 'saved-item';
      div.innerHTML = `
        <i class="fa-solid fa-star"></i>
        <div>
          <div class="saved-item-text">${place.name}</div>
          <div class="saved-item-coords">${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}</div>
        </div>
      `;
      /* Clicking a saved item flies the map to that location */
      div.onclick = function() {
        map.flyTo([place.lat, place.lng], 15, { duration: 1.2 });
        showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
        closeSavedPlaces();
      };
      list.appendChild(div);
    });
  }

  document.getElementById('saved-popup').style.display = 'block';
  closeSidebar();
}

function closeSavedPlaces() {
  document.getElementById('saved-popup').style.display = 'none';
}
