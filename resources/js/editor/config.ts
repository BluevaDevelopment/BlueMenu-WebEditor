/** Limits and vocabularies the plugin enforces, mirrored so the editor refuses
 * what the server would refuse and accepts what it would accept. */

export const TOAST_DURATION_MS = 3000;

/** Shown in the status bar, as the legacy editor did. */
export const EDITOR_VERSION = 'v2.0.0';

export const VALID_MENU_TYPES = {
    // The Java plugin always builds a chest inventory, no other type is honoured.
    JAVA: ['CHEST'],
    BEDROCK: ['SIMPLE', 'MODAL', 'CUSTOM']
};

export const VALID_CHEST_SIZES: readonly number[] = [9, 18, 27, 36, 45, 54];

/**
 * Clamp a configured chest size to a Bukkit-legal value (9..54, multiple of 9).
 * Mirrors MenuManager.normalizeMenuSize in the plugin so the editor never
 * rejects a size the plugin would happily accept.
 */
export function normalizeMenuSize(configured: number | string): number {
    const size = parseInt(String(configured), 10);
    if (Number.isNaN(size)) return 27;
    if (size < 9) return 9;
    if (size > 54) return 54;
    if (size % 9 !== 0) return Math.min(54, (Math.floor(size / 9) + 1) * 9);
    return size;
}

export const VALID_COMPONENT_TYPES: readonly string[] = ['LABEL', 'INPUT', 'DROPDOWN', 'TOGGLE', 'SLIDER', 'STEPSLIDER'];
