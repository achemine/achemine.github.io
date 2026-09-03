/*
  ══════════════════════════════════════════════════════════════
  lines.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the line slider bottom sheet.
  Shows lines serving a stop, draws route on map when selected.
  Depends on: variables.js, map.js, click.js, stops.js
  ══════════════════════════════════════════════════════════════
*/

/* ── STATE ── */
var lineSliderHeight = 0;
var activeLineLayer = null; /* currently drawn line route on map */
var activeLineId = null; /* id of the currently selected line */
var currentSliderStop = null; /* stop name the slider is showing   */

/* ── OPEN / CLOSE ── */

/*
  openLineSlider() fetches lines for the current info card stop
  and opens the bottom sheet.
  If the slider is already open for a different stop, it refreshes.
*/
function openLineSlider() {
    closeInfoCard(); // Close the info card to avoid overlap

  /* If no stop is selected, do nothing */
  const stopName = document.getElementById("info-title").textContent;
  if (!stopName || stopName === "Place Name") return;

  currentSliderStop = stopName;

  /* Update header title */
  document.getElementById("line-slider-stop-name").textContent = stopName;

  /* Show empty list while loading */
  const list = document.getElementById("line-slider-list");
  list.innerHTML = `
    <div class="line-slider-empty">
      <i class="fa-solid fa-spinner fa-spin"></i>
      Loading lines…
    </div>
  `;

  /* Open the sheet */
  const slider = document.getElementById("line-slider");
  slider.classList.add("open");
  slider.classList.remove("minimised");

  lineSliderHeight = window.innerHeight * 0.45;
  slider.style.height = lineSliderHeight + "px";
  slider.style.transform = "translateY(0)";
  slider.style.transition = "transform 0.3s ease, height 0.3s ease";

  initLineSliderDrag(slider);

  /* Fetch lines from server */
  fetch(
    "http://localhost:3000/api/stops/by-name/" + encodeURIComponent(stopName),
  )
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (stop) {
      if (!stop || !stop.lines || stop.lines.length === 0) {
        list.innerHTML = `
          <div class="line-slider-empty">
            <i class="fa-solid fa-triangle-exclamation"></i>
            No lines found for this stop.
          </div>
        `;
        return;
      }
      buildLineList(stop.lines);
    })
    .catch(function () {
      list.innerHTML = `
        <div class="line-slider-empty">
          <i class="fa-solid fa-wifi"></i>
          Could not load lines. Check your connection.
        </div>
      `;
    });
}

function closeLineSlider() {
  const slider = document.getElementById("line-slider");
  slider.style.transition = "transform 0.3s ease";
  slider.style.transform = "translateY(100%)";

  /* Remove any drawn route */
  clearActiveLineRoute();

  setTimeout(function () {
    slider.classList.remove("open");
    slider.classList.remove("minimised");
    slider.style.transform = "";
    slider.style.height = "";
    activeLineId = null;
    currentSliderStop = null;
  }, 300);
}

/* ── BUILD THE LINE LIST ── */

function buildLineList(lines) {
  const list = document.getElementById("line-slider-list");
  list.innerHTML = "";

  lines.forEach(function (line) {
    const item = document.createElement("div");
    item.className = "line-item" + (line.id === activeLineId ? " active" : "");
    item.dataset.lineId = line.id;

    item.innerHTML = `
      <div class="line-number-badge" style="background: ${line.color};">
        ${line.name}
      </div>
      <div class="line-item-text">
        <span class="line-item-name">${line.name}</span>
        <span class="line-item-type">${line.type}</span>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: var(--text-hint); font-size:13px;"></i>
    `;

    item.onclick = function () {
      selectLine(line);
    };

    list.appendChild(item);
  });
}

/* ── SELECT A LINE ── */

function selectLine(line) {
  /* If same line clicked again — deselect and restore full list */
  if (activeLineId === line.id) {
    activeLineId = null;
    clearActiveLineRoute();
    restoreLineSlider();
    /* Remove active class */
    document.querySelectorAll(".line-item").forEach(function (el) {
      el.classList.remove("active");
    });
    return;
  }

  activeLineId = line.id;

  /* Highlight the selected row */
  document.querySelectorAll(".line-item").forEach(function (el) {
    el.classList.toggle("active", el.dataset.lineId === line.id);
  });

  /* Minimise the slider to show only the header */
  minimiseLineSlider();

  /* Remove any previously drawn route */
  clearActiveLineRoute();

  /* Fetch and draw the route */
  fetch(
    "http://localhost:3000/api/lines/" + encodeURIComponent(line.id) + "/route",
  )
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (geojson) {
      if (!geojson) {
        showToast("Route not available yet for this line");
        restoreLineSlider();
        return;
      }

      activeLineLayer = L.geoJSON(geojson, {
        style: {
          color: line.color,
          weight: 5,
          opacity: 0.9,
        },
      }).addTo(map);

      /* Fit map to show full route */
      map.flyToBounds(activeLineLayer.getBounds(), {
        padding: [40, 40],
        duration: 1,
      });
    })
    .catch(function () {
      showToast("Could not load route. Check your connection.");
      restoreLineSlider();
    });
}

