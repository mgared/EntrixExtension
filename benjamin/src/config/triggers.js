// Trigger config.
//
// A trigger is the sequence the user types to summon the popup. Keeping this
// as data (not code) means you can later add keyboard shortcuts, custom
// triggers per site, or user-configurable triggers from an options page
// without touching the detector.

export const TRIGGER_SEQUENCE = ";;";

// If the popup is dismissed, wait this long before re-triggering on the
// same editable so a dismissal sticks until the user moves on.
export const RETRIGGER_COOLDOWN_MS = 400;
