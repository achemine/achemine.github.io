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
map.on('click', function(event) {
  clickedLat = event.latlng.lat;
  clickedLng = event.latlng.lng;

  /* Remove the old marker */
  if (clickedMarker) map.removeLayer(clickedMarker);

  /* Drop a new marker */
  clickedMarker = L.marker([clickedLat, clickedLng], {
    icon: createIcon('#1a73e8')
  }).addTo(map);

  showInfoCard('Custom Location', clickedLat.toFixed(5), clickedLng.toFixed(5));
});

/*
  showInfoCard(name, lat, lng)
  Fills and displays the info card at the bottom of the screen.
  Called by: click handler, search results, stop clicks, landmarks.
*/
function showInfoCard(name, lat, lng) {
  document.getElementById('info-title').textContent = name;
  document.getElementById('info-sub').textContent   = lat + ', ' + lng;
  document.getElementById('info-card').classList.add('open');
}

/*
  closeInfoCard()
  Hides the info card and removes the click marker from the map.
*/
function closeInfoCard() {
  document.getElementById('info-card').classList.remove('open');
  if (clickedMarker) {
    map.removeLayer(clickedMarker);
    clickedMarker = null;
  }
}
