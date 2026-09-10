// Thin lookups over HELPER for the popup. The new model is template-only
// (each reason owns its full sentence), so all the field-resolution logic
// the old form-schema needed is gone — only role/reason lookups remain.

import {
  HELPER,
  QUICK_LOGS,
  HIGHLIGHTS,
  MANUAL_URL,
} from "./franklin-helper.js";

export function getRoles() {
  return HELPER.roles || [];
}

export function getRole(roleId) {
  return (HELPER.roles || []).find((r) => r.id === roleId) || null;
}

export function getReason(roleId, reasonId) {
  const role = getRole(roleId);
  return (role?.reasons || []).find((r) => r.id === reasonId) || null;
}

export function getDefaultRoleId() {
  return HELPER.defaultRoleId || HELPER.roles?.[0]?.id || "";
}

export function getQuickLogs() {
  return QUICK_LOGS || [];
}

export function getHighlights() {
  return HIGHLIGHTS || [];
}

// Empty when this build has no manual of its own, which hides the button
// rather than sending the desk to another building's instructions.
export function getManualUrl() {
  return MANUAL_URL || "";
}
