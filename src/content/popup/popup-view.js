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
} from "../../config/form-schema.js";
import { buildSentence, buildQuickLog } from "../sentence-builder.js";

const HOST_TAG = "phrase-snippets-popup";

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
      if (reasonId) submitHandler?.(buildCurrentSentence());
    } else if (e.key === "Escape") {
      e.preventDefault();
      dismissHandler?.();
    }
  });

  function reset() {
    roleId = getDefaultRoleId();
    reasonId = "";
    values = {};
    inputCache.clear();
    seedDefaults();
  }

  function seedDefaults() {
    const role = getRole(roleId);
    const reason = getReason(roleId, reasonId);
    for (const f of [...(role?.fields || []), ...(reason?.fields || [])]) {
      if (f.default !== undefined && values[f.key] === undefined) {
        values[f.key] = f.default;
      }
    }
  }

  // Drop values for fields no longer visible so a stale typed name
  // doesn't reappear after switching roles or reasons.
  function pruneStaleValues() {
    const role = getRole(roleId);
    const reason = getReason(roleId, reasonId);
    const visible = new Set(
      [...(role?.fields || []), ...(reason?.fields || [])].map((f) => f.key)
    );
    for (const k of Object.keys(values)) {
      if (!visible.has(k)) delete values[k];
    }
    for (const k of [...inputCache.keys()]) {
      if (!visible.has(k)) inputCache.delete(k);
    }
  }

  function render() {
    root.innerHTML = "";

    const role = getRole(roleId);
    const reason = getReason(roleId, reasonId);

    const formRow = document.createElement("div");
    formRow.className = "row";
    formRow.appendChild(renderRoleSelect());
    for (const field of role?.fields || []) {
      formRow.appendChild(renderField(field));
    }
    formRow.appendChild(renderReasonSelect());
    for (const field of reason?.fields || []) {
      formRow.appendChild(renderField(field));
    }
    root.appendChild(formRow);

    const previewLabel = document.createElement("div");
    previewLabel.className = "preview-label";
    previewLabel.textContent = "Preview";
    root.appendChild(previewLabel);

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.innerHTML = buildCurrentSentence().html;
    root.appendChild(preview);

    const chips = getQuickLogs();
    if (chips.length) {
      const chipsLabel = document.createElement("div");
      chipsLabel.className = "preview-label";
      chipsLabel.textContent = "Quick logs";
      root.appendChild(chipsLabel);

      const chipsRow = document.createElement("div");
      chipsRow.className = "chips";
      for (const c of chips) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = c.label;
        chip.title = c.text;
        chip.addEventListener("click", (e) => {
          e.preventDefault();
          submitHandler?.(buildQuickLog(c.text));
        });
        chipsRow.appendChild(chip);
      }
      root.appendChild(chipsRow);
    }

    const actions = document.createElement("div");
    actions.className = "actions";
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "Enter = Insert · Esc = Cancel";
    actions.appendChild(hint);

    const cancel = document.createElement("button");
    cancel.className = "secondary";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => dismissHandler?.());

    const insert = document.createElement("button");
    insert.className = "primary";
    insert.textContent = "Insert";
    insert.disabled = !reasonId;
    insert.addEventListener("click", () => {
      if (!reasonId) return;
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
    const role = getRole(roleId);
    const reason = getReason(roleId, reasonId);
    return buildSentence({ role, reason, values: { ...values } });
  }

  function position(x, y) {
    const margin = 8;
    root.style.left = "0px";
    root.style.top = "0px";
    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(margin, x), vw - rect.width - margin);
    let top = y;
    if (top + rect.height + margin > vh) top = y - rect.height - margin;
    root.style.left = `${left}px`;
    root.style.top = `${Math.max(margin, top)}px`;
  }

  return {
    show({ x, y }) {
      reset();
      render();
      document.documentElement.appendChild(host);
      requestAnimationFrame(() => {
        position(x, y);
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
