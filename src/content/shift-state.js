// What has actually been done since the shift began: which recurring tasks
// have been ticked off, and what the desk has lent out and not got back.
//
// Held in chrome.storage.local so it survives reloads and is shared across
// tabs, but the popup reads it through an in-memory mirror — rendering a
// chip cannot wait on an async round trip. Writes update the mirror first
// and persist after; a storage listener keeps other tabs' mirrors in step.

// Exported so the background worker can read the same record without
// standing up the content script's mirror.
export const STATE_KEY = "shiftState";
const KEY = STATE_KEY;

const EMPTY = { shift: null, tasks: {}, itemsOut: [] };

// Defaults for a tracked task, overridable per chip: reading the previous
// shift's notes is one job in the first hour, while walking the site is
// twice across the shift.
const DEFAULT_REQUIRED = 2;
const DEFAULT_FIRST_WINDOW_MS = 2 * 60 * 60 * 1000;

// Every window after the first has to close before the shift's own closing
// hour, so nothing is left to land in the handover.
const END_BUFFER_MS = 60 * 60 * 1000;

let state = { ...EMPTY };

export function initShiftState() {
  try {
    chrome.storage.local.get(KEY, (got) => {
      state = migrate({ ...EMPTY, ...(got?.[KEY] || {}) });
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[KEY]) return;
      state = migrate({ ...EMPTY, ...(changes[KEY].newValue || {}) });
    });
  } catch {
    // Storage unavailable — the mirror still works for this page's lifetime.
  }
}

// The list was keys-only before dollies joined it; a shift already in
// progress when the extension updates shouldn't lose what it had out.
function migrate(next) {
  if (next.keysOut?.length && !next.itemsOut?.length) {
    return { ...next, itemsOut: next.keysOut, keysOut: undefined };
  }
  return next;
}

export function getShiftState() {
  return state;
}

function persist() {
  try {
    chrome.storage.local.set({ [KEY]: state });
  } catch {
    /* keep the mirror even if it can't be written */
  }
}

// The clock a shift's deadlines are measured against. Uses the shift's own
// end hour rather than a duration, and rolls to tomorrow for the overnight
// shift, whose end hour is earlier than its start.
export function shiftEndTimestamp(shift, startedAt) {
  const end = new Date(startedAt);
  end.setHours(shift.end, 0, 0, 0);
  if (end.getTime() <= startedAt) end.setDate(end.getDate() + 1);
  return end.getTime();
}

// Beginning a shift wipes everything: a new concierge inherits no ticked
// tasks and no key list from the last one.
export function startShift({ shift, name }) {
  const startedAt = Date.now();
  state = {
    shift: {
      value: shift?.value || "",
      name: name || "",
      startedAt,
      endsAt: shift ? shiftEndTimestamp(shift, startedAt) : null,
    },
    tasks: {},
    itemsOut: [],
  };
  persist();
}

// Closing the shift stops the deadlines without wiping the record — what is
// still out is exactly what the handover needs to report.
export function endShift() {
  if (!state.shift) return;
  state = { ...state, shift: { ...state.shift, endedAt: Date.now() } };
  persist();
}

export function recordTask(taskId) {
  if (!taskId) return;
  const clicks = state.tasks[taskId]?.clicks || [];
  state = {
    ...state,
    tasks: { ...state.tasks, [taskId]: { clicks: [...clicks, Date.now()] } },
  };
  persist();
}

// The deadline maths, with the record passed in. The background worker has
// no mirror to read — it wakes, loads storage, and asks directly.
//
// null when no shift is running: the caller draws no bar and raises no
// alarm rather than inventing a deadline it has no basis for.
export function taskProgressFrom(record, taskId, opts = {}, now = Date.now()) {
  const required = opts.required || DEFAULT_REQUIRED;
  const firstWindowMs = opts.firstWindowMs || DEFAULT_FIRST_WINDOW_MS;

  const state = record || EMPTY;
  const shift = state.shift;
  if (!shift || !shift.endsAt || shift.endedAt) return null;

  const clicks = state.tasks[taskId]?.clicks || [];
  if (clicks.length >= required) {
    return { done: true, ratio: 1, overdue: false, remaining: 0 };
  }

  const first = clicks.length === 0;
  const windowStart = first ? shift.startedAt : clicks[clicks.length - 1];
  const windowEnd = first
    ? shift.startedAt + firstWindowMs
    : shift.endsAt - END_BUFFER_MS;

  const span = Math.max(1, windowEnd - windowStart);
  const ratio = Math.min(1, Math.max(0, (now - windowStart) / span));
  return {
    done: false,
    ratio,
    overdue: now >= windowEnd,
    remaining: required - clicks.length,
    windowEnd,
    // Which deadline this is — the worker uses it to notify once per
    // window rather than once per check.
    window: clicks.length,
  };
}

export function taskProgress(taskId, opts, now) {
  return taskProgressFrom(state, taskId, opts, now);
}

let outSeq = 0;

export function addItemOut({ unit, holder, kind }) {
  const at = Date.now();
  const entry = {
    // Vendors working on shared parts of the building have no unit, so an
    // id is the only thing that reliably identifies one lent-out item.
    id: `o${at}-${outSeq++}`,
    unit: unit || "",
    holder: holder || "",
    kind: kind || "unit keys",
    at,
  };
  // The same thing lent to the same unit and holder replaces the earlier
  // entry rather than listing it twice.
  const rest = state.itemsOut.filter(
    (k) =>
      !(k.unit === entry.unit && k.holder === entry.holder && k.kind === entry.kind)
  );
  state = { ...state, itemsOut: [...rest, entry] };
  persist();
}

// Matched by id where the caller has one, otherwise by unit (narrowed by
// kind when given), otherwise by holder. An empty unit is never a match:
// treating it as one meant returning one common-area vendor's keys cleared
// every other vendor too.
export function clearItemOut({ id, unit, holder, kind } = {}) {
  const before = state.itemsOut.length;
  const kindOk = (k) => !kind || k.kind === kind;
  let itemsOut;
  if (id) itemsOut = state.itemsOut.filter((k) => k.id !== id);
  else if (String(unit || "").trim())
    itemsOut = state.itemsOut.filter((k) => !(k.unit === unit && kindOk(k)));
  else if (String(holder || "").trim())
    itemsOut = state.itemsOut.filter((k) => !(k.holder === holder && kindOk(k)));
  else return false;

  if (itemsOut.length === before) return false;
  state = { ...state, itemsOut };
  persist();
  return true;
}
