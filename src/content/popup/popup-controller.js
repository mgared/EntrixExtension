// Popup controller — orchestrates the view with the page.
//
// Holds "where did the trigger fire" state, wires up view callbacks, and
// decides when to hide (Escape, outside click, scroll, blur of target).
// The view stays dumb (just renders); the controller owns the lifecycle.

import { createPopupView } from "./popup-view.js";
import { withLeadingLineBreak } from "../sentence-builder.js";

export function createPopupController({ onInsert, onDismiss }) {
  const view = createPopupView();
  let context = null; // { element, triggerStart, triggerEnd }

  view.onSubmit((sentence) => {
    if (!context) return;
    const ctx = context;
    close();
    onInsert({
      ...ctx,
      sentence: withLeadingLineBreak(sentence),
      // Section copies become bullets, so they take the sentence without
      // the leading line break the caret insertion needs.
      filing: sentence,
    });
  });

  view.onDismiss(() => {
    const ctx = context;
    close();
    if (ctx) onDismiss(ctx);
  });

  const outsideClick = (e) => {
    if (!view.isOpen()) return;
    const path = e.composedPath ? e.composedPath() : [e.target];
    if (path.some((n) => n === view)) return;
    if (view.contains(e.target)) return;
    const ctx = context;
    close();
    if (ctx) onDismiss(ctx);
  };

  const onScroll = () => {
    if (!view.isOpen()) return;
    const ctx = context;
    close();
    if (ctx) onDismiss(ctx);
  };

  function open({ element, triggerStart, triggerEnd, x, y }) {
    context = { element, triggerStart, triggerEnd };
    view.show({ x, y });
    document.addEventListener("mousedown", outsideClick, true);
    window.addEventListener("scroll", onScroll, true);
  }

  function close() {
    context = null;
    view.hide();
    document.removeEventListener("mousedown", outsideClick, true);
    window.removeEventListener("scroll", onScroll, true);
  }

  return { open, close, isOpen: () => view.isOpen() };
}
