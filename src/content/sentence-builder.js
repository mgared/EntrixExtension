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
  return `${pad2(h)}:${pad2(m)} ${ampm}`;
}

// A field with `showWhen: { key, value }` only applies while another field
// holds a given value — e.g. the free-text courier box that appears only
// once "Other" is picked. Shared with the popup so the form and the
// rendered sentence agree on which fields count.
export function isFieldVisible(field, values) {
  const cond = field?.showWhen;
  if (!cond) return true;
  return String(values?.[cond.key] ?? "") === String(cond.value);
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
  // `replaces: "otherKey"` hands this field's value to another key once it
  // is both visible and filled, so templates reference only the one key.
  // Visible-but-empty deliberately blanks the target, turning the sentinel
  // option ("Other") into a #### the user still has to fill.
  for (const fields of groups) {
    for (const f of fields || []) {
      if (!f.replaces || !isFieldVisible(f, out)) continue;
      out[f.replaces] = isEmpty(out[f.key]) ? "" : out[f.key];
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

// Render an interactive site-tour chip as one flowing sentence. Every
// control the walker actually used contributes a clause: the "all clear"
// tick, the status picker some areas carry, and the free-text issue box
// all combine rather than override one another. An area nobody touched
// contributes nothing and stays out of the sentence entirely, so the log
// only ever claims what was really looked at. Areas flagged `people: true`
// also carry an occupancy count.
//
// Areas are separated by semicolons because an area's own clauses are
// comma-separated — commas alone could not tell the two levels apart.
export function buildSiteTour({ areas = [], state = {} }) {
  const time = formatTime();
  const textParts = [];
  const htmlParts = [];

  for (const area of areas) {
    const s = state[area.id] || {};
    const issue = String(s.issue ?? "").trim();
    const status = String(s.status ?? "").trim();
    const people = String(s.people ?? "").trim();

    const count =
      area.people && people
        ? people === "1"
          ? "1 person"
          : `${people} people`
        : "";

    const text = [];
    const html = [];
    if (s.clear) {
      text.push("all clear");
      html.push("all clear");
    }
    if (status) {
      text.push(status);
      html.push(esc(status));
    }
    if (issue) {
      text.push(issue);
      html.push(`<b>${esc(issue)}</b>`);
    }

    // An occupancy count on its own still counts as having walked the area.
    if (!text.length) {
      if (!count) continue;
      textParts.push(`${area.label}: ${count}`);
      htmlParts.push(`${esc(area.label)}: ${esc(count)}`);
      continue;
    }

    let t = text.join(", ");
    let h = html.join(", ");
    if (count) {
      t += ` (${count})`;
      h += ` (${esc(count)})`;
    }

    textParts.push(`${area.label}: ${t}`);
    htmlParts.push(`${esc(area.label)}: ${h}`);
  }

  const head = "Site tour completed";
  if (!textParts.length) {
    return { html: `<b>${esc(time)}</b>: ${head}.`, text: `${time}: ${head}.` };
  }

  // A typed issue may already end in punctuation — don't double it up.
  const tail = /[.!?]$/.test(textParts[textParts.length - 1]) ? "" : ".";

  return {
    html: `<b>${esc(time)}</b>: ${head} — ${htmlParts.join("; ")}${tail}`,
    text: `${time}: ${head} — ${textParts.join("; ")}${tail}`,
  };
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
