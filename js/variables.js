/*
  ══════════════════════════════════════════════════════════════
  variables.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  ALL shared variables used across JS files live here.
  This file must be loaded FIRST in index.html so every
  other file can read and write these variables freely.

  We use "var" instead of "let" or "const" because "var"
  attaches to the global window object — meaning every JS
  file loaded after this one can access these variables
  without any import/export needed.
  ══════════════════════════════════════════════════════════════
*/

/* ── MAP STATE ── */
var map; /* the Leaflet map instance             */
var currentLayer = "Default"; /* which tile layer is currently active */
var tileLayers = {}; /* all tile layer objects               */

/* ── CLICK / MARKER STATE ── */
var clickedLat = 36.737; /* latitude of the last clicked point   */
var clickedLng = 3.0865; /* longitude of the last clicked point  */
var clickedMarker = null; /* the dropped pin marker on click      */
var locationMarker = null; /* the GPS blue dot marker              */

/* ── DIRECTIONS STATE ── */
var routingControl = null; /* the active route drawn on the map  */
var directionProfile = "driving"; /* current transport mode             */

/* ── SAVED PLACES ── */
var savedPlaces = [{}];

/* ── TRANSIT STOP LAYERS ── */
var stopLayers = {}; /* one Leaflet layer group per category     */
var activeCategories = {}; /* tracks which categories are filtered on  */

/* ── UI STATE ── */
var darkMode = false; /* whether dark mode is currently on  */
var toastTimer = null; /* reference to the toast timeout     */
