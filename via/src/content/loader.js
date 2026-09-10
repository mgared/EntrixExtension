// Content-script bootstrap.
//
// Manifest V3 content scripts can't be declared as ES modules, so this tiny
// loader runs as a classic script and dynamic-imports the real entry module.
// Keeping the loader empty of logic means everything else in the extension
// is an ES module graph with real imports, not a flat soup of globals.

(async () => {
  try {
    const entry = chrome.runtime.getURL("src/content/main.js");
    await import(entry);
  } catch (err) {
    console.error("[apex-shift-log-helper] loader failed:", err);
  }
})();
