/*
  ══════════════════════════════════════════════════════════════
  settings.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the settings panel open/close and settings actions.
  Mirrors the exact same pattern as sidebar.js.
  Depends on: variables.js, map.js, ui.js (showToast)
  ══════════════════════════════════════════════════════════════
*/

/* ── SETTINGS OPEN / CLOSE ── */

function openSettings() {
  document.getElementById("settings").classList.add("open");
  document.getElementById("settings-overlay").classList.add("visible");
  closeSidebar();
}

function closeSettings() {
  document.getElementById("settings").classList.remove("open");
  document.getElementById("settings-overlay").classList.remove("visible");
}

/* The × inside the settings header closes it */
document.getElementById("settings-close").onclick = closeSettings;

/* ── DARK MODE (called from settings panel) ── */

function toggleDarkMode() {
  darkMode = !darkMode;

  document.body.classList.toggle("dark", darkMode);

  /* Update icon in settings panel */
  const settingsIcon = document.getElementById("settings-theme-icon");
  if (settingsIcon) {
    settingsIcon.className = darkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  /* Switch map tile layer */
  if (darkMode && currentLayer !== "Dark") {
    map.removeLayer(tileLayers[currentLayer]);
    tileLayers["Dark"].addTo(map);
    currentLayer = "Dark";
    document.getElementById("layer-label").textContent = "Dark";
    document.getElementById("current-layer-name").textContent =
      "Currently: Dark";
  } else if (!darkMode && currentLayer === "Dark") {
    map.removeLayer(tileLayers["Dark"]);
    tileLayers["Default"].addTo(map);
    currentLayer = "Default";
    document.getElementById("layer-label").textContent = "Default";
    document.getElementById("current-layer-name").textContent =
      "Currently: Default";
  }

  showToast(darkMode ? "Dark mode on" : "Dark mode off");
}

/* ── PLACEHOLDER ACTIONS ── */

function openLanguageMenu() {
  showToast("Language selection coming soon!");
}

function openAbout() {
  showToast("Transit · Personal Project · v1.0");
}
