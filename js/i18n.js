/*
  ══════════════════════════════════════════════════════════════
  i18n.js — Transit Maps App
  ══════════════════════════════════════════════════════════════
  Sets up i18next for multilingual support.
  Detects device language on startup.
  Loads translation JSON files from the locales/ folder.
  Must be loaded AFTER i18next library but BEFORE other JS files.
  ══════════════════════════════════════════════════════════════
*/

/* Supported languages */
var SUPPORTED_LANGUAGES = ["en", "fr", "ar", "de", "es", "it"];
var DEFAULT_LANGUAGE = "en";

/* Language display names shown in the picker */
var LANGUAGE_NAMES = {
  en: "English",
  fr: "Français",
  ar: "العربية",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
};

/*
  loadTranslations() fetches all JSON files at once.
  Returns a Promise that resolves with all translations.
*/
function loadTranslations() {
  return Promise.all(
    SUPPORTED_LANGUAGES.map(function (lang) {
      return fetch("locales/" + lang + ".json")
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          return { lang: lang, data: data };
        })
        .catch(function () {
          return { lang: lang, data: {} };
        });
    }),
  );
}

/*
  detectLanguage() reads the browser/device language and maps it
  to one of our supported languages.
  Falls back to DEFAULT_LANGUAGE if nothing matches.
*/
function detectLanguage() {
  const browserLang = (navigator.language || navigator.userLanguage || "en")
    .substring(0, 2) /* take just "fr" from "fr-FR" */
    .toLowerCase();

  return SUPPORTED_LANGUAGES.indexOf(browserLang) !== -1
    ? browserLang
    : DEFAULT_LANGUAGE;
}

/*
  applyTranslations(lang, resources) updates every element in the
  page that has a data-i18n attribute with the matching string.
  Also handles RTL for Arabic and updates the <html> lang attribute.
*/
function applyTranslations(lang, resources) {
  const strings = resources[lang] || resources[DEFAULT_LANGUAGE] || {};

  /* Update every element with data-i18n */
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    const key = el.getAttribute("data-i18n");
    if (strings[key]) {
      /* For inputs, update placeholder; for others, update text */
      if (el.tagName === "INPUT") {
        el.placeholder = strings[key];
      } else {
        el.textContent = strings[key];
      }
    }
  });

  /* Update data-i18n-placeholder elements */
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    const key = el.getAttribute("data-i18n-placeholder");
    if (strings[key]) el.placeholder = strings[key];
  });

  /* Set page language and direction */
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", lang === "ar");

  /* Store current language globally */
  currentLanguage = lang;
}

/* ── INITIALISE ON PAGE LOAD ── */

var currentLanguage = DEFAULT_LANGUAGE;
var i18nResources = {}; /* stores all loaded translations */

loadTranslations().then(function (results) {
  /* Build the resources object: { en: {...}, fr: {...}, ... } */
  results.forEach(function (item) {
    i18nResources[item.lang] = item.data;
  });

  /* Detect device language and apply */
  const lang = detectLanguage();
  applyTranslations(lang, i18nResources);
});

/*
  changeLanguage(lang) is called from the language picker.
*/
function changeLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  applyTranslations(lang, i18nResources);
  buildLanguageList(); /* rebuild list to update highlight */
  showToast(LANGUAGE_NAMES[lang]);
}
