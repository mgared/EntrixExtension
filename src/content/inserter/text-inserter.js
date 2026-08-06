// Text / HTML insertion.
//
// For input / textarea: replaces [start, end) with plain text (any HTML is
// stripped — these elements can't render markup). Caret lands on the first
// "####" placeholder if one exists, selected so typing replaces it.
//
// For contenteditable: parses HTML into a fragment, deletes the trigger
// range, inserts the fragment. Caret lands inside the first
// <span data-ph="…"> and its placeholder text is selected so the user can
// type straight into it. Tab inside the element advances to the next blank
// until the user clicks/types elsewhere.

import { getEditableKind } from "../../shared/editable.js";

const PLACEHOLDER_RE = /#{3,}/;

export function replaceRange(element, start, end, { html, text }) {
  const kind = getEditableKind(element);
  if (!kind) return;

  if (kind === "input" || kind === "textarea") {
    const plain = text || stripHtml(html || "");
    element.focus();
    element.setRangeText(plain, start, end, "end");
    // Select the first "####" blank so typing replaces it.
    const insertedEnd = start + plain.length;
    const match = PLACEHOLDER_RE.exec(plain);
    if (match) {
      const selStart = start + match.index;
      element.setSelectionRange(selStart, selStart + match[0].length);
    } else {
      element.setSelectionRange(insertedEnd, insertedEnd);
    }
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: plain,
      })
    );
    return;
  }

  if (kind === "contenteditable") {
    const doc = element.ownerDocument;
    const startPos = resolveOffset(element, start);
    const endPos = resolveOffset(element, end);
    if (!startPos || !endPos) return;

    const range = doc.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);
    range.deleteContents();

    // Parse the sentence HTML into a fragment so styles survive.
    const template = doc.createElement("template");
    template.innerHTML = html || "";
    const fragment = template.content.cloneNode(true);

    // Capture the first blank and the tail node before insertNode empties
    // the fragment.
    const firstBlank = fragment.querySelector("[data-ph]");
    const lastNode = fragment.lastChild;

    range.insertNode(fragment);

    // Normalise so the inserted text merges into surrounding nodes cleanly.
    element.normalize();

    installBlankHandlers(element);

    // Caret placement is best-effort: contenteditable DOMs vary enough
    // across sites that a failure here must not stop the input event
    // below from firing, or the host page never learns of the edit.
    try {
      const sel = doc.getSelection();
      if (firstBlank && firstBlank.isConnected) {
        selectBlank(firstBlank, sel, doc);
      } else {
        // No blanks — drop the caret just past what we inserted. The
        // pre-insert offsets are stale by now (deleteContents emptied the
        // node they pointed into), so anchor off the inserted tail.
        const after = doc.createRange();
        if (lastNode && lastNode.isConnected) {
          after.setStartAfter(lastNode);
          after.collapse(true);
        } else {
          after.selectNodeContents(element);
          after.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(after);
      }
    } catch {
      /* caret stays where the browser left it */
    }

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text || "",
      })
    );
  }
}

function selectBlank(span, sel, doc) {
  const range = doc.createRange();
  range.selectNodeContents(span);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Install, once per editable:
//   - Tab / Shift-Tab to cycle through remaining blank spans.
//   - On input, strip the dotted-underline placeholder styling from a
//     blank span once its content is no longer a pure "####" string, so
//     the user's typed text reads as normal styled text.
const HANDLERS_INSTALLED = new WeakSet();
const PLACEHOLDER_ONLY = /^#{3,}$/;

function installBlankHandlers(element) {
  if (HANDLERS_INSTALLED.has(element)) return;
  HANDLERS_INSTALLED.add(element);

  element.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const blanks = element.querySelectorAll("[data-ph]");
    if (!blanks.length) return;
    e.preventDefault();

    const doc = element.ownerDocument;
    const sel = doc.getSelection();
    const current = sel?.anchorNode?.parentElement?.closest("[data-ph]") || null;

    const list = Array.from(blanks);
    const idx = current ? list.indexOf(current) : -1;
    const dir = e.shiftKey ? -1 : 1;
    const next = list[(idx + dir + list.length) % list.length];
    if (next) selectBlank(next, sel, doc);
  });

  element.addEventListener("input", () => {
    for (const span of element.querySelectorAll("[data-ph]")) {
      const txt = span.textContent || "";
      if (PLACEHOLDER_ONLY.test(txt)) continue;
      // User has typed into this blank — drop the underline/padding but
      // keep any color/weight that was carrying the token's styling.
      const style = span.style;
      style.removeProperty("border-bottom");
      style.removeProperty("padding");
      span.removeAttribute("data-ph");
    }
  });
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || "";
}

// Walk text nodes under `root` counting characters until we hit `target`.
function resolveOffset(root, target) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let node = walker.nextNode();
  while (node) {
    const len = node.nodeValue.length;
    if (acc + len >= target) return { node, offset: target - acc };
    acc += len;
    node = walker.nextNode();
  }
  return null;
}
