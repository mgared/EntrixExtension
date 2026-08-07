// Thin lookups over HELPER for the popup. The new model is template-only
// (each reason owns its full sentence), so all the field-resolution logic
// the old form-schema needed is gone — only role/reason lookups remain.

import { HELPER, QUICK_LOGS, HIGHLIGHTS } from "./franklin-helper.js";

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
