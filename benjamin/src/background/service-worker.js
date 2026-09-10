// Background worker (MV3) — watches the clock so overdue shift tasks get
// noticed without the popup being open.
//
// Nothing else in the extension runs on a timer: task deadlines are worked
// out when a chip is drawn, which means a closed popup sees nothing. An MV3
// worker is terminated after a short idle, so setInterval is no use either;
// chrome.alarms is the one thing that wakes it back up.
//
// Two signals, deliberately different in character:
//   - the toolbar badge, which persists until the task is done and cannot
//     be swallowed by an operating-system Do Not Disturb;
//   - a notification, which interrupts once when a deadline passes and
//     again periodically, for the case where the badge goes unlooked-at.

import { QUICK_LOGS } from "../config/franklin-helper.js";
import { STATE_KEY, taskProgressFrom } from "../content/shift-state.js";

const ALARM = "shiftTaskCheck";

// Chrome's floor for a packed extension is one minute, which is ample for
// deadlines measured in hours.
const CHECK_MINUTES = 1;

// How long before an already-overdue task interrupts again. Once and never
// again is too easy to dismiss and forget; every minute would be noise.
const RENAG_MS = 30 * 60 * 1000;

const trackedTasks = () =>
  QUICK_LOGS.filter((c) => c.task).map((c) => ({
    id: c.task,
    label: c.label,
    opts: {
      required: c.required,
      firstWindowMs: c.windowMinutes ? c.windowMinutes * 60000 : undefined,
    },
  }));

function readState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STATE_KEY, (got) => resolve(got?.[STATE_KEY] || null));
  });
}

function writeState(next) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STATE_KEY]: next }, resolve);
  });
}

async function setBadge(count) {
  try {
    await chrome.action.setBadgeText({ text: count ? String(count) : "" });
    await chrome.action.setBadgeBackgroundColor({ color: "#ff4d4f" });
  } catch {
    /* no action surface (e.g. during teardown) — the notification still ran */
  }
}

function notify(taskId, label, remaining) {
  try {
    chrome.notifications.create(`task-${taskId}-${Date.now()}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: "Shift task overdue",
      message: `${label}: ${remaining} still needed before the shift ends.`,
      priority: 2,
    });
  } catch {
    /* notifications unavailable or blocked; the badge still carries it */
  }
}

async function check() {
  const state = await readState();
  const overdue = [];

  for (const task of trackedTasks()) {
    const p = taskProgressFrom(state, task.id, task.opts);
    // null means no shift running, or it's already been closed out.
    if (!p || p.done || !p.overdue) continue;
    overdue.push({ ...task, progress: p });
  }

  await setBadge(overdue.length);
  if (!state || !overdue.length) return;

  // Interrupt once when a deadline passes, then only after the re-nag gap,
  // so a worker waking every minute doesn't fire every minute.
  const now = Date.now();
  const notified = { ...(state.notified || {}) };
  let changed = false;

  for (const t of overdue) {
    const last = notified[t.id];
    const isNewWindow = !last || last.window !== t.progress.window;
    const stale = last && now - last.at >= RENAG_MS;
    if (!isNewWindow && !stale) continue;
    notify(t.id, t.label, t.progress.remaining);
    notified[t.id] = { window: t.progress.window, at: now };
    changed = true;
  }

  if (changed) {
    // Re-read rather than reusing the copy above: the popup may have
    // written to the same record while the notifications were going out.
    const fresh = (await readState()) || state;
    await writeState({ ...fresh, notified });
  }
}

function ensureAlarm() {
  chrome.alarms.create(ALARM, { periodInMinutes: CHECK_MINUTES });
}

chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) check();
});

// Ticking a task off should clear the badge immediately rather than at the
// next alarm, so the signal tracks what the concierge just did.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STATE_KEY]) check();
});

// Send them to the log they were writing in.
chrome.notifications.onClicked.addListener((id) => {
  if (!id.startsWith("task-")) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (tab?.windowId != null) chrome.windows.update(tab.windowId, { focused: true });
  });
});

ensureAlarm();
check();
