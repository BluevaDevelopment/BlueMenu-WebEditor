import { describe, expect, it } from 'vitest';
import { buildActionString, describeAction, parseAction } from '../actions';

describe('parseAction', () => {
    it('splits the click type, the action and its parameters', () => {
        expect(parseAction('[RIGHT_CLICK] MESSAGE;<aqua>Hi')).toEqual({
            clickType: 'RIGHT_CLICK',
            type: 'MESSAGE',
            params: '<aqua>Hi',
        });
    });

    it('reads an action that takes no parameters', () => {
        expect(parseAction('[LEFT_CLICK] CLOSE')).toEqual({
            clickType: 'LEFT_CLICK',
            type: 'CLOSE',
            params: null,
        });
    });

    it('keeps semicolons inside the parameters', () => {
        expect(parseAction('[ALL] SOUND;ENTITY_ITEM_PICKUP;1.0;1.5').params).toBe('ENTITY_ITEM_PICKUP;1.0;1.5');
    });

    it('folds both proxy actions into one connect entry', () => {
        expect(parseAction('[LEFT_CLICK] CONNECT_BUNGEE;lobby').type).toBe('CONNECT');
        expect(parseAction('[LEFT_CLICK] CONNECT_VELOCITY;lobby').type).toBe('CONNECT');
    });

    it('falls back to closing the menu when the string makes no sense', () => {
        expect(parseAction('nonsense')).toEqual({ clickType: 'LEFT_CLICK', type: 'CLOSE', params: null });
    });
});

describe('buildActionString', () => {
    it('round trips an action with parameters', () => {
        const original = '[SHIFT_LEFT_CLICK] CONSOLE;give {player_name} diamond 1';
        const parsed = parseAction(original);

        expect(buildActionString(parsed.clickType, parsed.type, parsed.params)).toBe(original);
    });

    it('round trips an action without parameters', () => {
        const original = '[MIDDLE_CLICK] REFRESH_MENU';
        const parsed = parseAction(original);

        expect(buildActionString(parsed.clickType, parsed.type, parsed.params)).toBe(original);
    });

    it('drops parameters an action cannot carry', () => {
        expect(buildActionString('ALL', 'CLOSE', 'ignored')).toBe('[ALL] CLOSE');
    });
});

describe('describeAction', () => {
    it('names a known action', () => {
        expect(describeAction(parseAction('[ALL] SOUND;x'))).toBe('Play Sound');
    });

    it('falls back to the raw type for an action the editor does not know', () => {
        expect(describeAction({ clickType: 'ALL', type: 'FUTURE_ACTION', params: null })).toBe('FUTURE_ACTION');
    });
});
