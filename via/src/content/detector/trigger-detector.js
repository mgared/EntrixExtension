// Trigger detector.
//
// Listens for `input` events bubbling up from any editable, reads the caret,
// and fires `onTrigger` when the characters immediately before the caret
// match the configured trigger sequence. The detector owns nothing UI — it
// just reports "the user just typed the trigger on this element at this
// offset" and lets the popup controller decide what to do.

import { getEditableKind, readCaret } from "../../shared/editable.js";
import { TRIGGER_SEQUENCE, RETRIGGER_COOLDOWN_MS } from "../../config/triggers.js";

export function createTriggerDetector({ onTrigger }) {
  const cooldowns = new WeakMap(); // element -> timestamp until we ignore

  const handleInput = (event) => {
    const el = event.target;
    if (!getEditableKind(el)) return;

    const until = cooldowns.get(el);
    if (until && Date.now() < until) return;

    const caretInfo = readCaret(el);
    if (!caretInfo) return;
    const { value, caret } = caretInfo;
    const before = value.slice(Math.max(0, caret - TRIGGER_SEQUENCE.length), caret);
    if (before !== TRIGGER_SEQUENCE) return;

    onTrigger({ element: el, caret, triggerStart: caret - TRIGGER_SEQUENCE.length });
  };

  const suppress = (el) => {
    cooldowns.set(el, Date.now() + RETRIGGER_COOLDOWN_MS);
  };

  document.addEventListener("input", handleInput, true);
  return {
    suppress,
    destroy: () => document.removeEventListener("input", handleInput, true),
  };
}
