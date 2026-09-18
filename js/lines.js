/*
  ══════════════════════════════════════════════════════════════
  lines.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
*/

/* ── STATE ── */
var lineSliderHeight = 0;
var activeLineLayer = null;
var activeLineId = null;
var currentSliderStopId = null;
var currentLineRoutes =
  null; /* stores { outbound, return } for selected line */
var currentLineColor = null; /* color of the selected line                    */

/* ════════════════════════════════════════════════════════════
   OPEN / CLOSE
   ════════════════════════════════════════════════════════════ */

function openLineSliderById(stopId, stopName, color) {
  closeInfoCard();
  if (!stopId) {
    showToast("No stop selected");
    return;
  }

  currentSliderStopId = stopId;

  const nameEl = document.getElementById("line-slider-stop-name");
  if (nameEl) nameEl.textContent = stopName || "Lines";

  /* Always start on the lines list view */
  showLinesList();

  const list = document.getElementById("line-slider-list");
  if (list) {
    list.innerHTML = `
      <div class="line-slider-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        Loading lines…
      </div>
    `;
  }

  const slider = document.getElementById("line-slider");
  if (!slider) return;

  slider.classList.add("open");
  slider.classList.remove("minimised");

  lineSliderHeight = window.innerHeight * 0.45;
  slider.style.height = lineSliderHeight + "px";
  slider.style.transform = "translateY(0)";
  slider.style.transition = "transform 0.3s ease, height 0.3s ease";

  initLineSliderDrag(slider);

  /* Fetch lines for this stop */
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
            Could not load lines.
          </div>
        `;
      }
    });
}

function closeLineSlider() {
  const slider = document.getElementById("line-slider");
  if (!slider) return;

  slider.style.transition = "transform 0.3s ease";
  slider.style.transform = "translateY(100%)";

  clearActiveLineRoute();

  setTimeout(function () {
    slider.classList.remove("open");
    slider.classList.remove("minimised");
    slider.style.transform = "";
    slider.style.height = "";
    activeLineId = null;
    currentSliderStopId = null;
    currentLineRoutes = null;
    currentLineColor = null;
  }, 300);
}

/* ════════════════════════════════════════════════════════════
   SHOW / HIDE VIEWS
   ════════════════════════════════════════════════════════════ */

function showLinesList() {
  document.getElementById("line-slider-content").style.display = "block";
  document.getElementById("line-directions-view").style.display = "none";
}

/* ════════════════════════════════════════════════════════════
   BUILD LINE LIST
   ════════════════════════════════════════════════════════════ */

function buildLineList(lines, categoryColor) {
  const list = document.getElementById("line-slider-list");
  if (!list) return;
  list.innerHTML = "";

  lines.forEach(function (line) {
    const badgeColor = line.color || categoryColor || "#1a73e8";

    /* ── Wrapper for line row + its sub-rows ── */
    const group = document.createElement("div");
    group.className = "line-group";
    group.dataset.lineId = line.id;

    /* ── Main line row ── */
    const mainRow = document.createElement("div");
    mainRow.className = "line-item line-item-main";
    mainRow.innerHTML = `
      <div class="line-number-badge" style="background: ${badgeColor};">
        ${line.name}
      </div>
      <div class="line-item-text">
        <span class="line-item-id">${line.id}</span>
        <span class="line-item-type">${line.type}</span>
      </div>
      <i class="fa-solid fa-chevron-down line-expand-icon" style="color:var(--text-hint); font-size:13px;"></i>
    `;

    /* ── Sub-rows container ── */
    const subRows = document.createElement("div");
    subRows.className = "line-sub-rows";
    subRows.style.display = "none";
    subRows.style.overflow = "hidden";
    subRows.style.transition = "max-height 0.3s ease";
    subRows.style.maxHeight = "0px";

    mainRow.onclick = function () {
      onLineClicked(line, badgeColor, mainRow, subRows);
    };

    group.appendChild(mainRow);
    group.appendChild(subRows);
    list.appendChild(group);
  });
}

function onLineClicked(line, color, mainRow, subRows) {
  const icon = mainRow.querySelector(".line-expand-icon");

  /* If already open — close it */
  if (subRows.style.display !== "none") {
    subRows.style.maxHeight = "0px";
    setTimeout(function () {
      subRows.style.display = "none";
    }, 300);
    if (icon) icon.className = "fa-solid fa-chevron-down line-expand-icon";
    clearActiveLineRoute();
    return;
  }

  /* Show loading state inside sub-rows */
  subRows.innerHTML = `
    <div class="line-direction-row" style="justify-content:center; color:var(--text-secondary);">
      <i class="fa-solid fa-spinner fa-spin"></i>
    </div>
  `;
  subRows.style.display = "block";
  subRows.style.maxHeight = "200px";
  if (icon) icon.className = "fa-solid fa-chevron-up line-expand-icon";

  /* Fetch both directions */
  fetch(
    "http://localhost:3000/api/lines/" +
      encodeURIComponent(line.id) +
      "/routes",
  )
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (routes) {
      subRows.innerHTML = "";

      if (!routes || (!routes.outbound && !routes.return)) {
        subRows.innerHTML = `
          <div class="line-direction-row" style="color:var(--text-secondary); font-size:13px;">
            No routes available
          </div>
        `;
        return;
      }

      /* Build outbound row */
      if (routes.outbound) {
        const label = getRouteLabel(routes.outbound, line.id, "outbound");
        const outRow = document.createElement("div");
        outRow.className = "line-item line-direction-row";
        outRow.innerHTML = `
          <div class="line-direction-dot" style="background:${color};"></div>
          <div class="line-item-text">
            <span class="line-item-name">${label}</span>
          </div>
        `;
        outRow.onclick = function (e) {
          e.stopPropagation();
          document
            .querySelectorAll(".line-direction-row")
            .forEach(function (r) {
              r.classList.remove("active");
            });
          outRow.classList.add("active");
          drawLineRoute(routes.outbound, color);
          minimiseLineSlider();
        };
        subRows.appendChild(outRow);
      }

      /* Build return row */
      if (routes.return) {
        const label = getRouteLabel(routes.return, line.id, "return");
        const retRow = document.createElement("div");
        retRow.className = "line-item line-direction-row";
        retRow.innerHTML = `
          <div class="line-direction-dot" style="background:${color};"></div>
          <div class="line-item-text">
            <span class="line-item-name">${label}</span>
          </div>
          <i class="fa-solid fa-chevron-right" style="color:var(--text-hint); font-size:12px;"></i>
        `;
        retRow.onclick = function (e) {
          e.stopPropagation();
          document
            .querySelectorAll(".line-direction-row")
            .forEach(function (r) {
              r.classList.remove("active");
            });
          retRow.classList.add("active");
          drawLineRoute(routes.return, color);
          minimiseLineSlider();
        };
        subRows.appendChild(retRow);
      }
    })
    .catch(function () {
      subRows.innerHTML = `
        <div class="line-direction-row" style="color:var(--text-secondary); font-size:13px;">
          Could not load routes
        </div>
      `;
    });
}

/* ════════════════════════════════════════════════════════════
   ROUTE HELPERS
   ════════════════════════════════════════════════════════════ */

function getRouteLabel(geojson, lineId, direction) {
  /* Extract origin and destination from the line_id */
  if (lineId && lineId.indexOf(" - ") !== -1) {
    const parts = lineId.split(" - ");
    const origin = parts[0].trim();
    const dest = parts[parts.length - 1].trim();

    return direction === "outbound"
      ? origin + " - " + dest
      : dest + " - " + origin;
  }

  /* Fallback if line_id has no ' - ' separator */
  return direction === "outbound" ? "Outbound" : "Return";
}

function drawLineRoute(geojson, color) {
  clearActiveLineRoute();

  if (!geojson) {
    showToast("Route not available");
    return;
  }

  activeLineLayer = L.geoJSON(geojson, {
    style: { color: color, weight: 5, opacity: 0.9 },
  }).addTo(map);

  try {
    map.flyToBounds(activeLineLayer.getBounds(), {
      padding: [40, 40],
      duration: 1,
    });
  } catch (e) {
    console.warn("Could not fit bounds:", e);
  }
}

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
  slider.style.height = "56px";
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
  header.removeEventListener("touchstart", lineOnTouchStart);
  header.removeEventListener("mousedown", lineOnMouseDown);
  header.addEventListener("touchstart", lineOnTouchStart, { passive: true });
  header.addEventListener("mousedown", lineOnMouseDown);
}

function lineOnTouchStart(e) {
  if (e.target.closest("button")) return;
  lineIsDragging = true;
  lineDragStartY = e.touches[0].clientY;
  lineDragStartHeight =
    parseInt(document.getElementById("line-slider").style.height) ||
    lineSliderHeight;
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
  lineDragStartHeight =
    parseInt(document.getElementById("line-slider").style.height) ||
    lineSliderHeight;
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
    closeLineSlider();
  } else if (lineSliderHeight < (halfHeight + fullHeight) / 2) {
    lineSliderHeight = halfHeight;
    slider.style.height = halfHeight + "px";
  } else {
    lineSliderHeight = fullHeight;
    slider.style.height = fullHeight + "px";
  }
}
