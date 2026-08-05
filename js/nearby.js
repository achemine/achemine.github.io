/*
  ══════════════════════════════════════════════════════════════
  nearby.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Searches for nearby places (restaurants, hospitals etc.)
  using the Nominatim API and drops markers on the map.
  Depends on: variables.js, map.js, markers.js (createIcon), ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

/*
  showNearby(category) searches for places of a given type
  near Algiers and drops orange markers on the map.
  Example: showNearby('metro stations')
*/
function showNearby(category) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&q='
              + encodeURIComponent(category + ' Algiers')
              + '&limit=5';

  showToast('Searching for ' + category + '…');
  closeSidebar();

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(results) {
      if (results.length === 0) {
        showToast('No ' + category + ' found nearby');
        return;
      }

      /* Drop an orange marker for each result */
      results.forEach(function(item) {
        const lat  = parseFloat(item.lat);
        const lng  = parseFloat(item.lon);
        const name = item.display_name.split(',')[0];

        L.marker([lat, lng], { icon: createIcon('#ff6d00') })
          .addTo(map)
          .bindPopup('<strong>' + name + '</strong>');
      });

      showToast('Found ' + results.length + ' ' + category);
    })
    .catch(function() {
      showToast('Search failed. Check your internet.');
    });
}
