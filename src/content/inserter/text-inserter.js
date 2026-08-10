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

// File a copy of the sentence as a bullet under a named heading elsewhere
// in the same editable — the shift log's standing note sections.
//
// The newest note goes directly under its heading, pushing older ones down.
// That only needs the heading itself to be found — never where the section
// ends — so a note can't be stranded at the bottom of the document when the
// editor's markup doesn't split into lines the way we'd guess.
//
// Returns false when the heading isn't in the document, which is the normal
// case for any editable that doesn't hold a shift log. Callers treat that
// as a no-op: a flag still tints the sentence, it just has nowhere to file.
export function appendUnderHeading(element, heading, { html, text }) {
  const kind = getEditableKind(element);
  if (kind === "input" || kind === "textarea") {
    return fileIntoPlain(element, heading, text || stripHtml(html || ""));
  }
  if (kind === "contenteditable") {
    return fileIntoRich(element, heading, html || "", text || "");
  }
  return false;
}

const EMPTY_BULLET = /^\*\s*$/;

function sameHeading(line, heading) {
  return String(line).trim().toUpperCase() === String(heading).trim().toUpperCase();
}

function lineOfOffset(value, offset) {
  let line = 0;
  for (let i = 0; i < offset && i < value.length; i++) {
    if (value[i] === "\n") line++;
  }
  return line;
}

function fileIntoPlain(element, heading, sentence) {
  const before = element.value;
  const lines = before.split("\n");
  const start = lines.findIndex((l) => sameHeading(l, heading));
  if (start === -1) return false;

  // Skip the blank line the log leaves under each heading, so notes stack
  // directly beneath the title rather than above that gap.
  let at = start + 1;
  while (at < lines.length && !lines[at].trim()) at++;

  const bullet = `* ${sentence}`;
  if (at < lines.length && EMPTY_BULLET.test(lines[at].trim())) {
    // A section still holding its seeded empty bullet gets filled rather
    // than grown, so the first note doesn't strand a bare "*" above it.
    lines[at] = bullet;
  } else {
    lines.splice(at, 0, bullet);
  }

  const selStart = element.selectionStart;
  const selEnd = element.selectionEnd;
  const caretLine = lineOfOffset(before, selStart);
  const after = lines.join("\n");
  element.value = after;

  // Filing usually happens below the caret and leaves it alone, but a
  // section above the caret shifts every offset after it.
  const shift = at <= caretLine ? after.length - before.length : 0;
  element.setSelectionRange(selStart + shift, selEnd + shift);
  fireInput(element, sentence);
  return true;
}

function fileIntoRich(element, heading, html, text) {
  const doc = element.ownerDocument;
  const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);

  const start = nodes.findIndex((n) => sameHeading(n.nodeValue, heading));
  if (start === -1) return false;

  // First thing with content under the heading — the note already filed
  // there, the seeded empty bullet, or whatever follows an empty section.
  let next = null;
  for (let i = start + 1; i < nodes.length; i++) {
    if (nodes[i].nodeValue.trim()) {
      next = nodes[i];
      break;
    }
  }

  // A filed note leads with its own "* " text node, which on its own is
  // indistinguishable from the seeded empty bullet — without the marker,
  // the next note would replace the last one instead of stacking above it.
  if (
    next &&
    !inFiledNote(next) &&
    EMPTY_BULLET.test(next.nodeValue.trim()) &&
    next.parentNode
  ) {
    next.parentNode.replaceChild(fragmentFrom(doc, noteHtml(html)), next);
    fireInput(element, text);
    return true;
  }

  // Land the bullet on its own line above whatever is there now. Anchoring
  // on the top-level node keeps it outside any <b> the heading or an
  // existing note happens to sit inside.
  const anchor = next && topLevelOf(next, element);
  if (anchor) {
    anchor.parentNode.insertBefore(
      fragmentFrom(doc, `${noteHtml(html)}<br>`),
      anchor
    );
    fireInput(element, text);
    return true;
  }

  // Nothing follows the heading at all — hang the note straight off it.
  const head = topLevelOf(nodes[start], element);
  if (!head) return false;
  head.parentNode.insertBefore(
    fragmentFrom(doc, `<br>${noteHtml(html)}`),
    head.nextSibling
  );
  fireInput(element, text);
  return true;
}

const NOTE_MARK = "data-filed-note";

function noteHtml(html) {
  return `<span ${NOTE_MARK}>* ${html}</span>`;
}

function inFiledNote(node) {
  return !!node.parentElement?.closest(`[${NOTE_MARK}]`);
}

function fragmentFrom(doc, html) {
  const template = doc.createElement("template");
  template.innerHTML = html;
  return template.content.cloneNode(true);
}

function topLevelOf(node, root) {
  let n = node;
  while (n && n.parentNode && n.parentNode !== root) n = n.parentNode;
  return n && n.parentNode === root ? n : null;
}

function fireInput(element, data) {
  element.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: data || "",
    })
  );
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
