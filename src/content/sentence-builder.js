// Render a reason's template into HTML + plain text, substituting form
// values for `{key}` placeholders and dropping `[...]` optional segments
// whose referenced fields are empty.
//
// Empty required fields render as a red-bold dotted-underline span (HTML)
// or a literal `####` (plain text), so the inserter's tab-cycling and
// in-place edit behavior keeps working when the popup is bypassed (the
// `;re1`-style shorthand path passes no form values, only role-level
// defaults).
//
// HTML emphasis applied to filled values:
//   - `{time}` (the auto-prepended log time) is bolded.
//   - `{unit}` is bolded.
//   - `{name}` is bolded for the resident role and underlined for every
//     other (visitor) role.
//   - `{residentName}` is bolded (always names a resident).
//   - `{guestName}` is underlined (it's always a visitor name).
//   - role labels (Resident, Guest, …) render as plain text.

const RED = "#ff4d4f";
const BLANK = "####";

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function blankHtml(key) {
  return `<span data-ph="${esc(key)}" style="color:${RED};font-weight:bold;border-bottom:1px dotted #888;padding:0 2px">${BLANK}</span>`;
}

function isEmpty(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

// One pass over the template: optional [...] segment, {key} placeholder,
// or literal text. Brackets/placeholders are not nested in our templates.
const TOKEN_RE = /\[([^\]]*)\]|\{(\w+)\}|([^[{]+)/g;
const PLACEHOLDER_RE = /\{(\w+)\}/g;

function renderTemplate(template, values, mode, wrap) {
  const re = new RegExp(TOKEN_RE.source, "g");
  let out = "";
  let m;
  while ((m = re.exec(template)) !== null) {
    if (m[1] !== undefined) {
      const inner = m[1];
      const refs = [...inner.matchAll(PLACEHOLDER_RE)].map((x) => x[1]);
      if (refs.every((k) => !isEmpty(values[k]))) {
        out += renderTemplate(inner, values, mode, wrap);
      }
      continue;
    }
    if (m[2] !== undefined) {
      const key = m[2];
      const v = values[key];
      if (!isEmpty(v)) {
        const trimmed = String(v).trim();
        out +=
          mode === "html"
            ? wrap
              ? wrap(key, esc(trimmed))
              : esc(trimmed)
            : trimmed;
      } else {
        out += mode === "html" ? blankHtml(key) : BLANK;
      }
      continue;
    }
    if (m[3] !== undefined) {
      out += mode === "html" ? esc(m[3]) : m[3];
    }
  }
  return out;
}

function valueWrapper(role) {
  const isResident = role?.id === "resident";
  return (key, htmlValue) => {
    if (key === "time") return `<b>${htmlValue}</b>`;
    if (key === "unit") return `<b>${htmlValue}</b>`;
    if (key === "residentName") return `<b>${htmlValue}</b>`;
    if (key === "name") {
      return isResident ? `<b>${htmlValue}</b>` : `<u>${htmlValue}</u>`;
    }
    if (key === "guestName") return `<u>${htmlValue}</u>`;
    return htmlValue;
  };
}

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTime(d = new Date()) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${pad2(h)}:${pad2(m)}${ampm}`;
}

// Pull defaults from role + reason field definitions onto the value map
// so the shorthand path (which passes no form input) still picks up the
// contact dropdown's default and any other defaulted selects.
function applyDefaults({ role, reason }, values) {
  const out = { ...values };
  const groups = [role?.fields, reason?.fields];
  for (const fields of groups) {
    for (const f of fields || []) {
      if (f.default !== undefined && isEmpty(out[f.key])) {
        out[f.key] = f.default;
      }
    }
  }
  return out;
}

// Quick-log chips bypass the role/reason form: they're a fixed sentence
// that just needs the standard time prefix added.
export function buildQuickLog(line) {
  const trimmed = String(line ?? "").trim();
  const time = formatTime();
  const text = `${time}: ${trimmed}`;
  const html = `<b>${esc(time)}</b>: ${esc(trimmed)}`;
  return { html, text };
}

export function buildSentence({ role, reason, values = {} }) {
  const baseTemplate = reason?.template || "";

  if (!baseTemplate) {
    const label = role?.label || "";
    const placeholder = label ? `${label} — pick a reason…` : "Pick a role…";
    return { html: esc(placeholder), text: placeholder };
  }

  // Every log starts with a current-time prefix ("HH:MMAM: …"). The
  // builder owns this so individual templates don't have to repeat it,
  // and both the popup and shorthand paths get a consistent prefix.
  const template = `{time}: ${baseTemplate}`;

  const filled = applyDefaults({ role, reason }, values);
  if (isEmpty(filled.time)) filled.time = formatTime();

  const text = renderTemplate(template, filled, "text");
  const html = renderTemplate(template, filled, "html", valueWrapper(role));

  return { html, text };
}

// Each insertion starts on its own line, so logs stack vertically instead
// of running into prior content. Both popup and shorthand paths wrap their
// outgoing sentence with this before handing it to the inserter.
export function withLeadingLineBreak({ html, text }) {
  return {
    html: `<br>${html ?? ""}`,
    text: `\n${text ?? ""}`,
  };
}
