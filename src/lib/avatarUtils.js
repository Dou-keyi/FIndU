// avatarUtils.js — deterministic avatar initials and seeded colour from name

const AVATAR_COLORS = [
  { bg: '#EDE9FE', text: '#5B21B6' }, // violet
  { bg: '#DBEAFE', text: '#1D4ED8' }, // blue
  { bg: '#D1FAE5', text: '#047857' }, // emerald
  { bg: '#FEF3C7', text: '#B45309' }, // amber
  { bg: '#FCE7F3', text: '#BE185D' }, // pink
  { bg: '#E0E7FF', text: '#3730A3' }, // indigo
];

/**
 * Extract up to 2 initials from a full name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Simple string hash for deterministic colour selection
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Get a deterministic avatar colour pair { bg, text } from a name
 */
export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
}

/**
 * Get a light brand hex colour at low opacity for hero backgrounds
 */
export function getBrandTint(name) {
  const color = getAvatarColor(name);
  return color.bg;
}
