// Shorthand detector — watches editables for a `;<rolecode><digit>`
// pattern ending at the caret and reports the match. Fires the moment the
// digit is typed (single-digit reason index keeps the trigger atomic).
//
// Example: typing `;re1` fires {code: "re", reason: 1}. The popup flow
// (`;;`) lives in trigger-detector.js and is unaffected.

import { getEditableKind, readCaret } from "../../shared/editable.js";

// ;<2 letters><digit 1-9>
const PATTERN = /;([a-z]{2})([1-9])$/;

// How far back to scan before the caret. 8 chars is plenty for `;xx9`.
const SCAN_BACK = 16;

export function createShorthandDetector({ onMatch }) {
  const handleInput = (event) => {
    const el = event.target;
    if (!getEditableKind(el)) return;

    const info = readCaret(el);
    if (!info) return;

    const { value, caret } = info;
    const slice = value.slice(Math.max(0, caret - SCAN_BACK), caret);
    const m = PATTERN.exec(slice);
    if (!m) return;

    onMatch({
      element: el,
      roleCode: m[1],
      reasonIndex: parseInt(m[2], 10),
      matchStart: caret - m[0].length,
      matchEnd: caret,
    });
  };

  document.addEventListener("input", handleInput, true);
  return {
    destroy: () => document.removeEventListener("input", handleInput, true),
  };
}
