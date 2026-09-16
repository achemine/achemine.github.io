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
var activeLineLayer = null;
var activeLineId = null;
var currentSliderStopId = null;

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
  }, 300);
}

/* ════════════════════════════════════════════════════════════
   BUILD THE LINE LIST
   ════════════════════════════════════════════════════════════ */

function buildLineList(lines, categoryColor) {
  const list = document.getElementById("line-slider-list");
  if (!list) return;
  list.innerHTML = "";

  lines.forEach(function (line) {
    const badgeColor = line.color || categoryColor || "#1a73e8";

    /* ── Line group wrapper ── */
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
        <span class="line-item-name">${line.id}</span>
        <span class="line-item-type">${line.type}</span>
      </div>
      <i class="fa-solid fa-chevron-down line-expand-icon" style="color: var(--text-hint); font-size:13px;"></i>
    `;

    /* ── Direction sub-rows (hidden by default) ── */
    const subRows = document.createElement("div");
    subRows.className = "line-sub-rows";
    subRows.style.display = "none";

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
        if (!routes) return;

        const hasOut = routes.outbound !== null;
        const hasRet = routes.return !== null;

        /* If only one direction — clicking main row draws it directly */
        if (hasOut && !hasRet) {
          mainRow.onclick = function () {
            drawLineRoute(line.id, routes.outbound, badgeColor);
            minimiseLineSlider();
          };
          /* Hide the chevron since there are no sub-rows */
          const chevron = mainRow.querySelector(".line-expand-icon");
          if (chevron) chevron.style.display = "none";
          return;
        }

        if (!hasOut && hasRet) {
          mainRow.onclick = function () {
            drawLineRoute(line.id, routes.return, badgeColor);
            minimiseLineSlider();
          };
          const chevron = mainRow.querySelector(".line-expand-icon");
          if (chevron) chevron.style.display = "none";
          return;
        }

        /* Both directions exist — show sub-rows */
        if (hasOut) {
          const label = getRouteLabel(routes.outbound, line.id, "outbound");
          const outRow = buildDirectionRow(
            label,
            line,
            badgeColor,
            routes.outbound,
          );
          subRows.appendChild(outRow);
        }

        if (hasRet) {
          const label = getRouteLabel(routes.return, line.id, "return");
          const retRow = buildDirectionRow(
            label,
            line,
            badgeColor,
            routes.return,
          );
          subRows.appendChild(retRow);
        }

        /* Clicking main row toggles sub-rows */
        mainRow.onclick = function () {
          const isOpen = subRows.style.display !== "none";
          subRows.style.display = isOpen ? "none" : "block";
          const icon = mainRow.querySelector(".line-expand-icon");
          if (icon) {
            icon.className = isOpen
              ? "fa-solid fa-chevron-down line-expand-icon"
              : "fa-solid fa-chevron-up line-expand-icon";
          }
        };
      })
      .catch(function (err) {
        console.error("Routes fetch error for line", line.id, err);
        /* Fallback — clicking draws nothing but doesn't crash */
        mainRow.onclick = function () {
          showToast("Route not available for this line");
        };
      });

    group.appendChild(mainRow);
    group.appendChild(subRows);
    list.appendChild(group);
  });
}

/* ════════════════════════════════════════════════════════════
   DIRECTION HELPERS
   ════════════════════════════════════════════════════════════ */

/*
  getRouteLabel() extracts a readable direction label.
  Uses the line_id which contains "Origin - Destination" format.
*/
function getRouteLabel(geojson, lineId, direction) {
  /* Try to split the line_id into origin and destination */
  if (lineId && lineId.indexOf(" - ") !== -1) {
    const parts = lineId.split(" - ");
    const origin = parts[0].trim();
    const dest = parts[parts.length - 1].trim();

    return direction === "outbound"
      ? origin + " → " + dest
      : dest + " → " + origin;
  }

  /* Fallback */
  return direction === "outbound" ? "→ Outbound" : "← Return";
}

/*
  buildDirectionRow() creates one clickable sub-row for a direction.
*/
function buildDirectionRow(label, line, color, geojson) {
  const row = document.createElement("div");
  row.className = "line-item line-direction-row";

  row.innerHTML = `
    <div class="line-direction-dot" style="background: ${color};"></div>
    <div class="line-item-text">
      <span class="line-item-name">${label}</span>
    </div>
    <i class="fa-solid fa-chevron-right" style="color: var(--text-hint); font-size:12px;"></i>
  `;

  row.onclick = function (e) {
    e.stopPropagation();

    /* Remove active from all direction rows */
    document.querySelectorAll(".line-direction-row").forEach(function (r) {
      r.classList.remove("active");
    });
    row.classList.add("active");

    drawLineRoute(line.id, geojson, color);
    minimiseLineSlider();
  };

  return row;
}

/* ════════════════════════════════════════════════════════════
   DRAW / CLEAR ROUTE
   ════════════════════════════════════════════════════════════ */

function drawLineRoute(id, geojson, color) {
  clearActiveLineRoute();

  if (!geojson) {
    showToast("Route not available for this line");
    return;
  }

  activeLineLayer = L.geoJSON(geojson, {
    style: {
      color: color,
      weight: 5,
      opacity: 0.9,
    },
  }).addTo(map);

  activeLineId = id;

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
  /* Force height to just show the header */
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

  /* If dragged up from minimised — restore content */
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
