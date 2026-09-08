// Content-script entry.
//
// Typing ";;" opens the popup, which is the only way in: the role and
// reason pickers are where every sentence gets built.

import { createTriggerDetector } from "./detector/trigger-detector.js";
import { createPopupController } from "./popup/popup-controller.js";
import { getCaretViewportRect } from "./positioning/caret-position.js";
import { replaceRange, appendUnderHeading } from "./inserter/text-inserter.js";
import {
  initShiftState,
  addItemOut,
  clearItemOut,
} from "./shift-state.js";
import { TRIGGER_SEQUENCE } from "../config/triggers.js";

let detector;
let controller;

function boot() {
  initShiftState();
  controller = createPopupController({
    onInsert: ({ element, triggerStart, sentence, filing, outEvent }) => {
      replaceRange(
        element,
        triggerStart,
        triggerStart + TRIGGER_SEQUENCE.length,
        sentence
      );
      // A flagged sentence also files a copy under its section heading, if
      // the log in this editable has one. Done after the caret insertion so
      // the section scan sees the document as it now stands.
      for (const heading of filing?.sections || []) {
        appendUnderHeading(element, heading, filing);
      }
      // Anything lent out or handed back changes what's outstanding, which
      // the Still out chip reads back later in the shift.
      if (outEvent?.dir === "out") addItemOut(outEvent);
      else if (outEvent?.dir === "in") clearItemOut(outEvent);
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
        // The top of the caret's line, so the popup can flip above it
        // rather than above the anchor that already sits below it.
        yTop: rect.top - 4,
      });
    },
  });
}

boot();
