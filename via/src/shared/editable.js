// Editable-element helpers.
//
// The three shapes we care about:
//   - <input type=text|search|email|url|tel|...>
//   - <textarea>
//   - any element with contenteditable="true"
// Password, hidden, and numeric-only inputs are excluded.

const TEXT_INPUT_TYPES = new Set([
  "text", "search", "email", "url", "tel",
]);

export function getEditableKind(el) {
  if (!el || el.nodeType !== 1) return null;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return "textarea";
  if (tag === "INPUT") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    return TEXT_INPUT_TYPES.has(type) ? "input" : null;
  }
  if (el.isContentEditable) return "contenteditable";
  return null;
}

export function isEditable(el) {
  return getEditableKind(el) !== null;
}

// Returns the string value and caret offset for the given editable.
// For contenteditable the "value" is the element's textContent and the
// caret offset is relative to that flattened string.
export function readCaret(el) {
  const kind = getEditableKind(el);
  if (kind === "input" || kind === "textarea") {
    return { value: el.value, caret: el.selectionStart ?? el.value.length };
  }
  if (kind === "contenteditable") {
    const sel = el.ownerDocument.getSelection();
    if (!sel || sel.rangeCount === 0) return { value: el.textContent, caret: 0 };
    const range = sel.getRangeAt(0).cloneRange();
    const pre = range.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.endContainer, range.endOffset);
    return { value: el.textContent, caret: pre.toString().length };
  }
  return null;
}
