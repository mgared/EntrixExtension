// Caret-position computation.
//
// Returns viewport-relative { left, top, height } for the caret inside any
// supported editable. Strategies:
//   - contenteditable: use Selection / Range.getBoundingClientRect() directly.
//   - input / textarea: render a hidden "mirror" div with the same styles,
//     insert a marker span at the caret offset, and measure the span. This
//     is the standard technique — gets within a pixel or two of real caret.

import { getEditableKind } from "../../shared/editable.js";

const MIRRORED_STYLES = [
  "direction", "boxSizing",
  "width", "height",
  "overflowX", "overflowY",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "borderStyle",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize",
  "fontSizeAdjust", "lineHeight", "fontFamily",
  "textAlign", "textTransform", "textIndent", "textDecoration",
  "letterSpacing", "wordSpacing",
  "tabSize", "MozTabSize",
];

export function getCaretViewportRect(element) {
  const kind = getEditableKind(element);
  if (!kind) return null;
  if (kind === "contenteditable") return caretRectContentEditable(element);
  return caretRectInputLike(element, kind);
}

function caretRectContentEditable(element) {
  const sel = element.ownerDocument.getSelection();
  if (!sel || sel.rangeCount === 0) return element.getBoundingClientRect();
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  const rects = range.getClientRects();
  if (rects.length) return toRect(rects[0]);
  // Collapsed range in an empty node yields no rects — fall back to element.
  const er = element.getBoundingClientRect();
  return { left: er.left, top: er.top, height: parseFloat(getComputedStyle(element).lineHeight) || 16 };
}

function caretRectInputLike(element, kind) {
  const doc = element.ownerDocument;
  const style = getComputedStyle(element);
  const mirror = doc.createElement("div");
  for (const prop of MIRRORED_STYLES) mirror.style[prop] = style[prop];
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = kind === "textarea" ? "pre-wrap" : "pre";
  mirror.style.wordWrap = kind === "textarea" ? "break-word" : "normal";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";

  const value = element.value.substring(0, element.selectionStart ?? element.value.length);
  mirror.textContent = value;

  const marker = doc.createElement("span");
  marker.textContent = "​"; // zero-width space
  mirror.appendChild(marker);
  doc.body.appendChild(mirror);

  const elRect = element.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();

  const result = {
    left: elRect.left + (markerRect.left - mirrorRect.left) - element.scrollLeft,
    top: elRect.top + (markerRect.top - mirrorRect.top) - element.scrollTop,
    height: markerRect.height || parseFloat(style.lineHeight) || 16,
  };
  mirror.remove();
  return result;
}

function toRect(r) {
  return { left: r.left, top: r.top, height: r.height };
}
