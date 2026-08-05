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
  const toast = document.getElementById('toast');

  /* Cancel any existing timer so toasts don't overlap */
  if (toastTimer) clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add('show');

  toastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}

/* ── FULLSCREEN ── */

function toggleFullscreen() {
  const icon = document.getElementById('fullscreen-icon');

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(function() {
      icon.className = 'fa-solid fa-compress';
      showToast('Fullscreen — press Esc to exit');
    });
  } else {
    document.exitFullscreen().then(function() {
      icon.className = 'fa-solid fa-expand';
    });
  }
}

/* Keep the icon in sync when the user presses Esc to exit */
document.addEventListener('fullscreenchange', function() {
  const icon    = document.getElementById('fullscreen-icon');
  icon.className = document.fullscreenElement
    ? 'fa-solid fa-compress'
    : 'fa-solid fa-expand';
});

/* ── KEYBOARD SHORTCUTS ── */

document.addEventListener('keydown', function(e) {
  /* Do nothing when the user is typing inside an input field */
  if (e.target.tagName === 'INPUT') return;

  switch (e.key) {
    case 'Escape':
      closeInfoCard();
      closeSavedPlaces();
      closeDirections();
      closeSidebar();
      document.getElementById('search-results').style.display = 'none';
      break;

    case '+':
    case '=':
      map.zoomIn();
      break;

    case '-':
      map.zoomOut();
      break;

    case 'f':
    case 'F':
      toggleFullscreen();
      break;

    case 'd':
    case 'D':
      document.getElementById('dark-mode-btn').click();
      break;

    case '/':
      e.preventDefault();
      document.getElementById('search-input').focus();
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
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }
}

window.addEventListener('resize', handleResize);
handleResize();  /* run once on page load */
