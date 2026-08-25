/*
  ══════════════════════════════════════════════════════════════
  storage.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Wraps localStorage into simple reusable functions.
  All other files call these instead of touching localStorage
  directly — this makes switching to Capacitor later trivial.

  Keys used:
    transit-saved    → array of saved places
    transit-theme    → 'dark' or 'light'
    transit-language → language code ('en', 'fr', 'ar'...)
  ══════════════════════════════════════════════════════════════
*/

/* ── LOW-LEVEL HELPERS ── */

/*
  storageGet(key) reads a value from localStorage and parses it.
  Returns null if the key doesn't exist or parsing fails.
*/
function storageGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("storageGet failed for key:", key, e);
    return null;
  }
}

/*
  storageSet(key, value) converts value to JSON and saves it.
  Returns true on success, false on failure.
*/
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("storageSet failed for key:", key, e);
    return false;
  }
}

/*
  storageRemove(key) deletes one key from localStorage.
*/
function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("storageRemove failed for key:", key, e);
  }
}

/* ── SAVED PLACES ── */

/*
  savedLoad() reads all saved places from storage.
  Returns an array of { name, lat, lng, visible } objects.
  The marker property is NOT stored — it gets recreated on load.
*/
function savedLoad() {
  return storageGet("transit-saved") || [];
}

/*
  savedPersist() writes the current savedPlaces array to storage.
  Strips the marker property since Leaflet objects can't be serialised.
  Call this after any change to savedPlaces.
*/
function savedPersist() {
  const toStore = savedPlaces.map(function (p) {
    return {
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      visible: p.visible,
    };
  });
  storageSet("transit-saved", toStore);
}

/* ── THEME ── */

function themeLoad() {
  return storageGet("transit-theme") || "light";
}

function themeSave(value) {
  storageSet("transit-theme", value);
}

/* ── LANGUAGE ── */

function languageLoad() {
  return storageGet("transit-language") || null;
}

function languageSave(code) {
  storageSet("transit-language", code);
}
