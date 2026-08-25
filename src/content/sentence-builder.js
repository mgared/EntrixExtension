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
  // A field gated by `showWhen` contributes nothing while its condition is
  // unmet, even if a stale value is still sitting in the map. Without this a
  // template offering one optional segment per branch — a unit or a common
  // area, say — could render both at once.
  for (const fields of groups) {
    for (const f of fields || []) {
      if (f.showWhen && !isFieldVisible(f, out)) delete out[f.key];
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

function redHtml(s) {
  return `<b style="color:${RED}">${esc(s)}</b>`;
}

function hourLabel(h) {
  const ampm = h >= 12 ? "PM" : "AM";
  let hr = h % 12;
  if (hr === 0) hr = 12;
  return `${pad2(hr)}:00 ${ampm}`;
}

function formatDate(d = new Date()) {
  const yy = String(d.getFullYear()).slice(-2);
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${yy}`;
}

// Every hour the shift covers, inclusive of both ends. Walks forward one
// hour at a time so the overnight shift (23 → 7) wraps midnight correctly.
function shiftHours(shift) {
  if (!shift) return [];
  const out = [];
  let h = shift.start;
  for (let i = 0; i < 24; i++) {
    out.push(h);
    if (h === shift.end) break;
    h = (h + 1) % 24;
  }
  return out;
}

// Build the skeleton a concierge fills in over a whole shift: a header, one
// timestamped line per hour, and the standing note sections. The first and
// last hour lines carry the handover; the hours between are left blank on
// purpose, as slots to log into as the shift goes.
//
// The relieving concierge's name isn't known when the shift starts, so it
// renders as a #### blank the inserter can tab to later — same treatment
// any unfilled field gets.
export function buildShiftLog({
  site = "ORA",
  shift = null,
  sections = [],
  state = {},
}) {
  const name = String(state.name ?? "").trim();
  const prevName = String(state.prevName ?? "").trim();
  const keys = !!state.keys;

  const t = [];
  const h = [];
  const line = (text, html) => {
    t.push(text);
    h.push(html === undefined ? esc(text) : html);
  };

  // Names carry the blanks' red so the people on and off site stand out at
  // a glance in a log that is otherwise a wall of timestamps.
  const nameT = name || BLANK;
  const nameH = name ? redHtml(name) : blankHtml("name");
  const prevT = prevName || BLANK;
  const prevH = prevName ? redHtml(prevName) : blankHtml("prevName");
  const shiftT = shift?.value || BLANK;
  const shiftH = shift?.value ? esc(shift.value) : blankHtml("shift");
  const date = formatDate();

  line(
    `${site} | ${shiftT} | ${date} | ${nameT}`,
    `${esc(site)} | ${shiftH} | ${esc(date)} | ${nameH}`
  );
  line("");

  const hours = shiftHours(shift);
  hours.forEach((hr, i) => {
    const stamp = hourLabel(hr);
    const stampH = `<b>${esc(stamp)}</b>`;
    if (i === 0) {
      const tail = keys ? " Received concierge keys." : "";
      line(
        `${stamp}: (${nameT}) on site. (${prevT}) off site.${tail}`,
        `${stampH}: (${nameH}) on site. (${prevH}) off site.${esc(tail)}`
      );
    } else if (i === hours.length - 1) {
      const tail = keys ? " Handed over concierge keys." : "";
      line(
        `${stamp}: (${nameT}) off site. (${BLANK}) on site.${tail}`,
        `${stampH}: (${nameH}) off site. (${blankHtml("relief")}) on site.${esc(tail)}`
      );
    } else {
      line(`${stamp}:`, `${stampH}:`);
    }
    line("");
  });

  for (const s of sections) {
    line(s, `<b>${esc(s)}</b>`);
    line("");
    line("* ");
    line("");
  }

  while (t.length && t[t.length - 1] === "") {
    t.pop();
    h.pop();
  }

  return { html: h.join("<br>"), text: t.join("\n") };
}

// The keys still signed out, for the shift log's own section. An empty list
// is stated outright rather than left blank — "nothing outstanding" is a
// fact the next shift needs, and a blank line doesn't say it.
export function buildKeysOut(entries = []) {
  if (!entries.length) {
    const line = "No outstanding property keys documented.";
    return { html: esc(line), text: line };
  }

  const t = ["Keys remaining out:"];
  const h = ["<b>Keys remaining out:</b>"];
  for (const k of entries) {
    const unit = String(k.unit || "").trim();
    const holder = String(k.holder || "").trim();
    const kind = String(k.kind || "unit keys").trim();
    const since = k.at ? ` — out since ${formatTime(new Date(k.at))}` : "";

    const who = holder || BLANK;
    const whoH = holder ? esc(holder) : blankHtml("holder");
    const where = unit ? `unit (${unit})` : "the building";
    const whereH = unit ? `unit (<b>${esc(unit)}</b>)` : "the building";

    t.push(`* ${where} — ${kind} held by ${who}${since}`);
    h.push(`* ${whereH} — ${esc(kind)} held by ${whoH}${esc(since)}`);
  }
  return { html: h.join("<br>"), text: t.join("\n") };
}

// An inline chip appends to the entry the caret already sits on instead of
// starting a new line — how a key coming back is recorded against the entry
// that lent it out, rather than as a disconnected line further down.
export function buildInlineNote(line) {
  const trimmed = String(line ?? "").trim();
  const time = formatTime();
  return {
    html: ` ${esc(trimmed)} @ <b>${esc(time)}</b>.`,
    text: ` ${trimmed} @ ${time}.`,
  };
}

// Tint a built sentence so a reader scanning the log can spot it. Only the
// HTML form can carry a colour — a plain textarea has nowhere to put one,
// so the text form is returned untouched rather than faked with a marker.
export function applyHighlight({ html, text }, color) {
  if (!color) return { html, text };
  return {
    html: `<span style="background-color:${esc(color)}">${html}</span>`,
    text,
  };
}

// Quick-log chips bypass the role/reason form: they're a fixed sentence
// that just needs the standard time prefix added.
export function buildQuickLog(line) {
  const trimmed = String(line ?? "").trim();
  const time = formatTime();
  const text = `${time}: ${trimmed}`;
  // A bare stamp (no body text) leaves the separator space trailing, and
  // HTML collapses trailing whitespace — the caret would land flush against
  // the colon. A non-breaking space survives, so the line is ready to type
  // into. With body text the space is interior and needs no help.
  const gap = trimmed ? " " : "&nbsp;";
  const html = `<b>${esc(time)}</b>:${gap}${esc(trimmed)}`;
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
      const cleared = area.clear || "all clear";
      text.push(cleared);
      html.push(esc(cleared));
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
    html: `<b>${esc(time)}</b>: ${head}. ${htmlParts.join("; ")}${tail}`,
    text: `${time}: ${head}. ${textParts.join("; ")}${tail}`,
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
export function withLeadingLineBreak(sentence) {
  return {
    ...sentence,
    html: `<br>${sentence?.html ?? ""}`,
    text: `\n${sentence?.text ?? ""}`,
  };
}
