/*
  ══════════════════════════════════════════════════════════════
  sidebar.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
*/

/* ── SIDEBAR OPEN / CLOSE ── */

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("visible");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("visible");
}

/* Hamburger button toggles the sidebar */
document.getElementById("menu-btn").onclick = function () {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
};

/* The × inside the sidebar header closes it */
document.getElementById("sidebar-close").onclick = closeSidebar;
