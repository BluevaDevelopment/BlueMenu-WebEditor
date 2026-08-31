// Minecraft version for item images (26_1 = Tiny Takeover, March 2026)
export const MINECRAFT_VERSION = '26_1';
export const ITEM_IMAGE_BASE_URL = '/editor/items';

/**
 * Map a Minecraft server version string (e.g. "1.21.4", "1.21.11", "26.1") to the
 * corresponding item-image folder name.
 *
 * Rules:
 *   - 26.x or higher  → '26_1'  (Tiny Takeover and beyond)
 *   - 1.21.11.x       → '1_21_11' (Mounts of Mayhem)
 *   - anything older  → '1_21_10' (base set)
 *
 * @param {string|null} serverVersion  Version string from the plugin, e.g. "1.21.4"
 * @returns {string} Folder name
 */
export function getVersionFolder(serverVersion: string | null): string {
    if (!serverVersion) {
        return MINECRAFT_VERSION;
    }

    const parts = serverVersion.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    // 26.x and above
    if (major >= 26) {
        return '26_1';
    }

    // 1.21.11 and above (but below 26.x)
    if (major === 1 && minor === 21 && patch >= 11) {
        return '1_21_11';
    }

    // 1.21.10 or lower
    return '1_21_10';
}

/**
 * Get image URL for a material, using the server version to pick the correct asset folder.
 *
 * @param {string} material       Material name, e.g. "DIAMOND_SWORD"
 * @param {string|null} serverVersion  Server version string, or null to use the latest
 * @returns {string} Image URL
 */
export function getMaterialImageUrl(material: string, serverVersion: string | null = null): string {
    const folder = getVersionFolder(serverVersion);
    const apiMaterial = `minecraft_${material.toLowerCase()}`;
    return `${ITEM_IMAGE_BASE_URL}/${folder}/${apiMaterial}.png`;
}

export function formatMaterialName(material: string): string {
    return material
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Get fallback emoji for material (if image fails)
 */
export function getMaterialEmoji(material: string): string {
    const emojiMap: Record<string, string> = {
        'DIAMOND': '💎',
        'DIAMOND_SWORD': '⚔️',
        'DIAMOND_PICKAXE': '⛏️',
        'EMERALD': '💚',
        'GOLD_INGOT': '🟡',
        'IRON_INGOT': '⚪',
        'CHEST': '📦',
        'ENDER_PEARL': '🔮',
        'COMPASS': '🧭',
        'PAPER': '📄',
        'BOOK': '📖',
        'BARRIER': '🚫',
        'ARROW': '➡️',
        'BOW': '🏹',
        'APPLE': '🍎',
        'GOLDEN_APPLE': '🍏',
        'BEDROCK': '⬛',
        'REDSTONE': '🔴',
        'COAL': '⚫',
        'EXPERIENCE_BOTTLE': '🧪',
        'NETHER_STAR': '⭐',
        'TOTEM_OF_UNDYING': '🗿',
        'ELYTRA': '🪽'
    };

    return emojiMap[material] || '📦';
}
