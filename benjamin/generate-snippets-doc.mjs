// Generate SNIPPETS.md — every role/reason with both its empty-blank
// output and a sample filled output, so the templates can be reviewed
// without opening the popup.
//
// Run with: node extension/generate-snippets-doc.mjs
// Writes:   extension/SNIPPETS.md

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { HELPER } from "./src/config/franklin-helper.js";
import { buildSentence } from "./src/content/sentence-builder.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "SNIPPETS.md");

// Sample values used to render the "filled" example for every field that
// might appear in any role/reason. Keep these stable so the doc diffs
// only when templates actually change.
const SAMPLE = {
  time: "10:00 AM",
  name: "John",
  unit: "234",
  recipient: "Helen",
  description: "their kitchen sink is leaking",
  date: "2026-05-02",
  subject: "a maintenance follow-up",
  item: "a rent check",
  staff: "Sarah",
  deliveredDate: "2026-04-25",
  guestName: "Marcus",
  residentName: "Marry",
  // contact comes from each role's default ("came to the front desk").
  // select/radio sample values come from each field's first option.
};

function firstOption(field) {
  const opts = field.options || [];
  if (!opts.length) return undefined;
  const first = opts[0];
  return typeof first === "string" ? first : first.value;
}

// For select/radio fields, prefer the first option of *this* field so each
// reason renders with a value that fits its own template — different reasons
// can share a key like `outcome` with different option lists. Text/date
// fields fall back to SAMPLE.
function fillForReason(role, reason) {
  const out = {};
  for (const f of [...(role.fields || []), ...(reason.fields || [])]) {
    if (f.kind === "select" || f.kind === "radio") {
      const v = firstOption(f) ?? SAMPLE[f.key];
      if (v !== undefined) out[f.key] = v;
    } else if (SAMPLE[f.key] !== undefined) {
      out[f.key] = SAMPLE[f.key];
    }
  }
  return out;
}

const lines = [];
const push = (s = "") => lines.push(s);

push("# Phrase Snippets — Scenario Reference");
push("");
push("Every reason, plus a filled example showing the");
push("`;;` popup output when the form fields are typed in. Regenerate:");
push("");
push("```");
push("node extension/generate-snippets-doc.mjs");
push("```");
push("");
push(
  "`####` marks a required field the user still has to fill in (red-bold " +
    "in the rich-text version, tab-cycled). Optional fields wrapped in " +
    "`[…]` in the template (e.g. the resident name) drop out cleanly when " +
    "left blank — see each \"Empty\" line."
);
push("");
push(
  "Every log is auto-prefixed with the current clock time, e.g. " +
    "`10:00 AM: Resident…`. The doc pins it to `10:00 AM` for stable diffs."
);
push("");
push(
  "Sample values used in the \"Filled\" line for text/date fields: " +
    "name=`John`, unit=`234`, recipient=`Helen`, " +
    "description=`their kitchen sink is leaking`, date=`2026-05-02`, " +
    "subject=`a maintenance follow-up`, item=`a rent check`, staff=`Sarah`, " +
    "deliveredDate=`2026-04-25`, guestName=`Marcus`. Select/radio fields " +
    "use the first option of each field."
);
push("");

const roles = HELPER.roles || [];

push("## Roles at a glance");
push("");
for (const role of roles) {
  const fieldKeys = (role.fields || []).map((f) => f.key).join(", ") || "—";
  push(
    `- ${role.label} (${
      (role.reasons || []).length
    } reasons; role fields: ${fieldKeys})`
  );
}
push("");

for (const role of roles) {
  push(`## ${role.label}`);
  push("");

  const reasons = role.reasons || [];
  if (!reasons.length) {
    push("_No reasons defined for this role._");
    push("");
    continue;
  }

  for (let i = 0; i < reasons.length; i++) {
    const reason = reasons[i];
    // Pin time so the doc doesn't churn each regen — buildSentence would
    // otherwise auto-fill {time} with the current clock time.
    const empty = buildSentence({
      role,
      reason,
      values: { time: SAMPLE.time },
    }).text;
    const filled = buildSentence({
      role,
      reason,
      values: { time: SAMPLE.time, ...fillForReason(role, reason) },
    }).text;

    push(`### ${reason.label}`);
    push("");
    push(`- **Empty:** ${empty}`);
    push(`- **Filled:** ${filled}`);
    push("");
  }
}

fs.writeFileSync(OUT_PATH, lines.join("\n") + "\n");

const size = fs.statSync(OUT_PATH).size;
console.log(`Wrote ${OUT_PATH} (${size} bytes, ${lines.length} lines)`);
