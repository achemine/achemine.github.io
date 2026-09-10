/*
  ══════════════════════════════════════════════════════════════
  lines.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the line slider bottom sheet.
  Shows lines serving a stop, draws route on map when selected.
  Depends on: variables.js, map.js, stops.js
  ══════════════════════════════════════════════════════════════
*/

/* ── STATE ── */
var lineSliderHeight = 0;
var activeLineLayer = null; /* currently drawn line route on map */
var activeLineId = null; /* id of the currently selected line */
var currentSliderStopId = null; /* stop id the slider is showing     */

/* ════════════════════════════════════════════════════════════
   OPEN / CLOSE
   ════════════════════════════════════════════════════════════ */

/*
  openLineSliderById(stopId, stopName, color)
  Opens the slider and fetches lines for the given stop id.
  Uses integer id — no name matching needed.
*/
function openLineSliderById(stopId, stopName, color) {
  closeInfoCard();
  if (!stopId) {
    showToast("No stop selected");
    return;
  }

  currentSliderStopId = stopId;

  /* Update header title */
  const nameEl = document.getElementById("line-slider-stop-name");
  if (nameEl) nameEl.textContent = stopName || "Lines";

  /* Show loading state */
  const list = document.getElementById("line-slider-list");
  if (list) {
    list.innerHTML = `
      <div class="line-slider-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        Loading lines…
      </div>
    `;
  }

  /* Open the sheet */
  const slider = document.getElementById("line-slider");
  if (!slider) return;

  slider.classList.add("open");
  slider.classList.remove("minimised");

  lineSliderHeight = window.innerHeight * 0.45;
  slider.style.height = lineSliderHeight + "px";
  slider.style.transform = "translateY(0)";
  slider.style.transition = "transform 0.3s ease, height 0.3s ease";

  initLineSliderDrag(slider);

  /* Fetch lines by stop id from server */
  fetch("http://localhost:3000/api/stops/" + stopId + "/lines")
    .then(function (r) {
      if (!r.ok) throw new Error("Server error: " + r.status);
      return r.json();
    })
    .then(function (stop) {
      if (!list) return;

      if (!stop || !stop.lines || stop.lines.length === 0) {
        list.innerHTML = `
          <div class="line-slider-empty">
            <i class="fa-solid fa-triangle-exclamation"></i>
            No lines found for this stop.
          </div>
        `;
        return;
      }

      buildLineList(stop.lines, color);
    })
    .catch(function (err) {
      console.error("Line slider fetch error:", err);
      if (list) {
        list.innerHTML = `
          <div class="line-slider-empty">
            <i class="fa-solid fa-wifi"></i>
            Could not load lines. Check your connection.
          </div>
        `;
      }
    });
}

/*
  closeLineSlider() slides the panel off screen and cleans up.
*/
function closeLineSlider() {
  const slider = document.getElementById("line-slider");
  if (!slider) return;

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
    currentSliderStopId = null;
  }, 300);
}

/* ════════════════════════════════════════════════════════════
   BUILD THE LINE LIST
   ════════════════════════════════════════════════════════════ */

/*
  buildLineList(lines, categoryColor)
  Renders one row per line in the slider list.
  Each row has a colored square badge with the line number
  and the line name next to it — similar to sidebar items.
*/
function buildLineList(lines, categoryColor) {
  const list = document.getElementById("line-slider-list");
  if (!list) return;

  list.innerHTML = "";

  lines.forEach(function (line) {
    const item = document.createElement("div");
    item.className = "line-item" + (line.id === activeLineId ? " active" : "");
    item.dataset.lineId = line.id;

    /* Badge color: use the line's own color if available, else category color */
    const badgeColor = line.color || categoryColor || "#1a73e8";

    item.innerHTML = `
      <div class="line-number-badge" style="background: ${badgeColor};">
        ${line.name}
      </div>
      <div class="line-item-text">
        <span class="line-item-name">${line.name}</span>
        <span class="line-item-type">${line.type}</span>
      </div>
      <i class="fa-solid fa-chevron-right" style="color: var(--text-hint); font-size:13px;"></i>
    `;

    item.onclick = function () {
      selectLine(line, badgeColor);
    };

    list.appendChild(item);
  });
}

