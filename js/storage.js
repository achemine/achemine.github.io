/*
  ══════════════════════════════════════════════════════════════
  storage.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  All data persistence goes through this file.
  Currently backed by SQLite via the local server.
  When moving to Capacitor, only this file changes.
  ══════════════════════════════════════════════════════════════
*/

var API_BASE = "http://localhost:3000/api";

/* ════════════════════════════════════════════════════════════
   SAVED PLACES
   ════════════════════════════════════════════════════════════ */

/*
  savedLoad() fetches all saved places from the database.
  Returns a Promise that resolves with an array of place objects.
*/
function savedLoad() {
  return fetch(API_BASE + "/saved")
    .then(function (r) {
      return r.json();
    })
    .catch(function () {
      return [];
    });
}

/*
  savedAdd(name, lat, lng) inserts a new saved place.
  Returns a Promise that resolves with { id } of the new record.
*/
function savedAdd(name, lat, lng) {
  return fetch(API_BASE + "/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, lat: lat, lng: lng }),
  })
    .then(function (r) {
      return r.json();
    })
    .catch(function () {
      return null;
    });
}

/*
  savedUpdate(id, data) updates name and/or visibility.
  data = { name: '...', visible: true/false }
*/
function savedUpdate(id, data) {
  return fetch(API_BASE + "/saved/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (r) {
      return r.json();
    })
    .catch(function () {
      return null;
    });
}

/*
  savedDelete(id) removes a saved place from the database.
*/
function savedDelete(id) {
  return fetch(API_BASE + "/saved/" + id, { method: "DELETE" })
    .then(function (r) {
      return r.json();
    })
    .catch(function () {
      return null;
    });
}

/* ════════════════════════════════════════════════════════════
   SETTINGS
   ════════════════════════════════════════════════════════════ */

/*
  settingsLoad() fetches all settings as a key-value object.
  Returns a Promise: { theme: 'dark', language: 'fr', ... }
*/
function settingsLoad() {
  return fetch(API_BASE + "/settings")
    .then(function (r) {
      return r.json();
    })
    .catch(function () {
      return {};
    });
}

/*
  settingsSave(key, value) saves one setting to the database.
*/
function settingsSave(key, value) {
  return fetch(API_BASE + "/settings/" + key, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: String(value) }),
  })
    .then(function (r) {
      return r.json();
    })
    .catch(function () {
      return null;
    });
}
