// A handful of fixed, deterministic-by-name background colors (same idea as Slack/Linear's
// avatar-color assignment) — not random, so the same person's avatar doesn't change color on
// every re-render, and not user-configurable, since there's no photo-upload feature to make
// this a placeholder *for* yet (Documents supports arbitrary file uploads, not specifically a
// profile photo field — that's real, separate scope, not something to half-build here).
const AVATAR_COLORS = ['#0C66E4', '#6E5DC6', '#1F845A', '#B65C02', '#AE2E24', '#0B6E99'];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}
