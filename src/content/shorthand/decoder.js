// Resolve a `;<rolecode><digit>` match to its role + reason definition.
//
// `reasonIndex` is 1-based — `;re1` means the first reason on the
// resident role. Returns null on any unknown role code or out-of-range
// reason so main can treat it as a silent no-op.

import { HELPER } from "../../config/franklin-helper.js";

export function resolveShorthand({ roleCode, reasonIndex }) {
  const role = (HELPER.roles || []).find((r) => r.code === roleCode);
  if (!role) return null;

  const reasons = role.reasons || [];
  const reason = reasons[reasonIndex - 1];
  if (!reason) return null;

  return { role, reason };
}
