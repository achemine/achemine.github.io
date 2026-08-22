/*
  ══════════════════════════════════════════════════════════════
  settings.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the settings panel and language sub-panel.
  ══════════════════════════════════════════════════════════════
*/

/* ── SETTINGS OPEN / CLOSE ── */

function openSettings() {
  document.getElementById("settings").classList.add("open");
  document.getElementById("settings-overlay").classList.add("visible");
  closeSidebar(); /* hide the sidebar while settings is open */
}

function closeSettings() {
  document.getElementById("settings").classList.remove("open");
  document.getElementById("settings-overlay").classList.remove("visible");
  closeLanguagePanel();
  openSidebar(); /* reopen the sidebar if it was closed */
}

document.getElementById("settings-close").onclick = closeSettings;

/* ── DARK MODE ── */

function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle("dark", darkMode);

  const settingsIcon = document.getElementById("settings-theme-icon");
  if (settingsIcon) {
    settingsIcon.className = darkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

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

/* ── LANGUAGE SUB-PANEL ── */

function openLanguageMenu() {
  buildLanguageList();
  document.getElementById("language-panel").classList.add("open");
}

function closeLanguagePanel() {
  document.getElementById("language-panel").classList.remove("open");
}

/*
  buildLanguageList() generates the list of language options.
  The currently active language gets a highlighted background.
*/
function buildLanguageList() {
  const list = document.getElementById("language-list");
  list.innerHTML = "";

  SUPPORTED_LANGUAGES.forEach(function (lang) {
    const item = document.createElement("div");
    item.className =
      "settings-item language-option" +
      (lang === currentLanguage ? " language-active" : "");

    /* Flag emojis per language */
    const flags = {
      en: "🇬🇧",
      fr: "🇫🇷",
      ar: "🇩🇿",
      de: "🇩🇪",
      es: "🇪🇸",
      it: "🇮🇹",
    };

    item.innerHTML = `
      <div class="settings-icon language-flag-icon">${flags[lang] || "🌐"}</div>
      <div class="settings-text">
        <span class="settings-title">${LANGUAGE_NAMES[lang]}</span>
      </div>
      ${
        lang === currentLanguage
          ? '<i class="fa-solid fa-check language-check"></i>'
          : ""
      }
    `;

    item.onclick = function () {
      changeLanguage(lang);
    };
    list.appendChild(item);
  });
}

/* ── ABOUT ── */

function openAbout() {
  showToast("Transit · Personal Project · v1.0");
}
