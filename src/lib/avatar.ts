/**
 * src/lib/avatar.ts
 * Shared helpers for the initials avatar (top bar, account menu, profile page).
 */

// Brand blue from your design tokens, with white initials.
// Other options from the same palette: 'var(--navy)' (matches the sidebar),
// 'var(--primary-hover)' (a darker blue), 'var(--success)' (teal).
const AVATAR_COLOR = 'var(--primary)';

/** "Santosh Kumar" -> "SK", "santosh" -> "SA", empty -> "US". */
export function getInitials(name?: string | null): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'US';
    return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? '')).toUpperCase();
}

/**
 * Background colour for the avatar. Layout and ProfilePage already call this,
 * so to bring back different colours per person later, change only this function.
 */
export function getAvatarColor(_seed?: string | null): string {
    return AVATAR_COLOR;
}

/**
 * Cleans a typed name for saving: trims, collapses double spaces and capitalises
 * the first letter of each word ("m sathavahanarao" -> "M Sathavahanarao").
 * The rest of each word is left alone, so "McDonald" stays "McDonald".
 */
export function tidyName(value: string): string {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(' ');
}
