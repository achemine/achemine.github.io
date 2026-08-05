/*
  ══════════════════════════════════════════════════════════════
  markers.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Defines the teardrop marker icon and places landmark markers.
  Depends on: variables.js, map.js
  ══════════════════════════════════════════════════════════════
*/

/*
  createIcon(color) builds a custom teardrop-shaped Leaflet marker.
  L.divIcon lets us use plain HTML+CSS instead of an image file.
  Used for: clicked pins, search results, directions waypoints.
*/
function createIcon(color) {
  return L.divIcon({
    className: '',           /* remove Leaflet's default white square */
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize:    [24, 24],
    iconAnchor:  [16, 32],   /* tip of the teardrop sits on the coordinate */
    popupAnchor: [0, -36],
  });
}

/*
  landmarks array — add famous places here.
  Each object: { name, lat, lng, type, desc }
  Currently empty — add entries as needed.
*/
const landmarks = [];

/* One colour per landmark category */
const iconColors = {
  university: '#1a73e8',
  mosque:     '#34a853',
  monument:   '#ea4335',
  airport:    '#5f6368',
  heritage:   '#ff6d00',
  park:       '#34a853',
  beach:      '#0097a7',
};

/* Place a marker on the map for every landmark in the array */
landmarks.forEach(function(place) {
  const color  = iconColors[place.type] || '#1a73e8';
  const marker = L.marker([place.lat, place.lng], { icon: createIcon(color) });

  marker.bindPopup(`
    <strong style="font-size:14px;">${place.name}</strong><br>
    <span style="color:#5f6368; font-size:12px;">${place.desc}</span>
  `);

  marker.on('click', function() {
    showInfoCard(place.name, place.lat.toFixed(5), place.lng.toFixed(5));
  });

  marker.addTo(map);
});
