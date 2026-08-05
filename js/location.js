/*
  ══════════════════════════════════════════════════════════════
  location.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the "Find my location" GPS button.
  Depends on: variables.js, map.js, click.js (showInfoCard), ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

document.getElementById('locate-btn').onclick = function() {
  /*
    navigator.geolocation is built into every modern browser.
    getCurrentPosition() asks for permission, then calls our
    callback with the user's GPS coordinates.
  */
  if (!navigator.geolocation) {
    showToast('Geolocation not supported by your browser');
    return;
  }

  showToast('Finding your location…');

  navigator.geolocation.getCurrentPosition(

    /* SUCCESS — we received the coordinates */
    function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      map.flyTo([lat, lng], 16, { duration: 1.5 });

      /* Remove the previous location dot if there was one */
      if (locationMarker) map.removeLayer(locationMarker);

      /* Draw a filled blue circle like Google Maps' blue dot */
      locationMarker = L.circleMarker([lat, lng], {
        radius:      10,
        color:       '#ffffff',   /* white ring */
        weight:      3,
        fillColor:   '#1a73e8',   /* blue fill  */
        fillOpacity: 0.9
      }).addTo(map);

      locationMarker
        .bindPopup('<strong>You are here</strong><br>' + lat.toFixed(5) + ', ' + lng.toFixed(5))
        .openPopup();

      clickedLat = lat;
      clickedLng = lng;
      showInfoCard('My Location', lat.toFixed(5), lng.toFixed(5));
      showToast('Location found!');
    },

    /* ERROR — permission denied or GPS unavailable */
    function(error) {
      const messages = {
        1: 'Location access denied. Allow it in your browser settings.',
        2: 'Position unavailable. Try again.',
        3: 'Location request timed out.',
      };
      showToast(messages[error.code] || 'Could not get your location.');
    }
  );
};
