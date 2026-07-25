// A handful of fixed, deterministic-by-name background colors (same idea as Slack/Linear's
// avatar-color assignment) — not random, so the same person's avatar doesn't change color on
// every re-render, and not user-configurable, since there's no photo-upload feature to make
// this a placeholder *for* yet (Documents supports arbitrary file uploads, not specifically a
// profile photo field — that's real, separate scope, not something to half-build here).
// A balanced, saturated multi-hue set that keeps white initials legible on both the light and
// dark themes. Deterministic-by-name (see below), so a person's avatar colour never changes.
const AVATAR_COLORS = ['#3ecf8e', '#2f9e6f', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#14b8a6', '#f43f5e'];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// A low-opacity tint of the person's colour, for a subtle avatar fill (light tinted circle with
// dark initials) rather than a solid, heavy saturated block. `26` hex ≈ 15% alpha, so it stays
// soft over both the light and dark theme backgrounds. See components/ui/avatar.tsx.
export function avatarTint(name: string): string {
  return avatarColor(name) + '26';
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}
