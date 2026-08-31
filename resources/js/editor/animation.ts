import type { VisualItem, VisualJavaMenu } from './model';

/** A Minecraft tick. */
export const TICK_MS = 50;

export interface SlotAnimation {
    key: string;
    slot: number;
    interval: number;
    frames: VisualItem[];
}

/**
 * The animations of a menu, resolved to the slot each one drives.
 *
 * The plugin takes the slot from the frames themselves, so an animation with no
 * slot on its first frame animates nothing and is left out.
 */
export function slotAnimations(menu: VisualJavaMenu): SlotAnimation[] {
    const found: SlotAnimation[] = [];

    for (const [key, animation] of Object.entries(menu.animations)) {
        const frames = Object.values(animation.frames);
        const slot = frames[0]?.slot;

        if (frames.length === 0 || typeof slot !== 'number') {
            continue;
        }

        found.push({ key, slot, interval: Math.max(1, animation.interval), frames });
    }

    return found;
}

/**
 * Which frame an animation is showing after a number of ticks.
 */
export function frameAt(animation: SlotAnimation, tick: number): VisualItem {
    return animation.frames[Math.floor(tick / animation.interval) % animation.frames.length];
}

/**
 * The menu's items with every animated slot replaced by its current frame, so
 * the canvas shows what the player would see while it plays.
 */
export function itemsAtTick(menu: VisualJavaMenu, tick: number): Record<number, VisualItem> {
    const items = { ...menu.items };

    for (const animation of slotAnimations(menu)) {
        items[animation.slot] = { ...frameAt(animation, tick), slot: animation.slot };
    }

    return items;
}
