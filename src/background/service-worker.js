// Background service worker (MV3).
// Intentionally minimal — the feature runs in the content script.
// This file exists as a home for future cross-tab state, storage sync,
// commands registration, or API calls that need extension privileges.

chrome.runtime.onInstalled.addListener(() => {
  console.log("[phrase-snippets] installed");
});
