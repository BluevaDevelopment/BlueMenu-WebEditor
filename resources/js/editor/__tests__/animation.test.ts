import { describe, expect, it } from 'vitest';
import { frameAt, itemsAtTick, slotAnimations } from '../animation';
import type { VisualJavaMenu } from '../model';

function menuWith(animations: VisualJavaMenu['animations']): VisualJavaMenu {
    return {
        platform: 'java',
        title: 'Test',
        openCommand: '',
        openPermission: '',
        open_conditions: null,
        open_actions: [],
        type: 'CHEST',
        size: 27,
        items: { 4: { material: 'STONE', amount: 1, slot: 4 } },
        animations,
    };
}

describe('slotAnimations', () => {
    it('takes the slot from the first frame, as the plugin does', () => {
        const found = slotAnimations(
            menuWith({
                spin: {
                    interval: 2,
                    frames: {
                        one: { material: 'RED_WOOL', amount: 1, slot: 13 },
                        two: { material: 'BLUE_WOOL', amount: 1, slot: 13 },
                    },
                },
            }),
        );

        expect(found).toHaveLength(1);
        expect(found[0].slot).toBe(13);
        expect(found[0].frames).toHaveLength(2);
    });

    it('skips an animation whose frames name no slot', () => {
        const found = slotAnimations(
            menuWith({ nowhere: { interval: 2, frames: { one: { material: 'STONE', amount: 1 } } } }),
        );

        expect(found).toEqual([]);
    });

    it('skips an animation with no frames', () => {
        expect(slotAnimations(menuWith({ empty: { interval: 2, frames: {} } }))).toEqual([]);
    });

    it('never divides by a zero interval', () => {
        const found = slotAnimations(
            menuWith({ fast: { interval: 0, frames: { one: { material: 'STONE', amount: 1, slot: 1 } } } }),
        );

        expect(found[0].interval).toBe(1);
    });
});

describe('frameAt', () => {
    const animation = {
        key: 'spin',
        slot: 13,
        interval: 2,
        frames: [
            { material: 'A', amount: 1 },
            { material: 'B', amount: 1 },
        ],
    };

    it('holds each frame for the configured number of ticks', () => {
        expect(frameAt(animation, 0).material).toBe('A');
        expect(frameAt(animation, 1).material).toBe('A');
        expect(frameAt(animation, 2).material).toBe('B');
        expect(frameAt(animation, 3).material).toBe('B');
    });

    it('loops back to the first frame', () => {
        expect(frameAt(animation, 4).material).toBe('A');
    });
});

describe('itemsAtTick', () => {
    const menu = menuWith({
        spin: {
            interval: 2,
            frames: {
                one: { material: 'RED_WOOL', amount: 1, slot: 13 },
                two: { material: 'BLUE_WOOL', amount: 1, slot: 13 },
            },
        },
    });

    it('puts the current frame in the animated slot', () => {
        expect(itemsAtTick(menu, 0)[13].material).toBe('RED_WOOL');
        expect(itemsAtTick(menu, 2)[13].material).toBe('BLUE_WOOL');
    });

    it('leaves the other slots alone', () => {
        expect(itemsAtTick(menu, 2)[4].material).toBe('STONE');
    });

    it('does not mutate the menu it was given', () => {
        itemsAtTick(menu, 2);

        expect(menu.items[13]).toBeUndefined();
    });
});
