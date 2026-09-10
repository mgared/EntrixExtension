// Popup view — Role + per-role fields + Reason + per-reason fields, with
// a live preview of the sentence the controller will insert.
//
// State is split into:
//   roleId, reasonId           — which template we're rendering
//   values: { [key]: string }  — form input values, keyed by field.key
//
// Field defs come from HELPER (role.fields, reason.fields). The view is
// dumb about editables / carets / insertion: it just re-renders on
// change and reports submit / dismiss to the controller.

import { POPUP_STYLES } from "./popup-styles.js";
import {
  getRoles,
  getRole,
  getReason,
  getDefaultRoleId,
  getQuickLogs,
  getHighlights,
  getManualUrl,
  getSiteInfoUrl,
} from "../../config/form-schema.js";
import {
  buildSentence,
  buildQuickLog,
  buildInlineNote,
  buildSiteTour,
  buildShiftLog,
  buildItemsOut,
  buildShiftEnd,
  applyHighlight,
  withNote,
  isFieldVisible,
} from "../sentence-builder.js";
import {
  getShiftState,
  taskProgress,
  recordTask,
  startShift,
  endShift,
  clearItemOut,
} from "../shift-state.js";

const HOST_TAG = "apex-shift-log-helper-popup";

export function createPopupView() {
  const host = document.createElement(HOST_TAG);
  host.style.all = "initial";
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = POPUP_STYLES;
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "root";
  shadow.appendChild(root);

  let submitHandler = null;
  let dismissHandler = null;

  let roleId = "";
  let reasonId = "";
  let values = {};

  // Non-null while a quick-log chip's sub-form is open, which takes over
  // the popup entirely: { chip, state: { [areaId]: {clear, issue, people} } }
  let chipForm = null;

  // Ticked notify/incident flags, keyed by HIGHLIGHTS[].key. These sit
  // outside the role/reason model — they apply to whatever is about to be
  // inserted, in every popup mode.
  let flags = {};

  // What the notified team should expect or do. Appended to the copies
  // filed under the section headings, never to the timeline entry.
  let flagNote = "";

  // Keep the same input element across renders so the user's keystrokes
  // don't lose focus mid-typing. Re-rendered field defs swap into
  // pre-existing inputs by `data-key`, and stale inputs are removed.
  const inputCache = new Map(); // key -> { wrapper, input }

  // Stop key events from leaking to the host page. Without this, sites
  // like Gmail/Slack with single-letter shortcuts intercept the keys
  // before our inputs receive them — only chars that aren't bound (often
  // digits and "i") get through. Attach once at construction so render()
  // doesn't re-attach on every change.
  for (const type of ["keydown", "keyup", "keypress"]) {
    root.addEventListener(type, (e) => e.stopPropagation());
  }
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // Let Enter pass through inside text inputs so users can type
      // (mostly defensive — single-line inputs don't really care, but
      // we never want to accidentally submit while typing a name).
      const tag = e.target?.tagName;
      if (tag === "INPUT" && e.target.type === "text") return;
      e.preventDefault();
      if (chipForm || reasonId) {
        commitChipForm();
        submitHandler?.(buildCurrentSentence());
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      dismissHandler?.();
    }
  });

  function reset() {
    roleId = getDefaultRoleId();
    reasonId = "";
    values = {};
    chipForm = null;
    flags = {};
    flagNote = "";
    inputCache.clear();
    seedDefaults();
  }

  // The colour the ticked flags give the sentence. Only one background can
  // render, so the first flag listed in config wins when several are on.
  function activeHighlight() {
    return getHighlights().find((h) => flags[h.key])?.color || "";
  }

  // Unlike the colour, filing isn't limited to one flag — a note can belong
  // under several headings at once, so every ticked flag contributes.
  function activeSections() {
    return getHighlights()
      .filter((h) => flags[h.key] && h.section)
      .map((h) => h.section);
  }

  // Everything the popup submits carries the same flag-derived extras. The
  // timeline entry and the filed copy diverge here: only the copy gets the
  // note about what happens next.
  function decorate(sentence) {
    const color = activeHighlight();
    return {
      ...applyHighlight(sentence, color),
      sections: activeSections(),
      filing: applyHighlight(withNote(sentence, flagNote), color),
    };
  }

  // Role + reason fields that currently apply, honouring each field's
  // `showWhen` condition against the values entered so far.
  function currentFields() {
    const role = getRole(roleId);
    const reason = getReason(roleId, reasonId);
    return [...(role?.fields || []), ...(reason?.fields || [])].filter((f) =>
      isFieldVisible(f, values)
    );
  }

  function seedDefaults() {
    for (const f of currentFields()) {
      if (f.default !== undefined && values[f.key] === undefined) {
        values[f.key] = f.default;
      }
    }
  }

  // Drop values for fields no longer visible so a stale typed name
  // doesn't reappear after switching roles, reasons, or a `showWhen`
  // parent (e.g. moving the courier off "Other").
  function pruneStaleValues() {
    const visible = new Set(currentFields().map((f) => f.key));
    for (const k of Object.keys(values)) {
      if (!visible.has(k)) delete values[k];
    }
    for (const k of [...inputCache.keys()]) {
      if (!visible.has(k)) inputCache.delete(k);
    }
  }

  function render() {
    root.innerHTML = "";
    root.classList.toggle("wide", !!chipForm);
    if (chipForm) {
      renderChipForm();
      return;
    }

    const role = getRole(roleId);
    const reason = getReason(roleId, reasonId);

    const formRow = document.createElement("div");
    formRow.className = "row";
    formRow.appendChild(renderRoleSelect());
    for (const field of role?.fields || []) {
      if (!isFieldVisible(field, values)) continue;
      formRow.appendChild(renderField(field));
    }
    formRow.appendChild(renderReasonSelect());
    for (const field of reason?.fields || []) {
      if (!isFieldVisible(field, values)) continue;
      formRow.appendChild(renderField(field));
    }
    root.appendChild(formRow);

    renderPreview();

    const chips = getQuickLogs();
    renderChipGroup("Quick logs", chips.filter((c) => c.group !== "tasks"));
    renderChipGroup("Tasks", chips.filter((c) => c.group === "tasks"));

    renderActions(!!reasonId);
  }

  // Inserting a chip form is what makes it count: a tracked task ticks off,
  // and Begin shift starts the clock everything else is measured against.
  function commitChipForm() {
    if (!chipForm) return;
    const { chip, state } = chipForm;
    if (chip.task) recordTask(chip.task);
    if (chip.form?.kind === "itemsOut") {
      for (const [id, on] of Object.entries(state.returned || {})) {
        if (on) clearItemOut({ id });
      }
    }
    if (chip.form?.kind === "endShift") endShift();
    if (chip.form?.kind === "beginShift") {
      const shift = (chip.form.shifts || []).find(
        (x) => x.value === state.shift
      );
      startShift({ shift, name: state.name });
    }
  }

  function renderChipGroup(title, chips) {
    if (!chips.length) return;

    const label = document.createElement("div");
    label.className = "preview-label";
    label.textContent = title;
    root.appendChild(label);

    const row = document.createElement("div");
    row.className = "chips";
    for (const c of chips) row.appendChild(renderChip(c));
    root.appendChild(row);
  }

  function renderChip(c) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = c.form ? `${c.label}…` : c.label;
    chip.title = c.form
      ? "Opens a checklist"
      : c.inline
        ? "Appends to the line the caret is on"
        : c.kind === "itemsOut"
          ? "Lists what the desk still has out"
          : c.text;

    applyTaskProgress(chip, c);

    chip.addEventListener("click", (e) => {
      e.preventDefault();
      // A form chip counts once its form is inserted, not when it opens —
      // see the Insert handler. Plain chips insert on this click.
      if (c.form) return openChipForm(c);
      if (c.task) recordTask(c.task);
      if (c.kind === "itemsOut") {
        return submitHandler?.(
          decorate(buildItemsOut(getShiftState().itemsOut || []))
        );
      }
      if (c.inline) {
        return submitHandler?.({
          ...decorate(buildInlineNote(c.text)),
          inline: true,
        });
      }
      submitHandler?.(decorate(buildQuickLog(c.text)));
    });
    return chip;
  }

  // A tracked task fills with red as its deadline approaches and turns
  // solid once it passes. No shift running means no deadline to draw.
  function applyTaskProgress(chip, c) {
    if (!c.task) return;
    const p = taskProgress(c.task, {
      required: c.required,
      firstWindowMs: c.windowMinutes ? c.windowMinutes * 60000 : undefined,
    });
    if (!p) return;

    if (p.done) {
      chip.classList.add("chip-done");
      chip.textContent = `${chip.textContent} ✓`;
      chip.title = "Done for this shift";
      return;
    }

    const pct = Math.round(p.ratio * 100);
    chip.classList.add("chip-task");
    if (p.overdue) {
      chip.classList.add("chip-overdue");
      chip.title = `Overdue — ${p.remaining} still needed this shift`;
    } else {
      chip.style.background =
        `linear-gradient(to right, var(--task-fill) ${pct}%, var(--chip-bg) ${pct}%)`;
      chip.title = `${p.remaining} still needed this shift`;
    }
  }

  // A chip carrying a `form` takes the popup over: the role/reason picker
  // is replaced by that form's own controls until Back or Insert.
  function openChipForm(chip) {
    let state;
    if (chip.form.kind === "itemsOut") {
      // Snapshot what is out now; ticking one marks it returned on insert.
      state = { entries: getShiftState().itemsOut || [], returned: {} };
    } else if (chip.form.kind === "endShift") {
      state = { relief: "", keys: true };
    } else if (chip.form.kind === "beginShift") {
      state = {
        name: "",
        prevName: "",
        // Pre-pick the shift the clock is currently inside, since that is
        // almost always the one being started.
        shift: currentShiftValue(chip.form.shifts || []),
        keys: false,
      };
    } else {
      state = {};
      for (const area of chip.form.areas || []) {
        // Everything starts untouched. An area the walker never ticks stays
        // out of the sentence entirely, so the log can only ever claim what
        // was actually looked at.
        state[area.id] = { clear: false, status: "", issue: "", people: "" };
      }
    }
    chipForm = { chip, state };
    render();
    reposition();
  }

  // Shift ranges are start-inclusive / end-exclusive so the hour they meet
  // on (3pm ends one and starts the next) picks the shift beginning then.
  function currentShiftValue(shifts) {
    const h = new Date().getHours();
    const hit = shifts.find((s) =>
      s.start <= s.end
        ? h >= s.start && h < s.end
        : h >= s.start || h < s.end
    );
    return (hit || shifts[0])?.value || "";
  }

  function renderChipForm() {
    const { chip, state } = chipForm;

    const head = document.createElement("div");
    head.className = "form-head";

    const title = document.createElement("div");
    title.className = "form-title";
    title.textContent = chip.form.title || chip.label;
    head.appendChild(title);

    const back = document.createElement("button");
    back.type = "button";
    back.className = "secondary";
    back.textContent = "← Back";
    back.addEventListener("click", () => {
      chipForm = null;
      render();
      reposition();
    });
    head.appendChild(back);
    root.appendChild(head);

    if (chip.form.kind === "itemsOut") {
      root.appendChild(renderItemsOutForm(state));
    } else if (chip.form.kind === "endShift") {
      root.appendChild(renderEndShiftForm(state));
    } else if (chip.form.kind === "beginShift") {
      root.appendChild(renderShiftForm(chip.form, state));
    } else {
      const list = document.createElement("div");
      list.className = "tour";
      // A heading each time the floor changes, so the checklist reads in
      // the order the walk is actually done.
      let floor = null;
      for (const area of chip.form.areas || []) {
        if (area.floor && area.floor !== floor) {
          floor = area.floor;
          const head = document.createElement("div");
          head.className = "tour-floor";
          head.textContent = floor;
          list.appendChild(head);
        }
        list.appendChild(renderTourRow(area, state[area.id]));
      }
      root.appendChild(list);
    }

    renderPreview();
    renderActions(true);
  }

  function renderItemsOutForm(state) {
    const list = document.createElement("div");
    list.className = "tour";
    if (!state.entries.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "Nothing signed out.";
      list.appendChild(empty);
      return list;
    }
    for (const k of state.entries) {
      const row = document.createElement("div");
      row.className = "tour-row";

      const label = document.createElement("label");
      label.className = "check";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.dataset.key = k.id;
      box.checked = !!state.returned[k.id];
      box.addEventListener("change", () => {
        state.returned[k.id] = box.checked;
        updatePreview();
      });
      label.appendChild(box);
      label.appendChild(document.createTextNode("Returned"));
      row.appendChild(label);

      const who = document.createElement("div");
      who.className = "tour-issue";
      who.textContent = `${k.unit ? `unit (${k.unit})` : "the building"} — ${k.kind}${k.holder ? ` held by ${k.holder}` : ""}`;
      row.appendChild(who);
      list.appendChild(row);
    }
    return list;
  }

  function renderEndShiftForm(state) {
    const row = document.createElement("div");
    row.className = "row";

    const wrap = document.createElement("div");
    wrap.className = "field";
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = "Relieving concierge";
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.key = "relief";
    input.placeholder = "Coming on";
    input.value = state.relief;
    input.addEventListener("input", () => {
      state.relief = input.value;
      updatePreview();
    });
    wrap.appendChild(label);
    wrap.appendChild(input);
    row.appendChild(wrap);

    const keysWrap = document.createElement("div");
    keysWrap.className = "field";
    const keysLabel = document.createElement("label");
    keysLabel.className = "check";
    const keysBox = document.createElement("input");
    keysBox.type = "checkbox";
    keysBox.dataset.key = "keys";
    keysBox.checked = !!state.keys;
    keysBox.addEventListener("change", () => {
      state.keys = keysBox.checked;
      updatePreview();
    });
    keysLabel.appendChild(keysBox);
    keysLabel.appendChild(document.createTextNode("Concierge keys handed over"));
    keysWrap.appendChild(keysLabel);
    row.appendChild(keysWrap);
    return row;
  }

  function renderShiftForm(form, state) {
    const row = document.createElement("div");
    row.className = "row";

    const field = (labelText, control) => {
      const wrap = document.createElement("div");
      wrap.className = "field";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = labelText;
      wrap.appendChild(label);
      wrap.appendChild(control);
      row.appendChild(wrap);
    };

    const textBox = (key, placeholder) => {
      const input = document.createElement("input");
      input.type = "text";
      input.dataset.key = key;
      input.placeholder = placeholder;
      input.value = state[key];
      input.addEventListener("input", () => {
        state[key] = input.value;
        updatePreview();
      });
      return input;
    };

    field("Your name", textBox("name", "Coming on"));
    field("Off-going", textBox("prevName", "Going off"));

    const shiftSelect = document.createElement("select");
    shiftSelect.dataset.key = "shift";
    for (const s of form.shifts || []) {
      const o = document.createElement("option");
      o.value = s.value;
      o.textContent = s.value;
      shiftSelect.appendChild(o);
    }
    shiftSelect.value = state.shift;
    shiftSelect.addEventListener("change", () => {
      state.shift = shiftSelect.value;
      updatePreview();
    });
    field("Shift", shiftSelect);

    const keysWrap = document.createElement("div");
    keysWrap.className = "field";
    const keysLabel = document.createElement("label");
    keysLabel.className = "check";
    const keysBox = document.createElement("input");
    keysBox.type = "checkbox";
    keysBox.dataset.key = "keys";
    keysBox.checked = !!state.keys;
    keysBox.addEventListener("change", () => {
      state.keys = keysBox.checked;
      updatePreview();
    });
    keysLabel.appendChild(keysBox);
    keysLabel.appendChild(document.createTextNode("Concierge keys received"));
    keysWrap.appendChild(keysLabel);
    row.appendChild(keysWrap);

    return row;
  }

  function renderTourRow(area, s) {
    const row = document.createElement("div");
    row.className = "tour-row";

    const name = document.createElement("div");
    name.className = "tour-name";
    name.textContent = area.label;
    row.appendChild(name);

    // Most areas confirm themselves with a tick. An area whose picker
    // already covers every normal state (`tick: false`) has nothing left
    // for a tick to add, and having both produced "all clear, currently
    // in use" — so the column is held open empty and the picker speaks
    // for the row.
    let syncClear = () => {};
    if (area.tick === false) {
      const spacer = document.createElement("div");
      spacer.className = "check";
      row.appendChild(spacer);
    } else {
      const clearLabel = document.createElement("label");
      clearLabel.className = "check";
      const clear = document.createElement("input");
      clear.type = "checkbox";
      clear.checked = !!s.clear;
      clear.addEventListener("change", () => {
        s.clear = clear.checked;
        updatePreview();
      });
      clearLabel.appendChild(clear);
      // The box says exactly what ticking it will report, which for most
      // areas is "all clear" but for some is the specific thing being
      // confirmed: no guessing what a tick means.
      clearLabel.appendChild(document.createTextNode(area.clear || "all clear"));
      row.appendChild(clearLabel);

      // "All clear" and something to report contradict each other, so an
      // area can never carry both: typing a note unticks the box, and the
      // box stays disabled until the note is emptied again. Disabling it
      // rather than blanking the note means nothing typed is ever thrown
      // away to resolve the conflict.
      syncClear = () => {
        const reported = !!String(s.issue ?? "").trim();
        if (reported && s.clear) {
          s.clear = false;
          clear.checked = false;
        }
        clear.disabled = reported;
        clearLabel.classList.toggle("check-off", reported);
        clearLabel.title = reported
          ? "Empty the note to mark this area all clear"
          : "";
      };
    }

    // Areas with a fixed set of states (the coffee machines) get a picker
    // beside the tick. Every control on a row is additive — ticking,
    // picking a status and typing a note all end up in the sentence. Rows
    // without a picker leave no gap in its place; the issue box just runs
    // the full width instead.
    if (area.options?.length) {
      const status = document.createElement("select");
      status.className = "tour-status";
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "—";
      status.appendChild(blank);
      for (const opt of area.options) {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        status.appendChild(o);
      }
      status.value = s.status;
      status.addEventListener("change", () => {
        s.status = status.value;
        updatePreview();
      });
      row.appendChild(status);
    }

    const issue = document.createElement("input");
    issue.type = "text";
    issue.className = "tour-issue";
    issue.placeholder = "Something to report…";
    issue.value = s.issue;
    issue.addEventListener("input", () => {
      s.issue = issue.value;
      syncClear();
      updatePreview();
    });
    row.appendChild(issue);
    syncClear();

    if (area.people) {
      const people = document.createElement("input");
      people.type = "text";
      people.className = "tour-people";
      people.inputMode = "numeric";
      people.placeholder = "# ppl";
      people.value = s.people;
      people.addEventListener("input", () => {
        const digits = people.value.replace(/[^0-9]/g, "");
        if (people.value !== digits) people.value = digits;
        s.people = digits;
        updatePreview();
      });
      row.appendChild(people);
    }

    return row;
  }

  // Rendered by renderPreview() so the flags appear directly above the
  // preview in every mode — the role/reason form and any chip sub-form.
  function renderFlags() {
    const row = document.createElement("div");
    row.className = "flags";
    for (const h of getHighlights()) {
      const item = document.createElement("label");
      item.className = "check flag";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.dataset.flag = h.key;
      box.checked = !!flags[h.key];
      box.addEventListener("change", () => {
        flags[h.key] = box.checked;
        // The note field appears with the first tick and goes with the last,
        // so this needs a re-render rather than just a preview refresh.
        render();
        shadow.querySelector(`input[data-flag="${h.key}"]`)?.focus();
      });
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = h.color;
      item.appendChild(box);
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(h.label));
      row.appendChild(item);
    }
    root.appendChild(row);

    if (!activeSections().length) return;

    const wrap = document.createElement("div");
    wrap.className = "field field-wide";
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = "What should they expect or do?";
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.key = "flagNote";
    input.placeholder =
      "e.g. Maintenance follow-up should be confirmed with the resident.";
    input.value = flagNote;
    input.addEventListener("input", () => {
      flagNote = input.value;
      updatePreview();
    });
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent =
      "Added to the section notes below, not to the line at your cursor.";
    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(hint);
    root.appendChild(wrap);
  }

  function renderPreview() {
    renderFlags();

    const previewLabel = document.createElement("div");
    previewLabel.className = "preview-label";
    previewLabel.textContent = "Preview";
    root.appendChild(previewLabel);

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.innerHTML = buildCurrentSentence().html;
    root.appendChild(preview);
  }

  function renderActions(canInsert) {
    const actions = document.createElement("div");
    actions.className = "actions";

    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "Enter = Insert · Esc = Cancel";
    actions.appendChild(hint);

    // Two reference pages, for anyone who needs reminding what a chip does
    // or what the policy is. Each opens in its own tab so nothing typed
    // here is lost, and each is skipped where this build has no such page.
    // The group takes the auto margin the hint leaves, so the links sit
    // between the hint and the buttons rather than crowding them.
    const links = document.createElement("div");
    links.className = "links";
    // A bare path is one of the extension's own pages, so it works with no
    // account, no network and nothing hosted elsewhere. A full URL is left
    // alone, for a site that keeps its pages somewhere else.
    const resolve = (u) => {
      if (!u) return "";
      if (/^https?:\/\//i.test(u)) return u;
      try {
        return chrome.runtime.getURL(u);
      } catch {
        return "";
      }
    };

    for (const [label, url, tip] of [
      ["Guide", resolve(getManualUrl()), "How to use this. Opens in a new tab"],
      ["Site info", resolve(getSiteInfoUrl()), "The building and its policies. Opens in a new tab"],
    ]) {
      if (!url) continue;
      const link = document.createElement("button");
      link.className = "guide";
      link.textContent = label;
      link.title = tip;
      link.addEventListener("click", () => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
      links.appendChild(link);
    }
    if (links.children.length) actions.appendChild(links);

    const cancel = document.createElement("button");
    cancel.className = "secondary";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => dismissHandler?.());

    const insert = document.createElement("button");
    insert.className = "primary";
    insert.textContent = "Insert";
    insert.disabled = !canInsert;
    insert.addEventListener("click", () => {
      if (!canInsert) return;
      commitChipForm();
      submitHandler?.(buildCurrentSentence());
    });

    actions.appendChild(cancel);
    actions.appendChild(insert);
    root.appendChild(actions);
  }

  function renderRoleSelect() {
    const field = document.createElement("div");
    field.className = "field";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = "Role";
    field.appendChild(label);

    const select = document.createElement("select");
    select.dataset.key = "__roleId";
    for (const role of getRoles()) {
      const option = document.createElement("option");
      option.value = role.id;
      option.textContent = role.label;
      select.appendChild(option);
    }
    select.value = roleId || getDefaultRoleId();

    select.addEventListener("change", (e) => {
      roleId = e.target.value;
      reasonId = "";
      pruneStaleValues();
      seedDefaults();
      render();
      shadow.querySelector('select[data-key="__roleId"]')?.focus();
    });

    field.appendChild(select);
    return field;
  }

  function renderReasonSelect() {
    const field = document.createElement("div");
    field.className = "field";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = "Reason";
    field.appendChild(label);

    const select = document.createElement("select");
    select.dataset.key = "__reasonId";

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Select…";
    select.appendChild(blank);

    const role = getRole(roleId);
    for (const reason of role?.reasons || []) {
      const option = document.createElement("option");
      option.value = reason.id;
      option.textContent = reason.label;
      select.appendChild(option);
    }
    select.value = reasonId || "";

    select.addEventListener("change", (e) => {
      reasonId = e.target.value;
      pruneStaleValues();
      seedDefaults();
      render();
      shadow.querySelector('select[data-key="__reasonId"]')?.focus();
    });

    field.appendChild(select);
    return field;
  }

  function renderField(def) {
    const wrap = document.createElement("div");
    wrap.className = def.kind === "radio" ? "field field-wide" : "field";

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = def.label || def.key;
    wrap.appendChild(label);

    if (def.kind === "select") {
      wrap.appendChild(renderSelectInput(def));
    } else if (def.kind === "radio") {
      wrap.appendChild(renderRadioInput(def));
    } else if (def.kind === "date") {
      wrap.appendChild(renderDateInput(def));
    } else {
      wrap.appendChild(renderTextInput(def));
    }
    return wrap;
  }

  function renderSelectInput(def) {
    const select = document.createElement("select");
    select.dataset.key = def.key;
    if (def.optional || def.default === undefined) {
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = def.placeholder || "Select…";
      select.appendChild(blank);
    }
    for (const opt of def.options || []) {
      const option = document.createElement("option");
      const value = typeof opt === "string" ? opt : opt.value;
      const text = typeof opt === "string" ? opt : opt.label || opt.value;
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    }
    select.value = values[def.key] ?? def.default ?? "";
    select.addEventListener("change", (e) => {
      values[def.key] = e.target.value;
      // A select can gate a `showWhen` field, so re-check what still applies.
      pruneStaleValues();
      render();
      shadow.querySelector(`select[data-key="${def.key}"]`)?.focus();
    });
    return select;
  }

  function renderRadioInput(def) {
    const group = document.createElement("div");
    group.className = "radio-group";
    const groupName = `radio-${def.key}`;
    for (const opt of def.options || []) {
      const value = typeof opt === "string" ? opt : opt.value;
      const text = typeof opt === "string" ? opt : opt.label || opt.value;
      const item = document.createElement("label");
      item.className = "check";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = groupName;
      input.value = value;
      input.dataset.key = def.key;
      input.checked = (values[def.key] ?? def.default ?? "") === value;
      input.addEventListener("change", () => {
        if (input.checked) {
          values[def.key] = value;
          updatePreview();
        }
      });
      item.appendChild(input);
      item.appendChild(document.createTextNode(text));
      group.appendChild(item);
    }
    return group;
  }

  function renderDateInput(def) {
    const input = document.createElement("input");
    input.type = "date";
    input.dataset.key = def.key;
    input.value = values[def.key] ?? def.default ?? "";
    input.addEventListener("change", (e) => {
      values[def.key] = e.target.value;
      updatePreview();
    });
    return input;
  }

  function renderTextInput(def) {
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.key = def.key;
    input.placeholder = def.placeholder || "";
    input.value = values[def.key] ?? def.default ?? "";

    input.addEventListener("input", (e) => {
      values[def.key] = e.target.value;
      // Update only the preview, not the whole form, so focus + caret
      // position in the input stay put while typing.
      updatePreview();
    });
    return input;
  }

  function updatePreview() {
    const preview = shadow.querySelector(".preview");
    if (preview) preview.innerHTML = buildCurrentSentence().html;
  }

  function buildCurrentSentence() {
    if (chipForm) {
      const form = chipForm.chip.form;
      if (form.kind === "itemsOut") {
        const still = (chipForm.state.entries || []).filter(
          (k) => !chipForm.state.returned[k.id]
        );
        return decorate(buildItemsOut(still));
      }
      if (form.kind === "endShift") {
        return decorate(
          buildShiftEnd({
            name: getShiftState().shift?.name || "",
            relief: chipForm.state.relief,
            keys: chipForm.state.keys,
          })
        );
      }
      if (form.kind === "beginShift") {
        const shift =
          (form.shifts || []).find((s) => s.value === chipForm.state.shift) ||
          null;
        return decorate(
          buildShiftLog({
            site: form.site,
            shift,
            sections: form.sections,
            state: chipForm.state,
          })
        );
      }
      return decorate(
        buildSiteTour({ areas: form.areas || [], state: chipForm.state })
      );
    }
    const role = getRole(roleId);
    const reason = getReason(roleId, reasonId);
    return {
      ...decorate(buildSentence({ role, reason, values: { ...values } })),
      outEvent: outEventFor(reason),
    };
  }

  // Custody only moves when something actually changes hands. Where a reason
  // offers an outcome, only the ones that hand it over count — a refusal
  // leaves nothing outstanding. Where it offers none, doing it is the
  // handover: grabbing a dolly has no way to fail.
  function outEventFor(reason) {
    const t = reason?.tracksOut;
    if (!t) return null;
    const holder = [values.name, values.company].filter(Boolean).join(" from ");
    if (t.dir === "in") {
      return { dir: "in", unit: values.unit || "", holder, kind: t.kind };
    }
    const options = (reason.fields || []).flatMap((f) =>
      f.key === "outcome" ? f.options || [] : []
    );
    if (options.length) {
      const picked = options.find(
        (o) => typeof o === "object" && o.value === values.outcome
      );
      if (!picked?.issuesKeys) return null;
    }
    return { dir: "out", unit: values.unit || "", holder, kind: t.kind };
  }

  // Anchor the popup was opened at, kept so we can re-place it whenever the
  // content changes height — opening a chip's checklist can triple it, and
  // a stale position would push Insert off the bottom of the screen.
  let anchor = { x: 0, y: 0 };

  // Below the caret's line by preference, above it when there isn't room,
  // and — when neither side can hold it — on the roomier side with its own
  // height capped so it scrolls internally. Clamping the top and letting the
  // rest run off the bottom leaves the buttons unreachable, which is the one
  // outcome worth ruling out entirely.
  const MARGIN = 8;
  const MIN_HEIGHT = 140;

  function position(x, y, yTop = y) {
    // Clear any cap from a previous placement so the natural height is what
    // gets measured.
    root.style.maxHeight = "";
    root.style.overflowY = "";
    root.style.left = "0px";
    root.style.top = "0px";

    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    root.style.left = `${Math.min(
      Math.max(MARGIN, x),
      Math.max(MARGIN, vw - rect.width - MARGIN)
    )}px`;

    const below = vh - y - MARGIN;
    const above = yTop - MARGIN;

    if (rect.height <= below) {
      root.style.top = `${y}px`;
      return;
    }
    if (rect.height <= above) {
      root.style.top = `${yTop - rect.height}px`;
      return;
    }

    const useAbove = above > below;
    const room = Math.max(MIN_HEIGHT, useAbove ? above : below);
    root.style.maxHeight = `${room}px`;
    root.style.overflowY = "auto";
    root.style.top = `${Math.max(MARGIN, useAbove ? yTop - room : y)}px`;
  }

  function reposition() {
    requestAnimationFrame(() => position(anchor.x, anchor.y, anchor.yTop));
  }

  return {
    show({ x, y, yTop }) {
      reset();
      render();
      anchor = { x, y, yTop: yTop ?? y };
      document.documentElement.appendChild(host);
      requestAnimationFrame(() => {
        position(x, y, yTop ?? y);
        const first = shadow.querySelector("select, input, button");
        first?.focus();
      });
    },
    hide() {
      if (host.isConnected) host.remove();
    },
    isOpen() {
      return host.isConnected;
    },
    contains(node) {
      return host.contains(node);
    },
    onSubmit(fn) {
      submitHandler = fn;
    },
    onDismiss(fn) {
      dismissHandler = fn;
    },
  };
}