/* ════════════════════════════════════════════════════════════
   SELECT A LINE
   ════════════════════════════════════════════════════════════ */

/*
  selectLine(line, color)
  When a line row is tapped:
  - Minimises the slider to show only the header
  - Draws the line route on the map
  - Tapping the same line again deselects it and restores the list
*/
function selectLine(line, color) {
  /* Same line tapped again — deselect */
  if (activeLineId === line.id) {
    activeLineId = null;
    clearActiveLineRoute();
    restoreLineSlider();
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

  /* Minimise the slider */
  minimiseLineSlider();

  /* Remove any previously drawn route */
  clearActiveLineRoute();

  /* Fetch and draw the route */
  fetch(
    "http://localhost:3000/api/lines/" + encodeURIComponent(line.id) + "/route",
  )
    .then(function (r) {
      if (!r.ok) throw new Error("Route not found");
      return r.json();
    })
    .then(function (geojson) {
      if (!geojson) {
        showToast("Route not available yet for this line");
        restoreLineSlider();
        return;
      }

      activeLineLayer = L.geoJSON(geojson, {
        style: {
          color: color,
          weight: 5,
          opacity: 0.9,
        },
      }).addTo(map);

      /* Fit map to show the full route */
      map.flyToBounds(activeLineLayer.getBounds(), {
        padding: [40, 40],
        duration: 1,
      });
    })
    .catch(function (err) {
      console.error("Route fetch error:", err);
      showToast("Route not available yet for this line");
      restoreLineSlider();
    });
}

/*
  clearActiveLineRoute() removes the drawn route from the map.
*/
function clearActiveLineRoute() {
  if (activeLineLayer) {
    map.removeLayer(activeLineLayer);
    activeLineLayer = null;
  }
}

/* ════════════════════════════════════════════════════════════
   MINIMISE / RESTORE
   ════════════════════════════════════════════════════════════ */

function minimiseLineSlider() {
  const slider = document.getElementById("line-slider");
  if (!slider) return;
  slider.style.transition = "height 0.3s ease";
  slider.classList.add("minimised");
}

function restoreLineSlider() {
  const slider = document.getElementById("line-slider");
  if (!slider) return;
  slider.style.transition = "height 0.3s ease";
  slider.classList.remove("minimised");
  slider.style.height = lineSliderHeight + "px";
}

/* ════════════════════════════════════════════════════════════
   DRAG TO RESIZE / CLOSE
   ════════════════════════════════════════════════════════════ */

var lineDragStartY = 0;
var lineDragStartHeight = 0;
var lineIsDragging = false;
var LINE_MIN_HEIGHT = 56;

function initLineSliderDrag(slider) {
  const header = document.getElementById("line-slider-header");
  if (!header) return;

  /* Remove old listeners before adding new ones */
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
  if (!slider) return;
  const maxH = window.innerHeight * 0.85;
  const clamped = Math.max(LINE_MIN_HEIGHT, Math.min(maxH, newHeight));
  lineSliderHeight = clamped;
  slider.style.height = clamped + "px";

  /* If dragged up from minimised state — restore full content */
  if (clamped > 80 && slider.classList.contains("minimised")) {
    slider.classList.remove("minimised");
  }
}

function snapLineSlider() {
  const slider = document.getElementById("line-slider");
  if (!slider) return;
  slider.style.transition = "height 0.3s ease";

  const screenH = window.innerHeight;
  const halfHeight = screenH * 0.45;
  const fullHeight = screenH * 0.85;
  const closeH = screenH * 0.15;

  if (lineSliderHeight < closeH) {
    /* Dragged off screen — close and remove route */
    closeLineSlider();
  } else if (lineSliderHeight < (halfHeight + fullHeight) / 2) {
    lineSliderHeight = halfHeight;
    slider.style.height = halfHeight + "px";
  } else {
    lineSliderHeight = fullHeight;
    slider.style.height = fullHeight + "px";
  }
}
