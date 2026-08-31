import { describe, expect, it } from 'vitest';
import { buildCondition, parseCondition, readConditions, writeConditions } from '../conditions';

describe('parseCondition', () => {
    it('splits a numeric comparison', () => {
        expect(parseCondition('{player_level} >= 10')).toEqual({
            placeholder: '{player_level}',
            operator: '>=',
            value: '10',
        });
    });

    it('prefers the two character operator over its prefix', () => {
        expect(parseCondition('{a} >= 5').operator).toBe('>=');
        expect(parseCondition('{a} > 5').operator).toBe('>');
    });

    it('reads a word operator', () => {
        expect(parseCondition('{player_name} contains admin')).toEqual({
            placeholder: '{player_name}',
            operator: 'contains',
            value: 'admin',
        });
    });

    it('strips quotes around the value', () => {
        expect(parseCondition('{rank} == "vip"').value).toBe('vip');
    });

    it('round trips through build', () => {
        const original = '{player_level} >= 10';

        expect(buildCondition(parseCondition(original))).toBe(original);
    });
});

describe('readConditions', () => {
    it('reads a plain list as the simple mode', () => {
        const set = readConditions(['{a} >= 1', '{b} <= 2']);

        expect(set.mode).toBe('simple');
        expect(set.simple).toHaveLength(2);
    });

    it('reads an all/any/none block as the grouped mode', () => {
        const set = readConditions({ any: ['{a} >= 1'], none: ['{b} == x'] });

        expect(set.mode).toBe('grouped');
        expect(set.groups.any).toEqual(['{a} >= 1']);
        expect(set.groups.all).toEqual([]);
    });

    it('treats a missing section as nothing configured', () => {
        expect(readConditions(null).simple).toEqual([]);
        expect(readConditions(undefined).mode).toBe('simple');
    });
});

describe('writeConditions', () => {
    it('drops the section when nothing is configured', () => {
        expect(writeConditions(readConditions(null))).toBeNull();
        expect(writeConditions(readConditions({ all: [], any: [], none: [] }))).toBeNull();
    });

    it('round trips a plain list', () => {
        const list = ['{a} >= 1'];

        expect(writeConditions(readConditions(list))).toEqual(list);
    });

    it('keeps only the groups that carry conditions', () => {
        const written = writeConditions(readConditions({ any: ['{a} >= 1'], all: [] }));

        expect(written).toEqual({ any: ['{a} >= 1'] });
    });
});
