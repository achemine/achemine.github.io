/*
  ══════════════════════════════════════════════════════════════
  sidebar.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles sidebar open/close and dark mode toggle.
  Depends on: variables.js, map.js, ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

/* ── SIDEBAR OPEN / CLOSE ── */

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

/* Hamburger button toggles the sidebar */
document.getElementById('menu-btn').onclick = function() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
};

/* The × inside the sidebar header closes it */
document.getElementById('sidebar-close').onclick = closeSidebar;

/* ── DARK MODE TOGGLE ── */

document.getElementById('dark-mode-btn').onclick = function() {
  darkMode = !darkMode;

  /* Adding/removing the "dark" class on <body> triggers dark-mode CSS */
  document.body.classList.toggle('dark', darkMode);

  /* Swap moon ↔ sun icon */
  const icon    = this.querySelector('i');
  icon.className = darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';

  /* Switch the map tile layer to match */
  if (darkMode && currentLayer !== 'Dark') {
    map.removeLayer(tileLayers[currentLayer]);
    tileLayers['Dark'].addTo(map);
    currentLayer = 'Dark';
    document.getElementById('layer-label').textContent        = 'Dark';
    document.getElementById('current-layer-name').textContent = 'Currently: Dark';
  } else if (!darkMode && currentLayer === 'Dark') {
    map.removeLayer(tileLayers['Dark']);
    tileLayers['Default'].addTo(map);
    currentLayer = 'Default';
    document.getElementById('layer-label').textContent        = 'Default';
    document.getElementById('current-layer-name').textContent = 'Currently: Default';
  }

  showToast(darkMode ? 'Dark mode on' : 'Dark mode off');
};
