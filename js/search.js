/*
  ══════════════════════════════════════════════════════════════
  search.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Handles the search box — sends queries to the free Nominatim
  geocoding API and displays results in the dropdown.
  Depends on: variables.js, map.js, markers.js, click.js
  ══════════════════════════════════════════════════════════════
*/

const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const clearBtn = document.getElementById("clear-btn");

/* Debounce timer — waits 300ms after user stops typing before searching */
var searchDebounceTimer = null;

searchInput.addEventListener("input", function () {
  clearBtn.style.display = searchInput.value.length > 0 ? "flex" : "none";

  /* Clear previous timer */
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

  const query = searchInput.value.trim();

  /* Hide results if input is empty */
  if (query.length < 2) {
    searchResults.style.display = "none";
    return;
  }

  /* Wait 300ms after user stops typing, then search */
  searchDebounceTimer = setTimeout(function () {
    doSearch();
  }, 300);
});

/* × button: clear the input, hide results, refocus */
clearBtn.onclick = function () {
  searchInput.value = "";
  clearBtn.style.display = "none";
  searchResults.style.display = "none";
  searchInput.focus();
};

/* Trigger search on Enter key or the arrow button */
searchInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") doSearch();
});
document.getElementById("search-btn").onclick = doSearch;

/*
  doSearch() sends the user's text to the Nominatim API,
  which returns a list of matching places as JSON.
  fetch() is the modern way to make web requests in JavaScript.
*/
function doSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  /* Show a spinner while waiting */
  searchResults.innerHTML =
    '<div class="result-item"><i class="fa-solid fa-spinner fa-spin"></i> Searching…</div>';
  searchResults.style.display = "block";

  const url =
    "https://photon.komoot.io/api/?q=" + encodeURIComponent(query) + "&limit=6";

  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      const results = data.features || [];
      searchResults.innerHTML = "";

      if (results.length === 0) {
        searchResults.innerHTML = `
          <div class="result-item">
            <i class="fa-solid fa-circle-exclamation"></i>
            <div class="result-item-text">
              <span class="result-item-name">No results found</span>
              <span class="result-item-detail">Try a different search term</span>
            </div>
          </div>`;
        return;
      }

      /* Build one clickable row per result */
      results.forEach(function (item) {
        const div = document.createElement("div");
        div.className = "result-item";

        const props = item.properties;
        const title = props.name || props.street || props.city || "Unknown";
        const detail = [props.city, props.state, props.country]
          .filter(Boolean)
          .join(", ");

        div.innerHTML = `
          <i class="fa-solid fa-location-dot"></i>
          <div class="result-item-text">
            <span class="result-item-name">${title}</span>
            <span class="result-item-detail">${detail}</span>
          </div>
        `;

        /* Clicking a result: fly there, drop a marker, show info card */
        div.onclick = function () {
          const lat = item.geometry.coordinates[1];
          const lng = item.geometry.coordinates[0];

          map.flyTo([lat, lng], 16, { duration: 1.5 });

          if (clickedMarker) map.removeLayer(clickedMarker);
          clickedMarker = L.marker([lat, lng], { icon: createIcon("#1a73e8") })
            .addTo(map)
            .bindPopup(title)
            .openPopup();

          clickedLat = lat;
          clickedLng = lng;
          showInfoCard(title, lat.toFixed(5), lng.toFixed(5));
          searchResults.style.display = "none";
          clearBtn.style.display = "flex";
        };

        searchResults.appendChild(div);
      });

      searchResults.style.display = "block";
    })
    .catch(function () {
      searchResults.innerHTML =
        '<div class="result-item">Search failed. Check your internet.</div>';
    });
}

/* Hide the dropdown when clicking anywhere outside the search box */
document.addEventListener("click", function (e) {
  if (
    !e.target.closest("#search-box") &&
    !e.target.closest("#search-results")
  ) {
    searchResults.style.display = "none";
  }
});
