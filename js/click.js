/*
  ══════════════════════════════════════════════════════════════
  click.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles map click events — drops a marker and shows the info card.
  Also contains showInfoCard() and closeInfoCard() used by other files.
  Depends on: variables.js, map.js, markers.js (createIcon)
  ══════════════════════════════════════════════════════════════
*/

/*
  When the user clicks anywhere on the map (not on a marker):
  1. Remove the previous click marker if there is one
  2. Drop a new blue marker at the clicked spot
  3. Show the info card at the bottom
*/
map.on("click", function (event) {
  map.on("click", function (event) {
    /* Don't show info card if a sheet is open on mobile */
    const directionsSheet = document.getElementById("directions-sheet");
    const savedSheet = document.getElementById("saved-sheet");

    const dirOpen =
      directionsSheet && directionsSheet.classList.contains("open");
    const savedOpen = savedSheet && savedSheet.classList.contains("open");

    if ((dirOpen || savedOpen) && window.innerWidth < 768) {
      return;
    }

    clickedLat = event.latlng.lat;
    clickedLng = event.latlng.lng;

    if (clickedMarker) map.removeLayer(clickedMarker);

    clickedMarker = L.marker([clickedLat, clickedLng], {
      icon: createIcon("#1a73e8"),
    }).addTo(map);

    showInfoCard(
      "Custom Location",
      clickedLat.toFixed(5),
      clickedLng.toFixed(5),
    );
  });
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

  /* Update save button based on whether this location is already saved */
  const saveBtn = document.querySelector(".card-btn:not(.primary)");
  if (saveBtn) {
    const alreadySaved = savedPlaces.some(function (p) {
      return p.lat === parseFloat(lat) && p.lng === parseFloat(lng);
    });
    if (alreadySaved) {
      saveBtn.style.background = "var(--yellow)";
      saveBtn.style.borderColor = "var(--yellow)";
      saveBtn.style.color = "var(--bg-primary)";
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

      /*
        Nominatim returns different field names depending on the country.
        We try several fallbacks to find the province/region.
      */
      const province =
        address.state ||
        address.province ||
        address.region ||
        address.county ||
        address.state_district ||
        "";

      const country = address.country || "";

      tags.innerHTML = "";

      if (province) {
        tags.innerHTML += '<span class="tag">📍 ' + province + "</span>";
      }
      if (country) {
        tags.innerHTML += '<span class="tag">🗺️ ' + country + "</span>";
      }
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
  /* Reset save button for new location */
  const saveBtn = document.querySelector(".card-btn:not(.primary)");
  if (saveBtn) {
    saveBtn.style.background = "";
    saveBtn.style.borderColor = "";
    saveBtn.style.color = "";
    const span = saveBtn.querySelector("span");
    if (span) span.textContent = "Save";
  }
}