function clearActiveLineRoute() {
  if (activeLineLayer) {
    map.removeLayer(activeLineLayer);
    activeLineLayer = null;
  }
}

/* ── MINIMISE / RESTORE ── */

function minimiseLineSlider() {
  const slider = document.getElementById("line-slider");
  slider.style.transition = "height 0.3s ease";
  slider.classList.add("minimised");
}

function restoreLineSlider() {
  const slider = document.getElementById("line-slider");
  slider.style.transition = "height 0.3s ease";
  slider.classList.remove("minimised");
  slider.style.height = lineSliderHeight + "px";
}

/* ── DRAG TO RESIZE / CLOSE ── */

var lineDragStartY = 0;
var lineDragStartHeight = 0;
var lineIsDragging = false;
var LINE_MIN_HEIGHT = 56;

function initLineSliderDrag(slider) {
  const header = document.getElementById("line-slider-header");
  header.removeEventListener("touchstart", lineOnTouchStart);
  header.removeEventListener("mousedown", lineOnMouseDown);
  header.addEventListener("touchstart", lineOnTouchStart, { passive: true });
  header.addEventListener("mousedown", lineOnMouseDown);
}

function lineOnTouchStart(e) {
  if (e.target.closest("button")) return;
  lineIsDragging = true;
  lineDragStartY = e.touches[0].clientY;
  lineDragStartHeight = lineSliderHeight;
  document.getElementById("line-slider").style.transition = "none";
  document.addEventListener("touchmove", lineOnTouchMove, { passive: false });
  document.addEventListener("touchend", lineOnTouchEnd);
}
function lineOnTouchMove(e) {
  if (!lineIsDragging) return;
  e.preventDefault();
  applyLineSliderHeight(
    lineDragStartHeight - (e.touches[0].clientY - lineDragStartY),
  );
}
function lineOnTouchEnd() {
  if (!lineIsDragging) return;
  lineIsDragging = false;
  document.removeEventListener("touchmove", lineOnTouchMove);
  document.removeEventListener("touchend", lineOnTouchEnd);
  snapLineSlider();
}

function lineOnMouseDown(e) {
  if (e.target.closest("button")) return;
  lineIsDragging = true;
  lineDragStartY = e.clientY;
  lineDragStartHeight = lineSliderHeight;
  document.getElementById("line-slider").style.transition = "none";
  document.addEventListener("mousemove", lineOnMouseMove);
  document.addEventListener("mouseup", lineOnMouseUp);
}
function lineOnMouseMove(e) {
  if (!lineIsDragging) return;
  applyLineSliderHeight(lineDragStartHeight - (e.clientY - lineDragStartY));
}
function lineOnMouseUp() {
  if (!lineIsDragging) return;
  lineIsDragging = false;
  document.removeEventListener("mousemove", lineOnMouseMove);
  document.removeEventListener("mouseup", lineOnMouseUp);
  snapLineSlider();
}

function applyLineSliderHeight(newHeight) {
  const slider = document.getElementById("line-slider");
  const maxH = window.innerHeight * 0.85;
  const clamped = Math.max(LINE_MIN_HEIGHT, Math.min(maxH, newHeight));
  lineSliderHeight = clamped;
  slider.style.height = clamped + "px";

  /* If dragged up from minimised state — restore content */
  if (clamped > 80 && slider.classList.contains("minimised")) {
    slider.classList.remove("minimised");
  }
}

function snapLineSlider() {
  const slider = document.getElementById("line-slider");
  slider.style.transition = "height 0.3s ease";
  const screenH = window.innerHeight;
  const halfHeight = screenH * 0.45;
  const fullHeight = screenH * 0.85;
  const closeH = screenH * 0.15;

  if (lineSliderHeight < closeH) {
    /* Dragged off screen — close */
    closeLineSlider();
  } else if (lineSliderHeight < (halfHeight + fullHeight) / 2) {
    lineSliderHeight = halfHeight;
    slider.style.height = halfHeight + "px";
  } else {
    lineSliderHeight = fullHeight;
    slider.style.height = fullHeight + "px";
  }
}
