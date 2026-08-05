/*
  ══════════════════════════════════════════════════════════════
  directions.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the directions panel: open/close, transport mode,
  adding stops, and calculating routes via Leaflet Routing Machine.
  Depends on: variables.js, map.js, markers.js (createIcon), ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

/* ── OPEN / CLOSE ── */

function openDirections() {
  document.getElementById('directions-panel').style.display = 'block';
  closeSidebar();
}

function closeDirections() {
  document.getElementById('directions-panel').style.display = 'none';
  document.getElementById('route-summary').innerHTML        = '';
  document.getElementById('stops-container').innerHTML      = '';
  document.getElementById('stop-dots').innerHTML            = '';

  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
}

/* ── TRANSPORT MODE ── */

function setDirectionMode(btn, mode) {
  directionProfile = mode;
  document.querySelectorAll('.mode-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
}

/* ── ADD A STOP ── */

/*
  addStop() inserts a new text input between the origin and destination.
  It also adds a matching orange dot to the visual connector on the left.
*/
function addStop() {
  const container = document.getElementById('stops-container');
  const stopDots  = document.getElementById('stop-dots');
  const stopNum   = container.children.length + 1;

  /* Build the input row */
  const row         = document.createElement('div');
  row.className     = 'stop-row';

  const input       = document.createElement('input');
  input.type        = 'text';
  input.className   = 'stop-input';
  input.placeholder = 'Stop ' + stopNum;

  /* × button to remove this stop */
  const removeBtn     = document.createElement('button');
  removeBtn.className = 'remove-stop-btn';
  removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  removeBtn.title     = 'Remove stop';

  removeBtn.onclick = function() {
    const index = Array.from(container.children).indexOf(row);
    container.removeChild(row);

    /* Remove the matching dot from the visual connector */
    const dots = stopDots.querySelectorAll('.stop-dot-group');
    if (dots[index]) stopDots.removeChild(dots[index]);
  };

  row.appendChild(input);
  row.appendChild(removeBtn);
  container.appendChild(row);

  /* Add a matching orange dot to the left connector */
  const dotGroup              = document.createElement('div');
  dotGroup.className          = 'stop-dot-group';
  dotGroup.style.display      = 'flex';
  dotGroup.style.flexDirection = 'column';
  dotGroup.style.alignItems   = 'center';

  const dotLine     = document.createElement('div');
  dotLine.className = 'stop-dot-line';

  const dot         = document.createElement('div');
  dot.className     = 'stop-dot';

  dotGroup.appendChild(dotLine);
  dotGroup.appendChild(dot);
  stopDots.appendChild(dotGroup);
}

/* ── CALCULATE ROUTE ── */

/*
  getRoute() reads all inputs (from, stops, to),
  geocodes each address via Nominatim,
  then draws the route using Leaflet Routing Machine.
*/
function getRoute() {
  const from = document.getElementById('from-input').value.trim();
  const to   = document.getElementById('to-input').value.trim();

  if (!from || !to) {
    showToast('Please fill in both start and destination');
    return;
  }

  /* Collect all stop inputs that have text */
  const stopInputs   = document.querySelectorAll('.stop-input');
  const allAddresses = [from];
  stopInputs.forEach(function(input) {
    if (input.value.trim()) allAddresses.push(input.value.trim());
  });
  allAddresses.push(to);

  showToast('Calculating route…');

  /* geocode() converts one address string into GPS coordinates */
  const geocode = function(address) {
    return fetch(
      'https://nominatim.openstreetmap.org/search?format=json&q='
      + encodeURIComponent(address) + '&limit=1'
    ).then(function(r) { return r.json(); });
  };

  /*
    Promise.all() sends all geocode requests at the same time (faster).
    It waits until ALL are done, then gives us all results together.
  */
  Promise.all(allAddresses.map(geocode))
    .then(function(results) {

      /* Make sure every address was found */
      for (let i = 0; i < results.length; i++) {
        if (!results[i][0]) {
          showToast('Could not find: ' + allAddresses[i]);
          return;
        }
      }

      /* Convert each result into a Leaflet LatLng object */
      const waypoints = results.map(function(result) {
        return L.latLng(parseFloat(result[0].lat), parseFloat(result[0].lon));
      });

      /* Remove any existing route */
      if (routingControl) map.removeControl(routingControl);

      /* Draw the route through all waypoints */
      routingControl = L.Routing.control({
        waypoints:          waypoints,
        routeWhileDragging: true,
        show:               false,   /* hide Leaflet's default turn-by-turn panel */
        lineOptions: {
          styles: [{ color: '#1a73e8', weight: 5, opacity: 0.85 }]
        },
        createMarker: function(i, wp) {
          /* Blue = start, orange = stop, red = end */
          let color = '#1a73e8';
          if (i === waypoints.length - 1) color = '#ea4335';
          else if (i > 0)                 color = '#ff6d00';
          return L.marker(wp.latLng, { icon: createIcon(color) });
        }
      }).addTo(map);

      /* Show distance and time once the route is ready */
      routingControl.on('routesfound', function(e) {
        const route    = e.routes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(1);
        const minutes  = Math.round(route.summary.totalTime / 60);

        document.getElementById('route-summary').innerHTML = `
          <span><i class="fa-solid fa-road"></i> ${distance} km</span>
          <span><i class="fa-solid fa-clock"></i> ~${minutes} min</span>
        `;
        showToast('Route found: ' + distance + ' km');
      });
    })
    .catch(function() {
      showToast('Route calculation failed. Check your internet.');
    });
}
