/*
  ══════════════════════════════════════════════════════════════
  ui.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Global UI utilities: toast notifications, fullscreen toggle,
  keyboard shortcuts, and resize handler.
  Depends on: variables.js, map.js, and all other JS files
  (this file should be loaded last before index.html closes)
  ══════════════════════════════════════════════════════════════
*/

/* ── TOAST NOTIFICATION ── */

/*
  showToast(message) slides a small pill up from the bottom,
  displays it for 2.5 seconds, then fades it out automatically.
*/
function showToast(message) {
  const toast = document.getElementById("toast");

  /* Cancel any existing timer so toasts don't overlap */
  if (toastTimer) clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}

/* ── FULLSCREEN ── */

function toggleFullscreen() {
  const icon = document.getElementById("fullscreen-icon");

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(function () {
      icon.className = "fa-solid fa-compress";
      showToast("Fullscreen — press Esc to exit");
    });
  } else {
    document.exitFullscreen().then(function () {
      icon.className = "fa-solid fa-expand";
    });
  }
}

/* Keep the icon in sync when the user presses Esc to exit */
document.addEventListener("fullscreenchange", function () {
  const icon = document.getElementById("fullscreen-icon");
  icon.className = document.fullscreenElement
    ? "fa-solid fa-compress"
    : "fa-solid fa-expand";
});

/* ── KEYBOARD SHORTCUTS ── */

document.addEventListener("keydown", function (e) {
  /* Do nothing when the user is typing inside an input field */
  if (e.target.tagName === "INPUT") return;

  switch (e.key) {
    case "Escape":
      closeInfoCard();
      closeSavedPlaces();
      closeDirections();
      closeSidebar();
      document.getElementById("search-results").style.display = "none";
      break;

    case "+":
    case "=":
      map.zoomIn();
      break;

    case "-":
      map.zoomOut();
      break;

    case "f":
    case "F":
      toggleFullscreen();
      break;

    case "d":
    case "D":
      document.getElementById("dark-mode-btn").click();
      break;

    case "/":
      e.preventDefault();
      document.getElementById("search-input").focus();
      break;
  }
});

/* ── RESIZE HANDLER ── */

/*
  Resets the sidebar overlay state when the window is resized.
  On desktop (≥ 768px) the overlay is never needed.
*/
function handleResize() {
  if (window.innerWidth >= 768) {
    document.getElementById("sidebar-overlay").classList.remove("visible");
  }
}

window.addEventListener("resize", handleResize);
handleResize(); /* run once on page load */

/*
  makeDraggable(elementId, handleId)
  Makes a floating panel draggable by its header.
  elementId — the id of the panel to move
  handleId  — the id of the element the user grabs to drag
              (usually the header bar)
  
  How it works:
  - Mouse down on the handle → start tracking mouse movement
  - Mouse move → calculate how far the mouse moved and shift the panel
  - Mouse up → stop tracking
  
  We use 'left' and 'top' to move the panel.
  The panel must have position: absolute or position: fixed.
*/
function makeDraggable(elementId, handleId) {
  const panel = document.getElementById(elementId);
  const handle = document.getElementById(handleId);

  if (!panel || !handle) return; /* safety check */

  var startX = 0; /* mouse X when drag started    */
  var startY = 0; /* mouse Y when drag started    */
  var startLeft = 0; /* panel left when drag started */
  var startTop = 0; /* panel top when drag started  */

  handle.style.cursor = "grab";

  handle.addEventListener("mousedown", function (e) {
    /* Only drag with the left mouse button */
    if (e.button !== 0) return;

    /* Don't drag if the user clicked a button inside the header */
    if (e.target.closest("button")) return;

    e.preventDefault();

    /* Record starting positions */
    startX = e.clientX;
    startY = e.clientY;
    startLeft = panel.offsetLeft;
    startTop = panel.offsetTop;

    handle.style.cursor = "grabbing";

    /*
      Switch the panel from CSS-defined position to
      JS-controlled position so we can move it freely.
      We read the current computed position first so
      the panel doesn't jump on the first drag.
    */
    const rect = panel.getBoundingClientRect();
    panel.style.left = rect.left + "px";
    panel.style.top = rect.top + "px";
    panel.style.right = "auto"; /* cancel any right/bottom CSS */
    panel.style.bottom = "auto";
    panel.style.transform = "none"; /* cancel any CSS transforms   */

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    /* How far the mouse has moved since drag started */
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    /* New position */
    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;

    /*
      Clamp so the panel can't be dragged off-screen.
      We leave at least 60px visible on each side so
      the user can always grab it again.
    */
    const maxLeft = window.innerWidth - 60;
    const maxTop = window.innerHeight - 60;
    newLeft = Math.max(-panel.offsetWidth + 60, Math.min(maxLeft, newLeft));
    newTop = Math.max(0, Math.min(maxTop, newTop));

    panel.style.left = newLeft + "px";
    panel.style.top = newTop + "px";
  }

  function onMouseUp() {
    handle.style.cursor = "grab";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

/* Make desktop panels draggable */
makeDraggable("directions-panel", "directions-header");
makeDraggable("saved-popup", "saved-popup-header");

/* Restore saved places and settings from localStorage on startup */
restoreSavedPlaces();
restoreSettings();
