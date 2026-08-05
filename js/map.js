/*
  ══════════════════════════════════════════════════════════════
  map.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Creates the Leaflet map and defines all tile layers.
  Depends on: variables.js (uses: map, tileLayers, currentLayer)
  ══════════════════════════════════════════════════════════════
*/

/*
  L.map('map') tells Leaflet to draw the map inside <div id="map">.
  center: [latitude, longitude] — Algiers city centre
  zoom: 13 — city-level (1 = whole world, 19 = street level)
  zoomControl: false — we use our own zoom buttons
*/
map = L.map('map', {
  center: [36.737, 3.0865],
  zoom: 13,
  zoomControl: false,
  attributionControl: true
});

/*
  Tile layers are the actual map images, cut into small squares.
  We define four styles so the user can switch between them.
*/
tileLayers = {

  Default: L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }
  ),

  Satellite: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '© <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 19
    }
  ),

  Terrain: L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      attribution: '© <a href="https://opentopomap.org/">OpenTopoMap</a>',
      maxZoom: 17
    }
  ),

  Dark: L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '© <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19
    }
  )

};

/* Add the Default layer when the page first loads */
tileLayers.Default.addTo(map);

/*
  switchLayer() cycles through the four styles one by one.
  Each call removes the current layer and adds the next one.
*/
function switchLayer() {
  const names     = Object.keys(tileLayers);
  const nextIndex = (names.indexOf(currentLayer) + 1) % names.length;
  const nextName  = names[nextIndex];

  map.removeLayer(tileLayers[currentLayer]);
  tileLayers[nextName].addTo(map);

  currentLayer = nextName;
  document.getElementById('layer-label').textContent        = nextName;
  document.getElementById('current-layer-name').textContent = 'Currently: ' + nextName;

  showToast('Map style: ' + nextName);
}

/*
  invalidateSize() tells Leaflet to remeasure the map container.
  Called after a short delay to ensure the layout has settled.
*/
setTimeout(function() {
  map.invalidateSize();
}, 300);
