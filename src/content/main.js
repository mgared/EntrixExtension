// Content-script entry.
//
// Two independent entry points share the same sentence builder + inserter:
//
//   1. ";;"               → popup flow (Role + Reason picker)
//   2. ";<rolecode><n>"   → shorthand flow (instant template expansion)
//
// Examples: `;re1` inserts the first resident reason; `;gu3` the third
// guest reason. Single-digit indexing means each role caps at 9 reasons.

import { createTriggerDetector } from "./detector/trigger-detector.js";
import { createShorthandDetector } from "./shorthand/shorthand-detector.js";
import { resolveShorthand } from "./shorthand/decoder.js";
import { createPopupController } from "./popup/popup-controller.js";
import { getCaretViewportRect } from "./positioning/caret-position.js";
import { replaceRange } from "./inserter/text-inserter.js";
import { buildSentence, withLeadingLineBreak } from "./sentence-builder.js";
import { TRIGGER_SEQUENCE } from "../config/triggers.js";

let detector;
let controller;

function boot() {
  controller = createPopupController({
    onInsert: ({ element, triggerStart, sentence }) => {
      replaceRange(
        element,
        triggerStart,
        triggerStart + TRIGGER_SEQUENCE.length,
        sentence
      );
      detector?.suppress(element);
    },
    onDismiss: ({ element }) => {
      detector?.suppress(element);
    },
  });

  detector = createTriggerDetector({
    onTrigger: ({ element, caret, triggerStart }) => {
      if (controller.isOpen()) return;
      const rect = getCaretViewportRect(element);
      if (!rect) return;
      controller.open({
        element,
        triggerStart,
        triggerEnd: caret,
        x: rect.left,
        y: rect.top + rect.height + 4,
      });
    },
  });

  createShorthandDetector({
    onMatch: ({ element, roleCode, reasonIndex, matchStart, matchEnd }) => {
      if (controller.isOpen()) return;
      const resolved = resolveShorthand({ roleCode, reasonIndex });
      if (!resolved) return;
      const sentence = buildSentence({
        role: resolved.role,
        reason: resolved.reason,
      });
      replaceRange(
        element,
        matchStart,
        matchEnd,
        withLeadingLineBreak(sentence)
      );
      detector?.suppress(element);
    },
  });
}

boot();
