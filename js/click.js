/*
  ══════════════════════════════════════════════════════════════
  click.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles map click events — drops a marker and shows the info card.
  Also contains showInfoCard() and closeInfoCard() used by other files.
  Depends on: variables.js, map.js, markers.js (createIcon)
  ══════════════════════════════════════════════════════════════
*/

map.on("click", function (event) {
  /* ── Block during map-pick mode (directions pin selection) ── */
  if (pickingInputId) return;

  /* ── Declare sheet references ── */
  const directionsSheet = document.getElementById("directions-sheet");
  const savedSheet = document.getElementById("saved-sheet");
  const desktopPanel = document.getElementById("directions-panel");

  const dirOpen = directionsSheet && directionsSheet.classList.contains("open");
  const savedOpen = savedSheet && savedSheet.classList.contains("open");
  const desktopDirOpen = desktopPanel && desktopPanel.style.display === "block";

  /* Block on mobile if any sheet is open */
  if ((dirOpen || savedOpen) && window.innerWidth < 768) return;

  clickedLat = event.latlng.lat;
  clickedLng = event.latlng.lng;

  if (clickedMarker) map.removeLayer(clickedMarker);

  clickedMarker = L.marker([clickedLat, clickedLng], {
    icon: createIcon("blue"),
  }).addTo(map);

  showInfoCard("Custom Location", clickedLat.toFixed(5), clickedLng.toFixed(5));
});

/*
  showInfoCard(name, lat, lng)
  Fills and displays the info card at the bottom of the screen.
  Called by: click handler, search results, stop clicks, landmarks.
*/
function showInfoCard(name, lat, lng) {
  document.getElementById("info-title").textContent = name;
  document.getElementById("info-sub").textContent = lat + ", " + lng;
  document.getElementById("info-card").classList.add("open");

  currentInfoName = name;
  currentInfoLat = parseFloat(lat);
  currentInfoLng = parseFloat(lng);

  /* Reset title display in case it was hidden during editing */
  document.getElementById("info-title").style.display = "block";
  document.getElementById("edit-name-input").style.display = "none";
  document.getElementById("edit-name-btn").style.display = "none";

  /* Update save button based on whether this location is already saved */
  const saveBtn = document.querySelector(".card-btn:not(.primary)");
  if (saveBtn) {
    const alreadySaved = savedPlaces.some(function (p) {
      return p.lat === parseFloat(lat) && p.lng === parseFloat(lng);
    });
    if (alreadySaved) {
      saveBtn.style.background = COLOR_YELLOW;
      saveBtn.style.borderColor = COLOR_YELLOW;
      saveBtn.style.color = "var(--saved-text)";
      const span = saveBtn.querySelector("span");
      if (span) span.textContent = "Saved";
    } else {
      saveBtn.style.background = "";
      saveBtn.style.borderColor = "";
      saveBtn.style.color = "";
      const span = saveBtn.querySelector("span");
      if (span) span.textContent = "Save";
    }
  }

  /* Reset tags to loading state */
  const tags = document.getElementById("info-tags");
  tags.innerHTML = '<span class="tag">📍 Loading…</span>';

  /* Reverse geocode to get province and country */
  fetch(
    "https://nominatim.openstreetmap.org/reverse?format=json&lat=" +
      lat +
      "&lon=" +
      lng +
      "&zoom=10&addressdetails=1",
  )
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      const address = data.address || {};
      const province =
        address.state ||
        address.province ||
        address.region ||
        address.county ||
        address.state_district ||
        "";
      const country = address.country || "";

      tags.innerHTML = "";
      if (province)
        tags.innerHTML += '<span class="tag">📍 ' + province + "</span>";
      if (country)
        tags.innerHTML += '<span class="tag">🗺️ ' + country + "</span>";
      if (!province && !country) {
        tags.innerHTML = '<span class="tag">📍 Unknown location</span>';
      }
    })
    .catch(function () {
      tags.innerHTML = '<span class="tag">📍 Location unavailable</span>';
    });
}

/*
  closeInfoCard()
  Hides the info card and removes the click marker from the map.
*/
function closeInfoCard() {
  document.getElementById("info-card").classList.remove("open");

  if (clickedMarker) {
    map.removeLayer(clickedMarker);
    clickedMarker = null;
  }

  document.getElementById("edit-name-btn").style.display = "none";

  const saveBtn = document.querySelector(".card-btn:not(.primary)");
  if (saveBtn) {
    saveBtn.style.background = "";
    saveBtn.style.borderColor = "";
    saveBtn.style.color = "";
    const span = saveBtn.querySelector("span");
    if (span) span.textContent = "Save";
  }
}
