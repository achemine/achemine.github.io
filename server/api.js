/*
  ══════════════════════════════════════════════════════════════
  api.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  All communication with the local server lives here.
  When switching to Capacitor, only this file changes.
  ══════════════════════════════════════════════════════════════
*/

var API_BASE = "http://localhost:3000/api";

/* ── STOPS ── */

function apiGetStops(type) {
  return fetch(API_BASE + "/stops" + (type ? "?type=" + type : "")).then(
    function (r) {
      return r.json();
    },
  );
}

function apiGetStopByName(name) {
  return fetch(API_BASE + "/stops/by-name/" + encodeURIComponent(name)).then(
    function (r) {
      return r.ok ? r.json() : null;
    },
  );
}

/* ── LINES ── */

function apiGetLines(type) {
  return fetch(API_BASE + "/lines" + (type ? "?type=" + type : "")).then(
    function (r) {
      return r.json();
    },
  );
}

function apiGetLineRoute(lineId) {
  return fetch(API_BASE + "/lines/" + lineId + "/route").then(function (r) {
    return r.ok ? r.json() : null;
  });
}

/* ── SAVED PLACES ── */

function apiGetSaved() {
  return fetch(API_BASE + "/saved").then(function (r) {
    return r.json();
  });
}

function apiAddSaved(name, lat, lng) {
  return fetch(API_BASE + "/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, lat, lng }),
  }).then(function (r) {
    return r.json();
  });
}

function apiUpdateSaved(id, data) {
  return fetch(API_BASE + "/saved/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(function (r) {
    return r.json();
  });
}

function apiDeleteSaved(id) {
  return fetch(API_BASE + "/saved/" + id, { method: "DELETE" }).then(
    function (r) {
      return r.json();
    },
  );
}

/* ── SETTINGS ── */

function apiGetSettings() {
  return fetch(API_BASE + "/settings").then(function (r) {
    return r.json();
  });
}

function apiSaveSetting(key, value) {
  return fetch(API_BASE + "/settings/" + key, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: String(value) }),
  }).then(function (r) {
    return r.json();
  });
}
