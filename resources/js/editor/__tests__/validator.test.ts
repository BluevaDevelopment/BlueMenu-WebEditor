import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateMenuSource } from '../validator';

function demoMenu(platform: string, fileName: string): string {
    return readFileSync(resolve(__dirname, `../../../demo/menus/${platform}/${fileName}`), 'utf8');
}

describe('validateMenuSource', () => {
    it('accepts every menu the plugin ships', () => {
        for (const fileName of ['chest_example.yml', 'slots_helper.yml', 'conditions_example.yml']) {
            expect(validateMenuSource(demoMenu('java', fileName), 'java').errors).toEqual([]);
        }
    });

    it('reports the line of a syntax error and skips the semantic pass', () => {
        const result = validateMenuSource('items:\n  - one\n bad: indentation\n', 'java');

        expect(result.valid).toBe(false);
        expect(result.errors[0].line).toBeGreaterThan(0);
        expect(result.warnings).toEqual([]);
    });

    it('warns rather than fails on a size the plugin will round for you', () => {
        const result = validateMenuSource('file_version: 1\nmenuName: Test\ntype: CHEST\nmenuSize: 100\n', 'java');

        expect(result.valid).toBe(true);
        expect(result.warnings.map(warning => warning.message).join(' ')).toContain('54');
    });

    it('checks a menu whichever case the platform is written in', () => {
        const source = 'file_version: 1\ntype: CHEST\nmenuSize: 27\n';

        const lower = validateMenuSource(source, 'java');
        const upper = validateMenuSource(source, 'JAVA');

        expect(lower).toEqual(upper);
        expect(lower.errors.map(error => error.message).join(' ')).toContain('menuName');
    });

    it('rejects an item missing the fields the plugin needs to build it', () => {
        const source = [
            'file_version: 1',
            'menuName: Test',
            'type: CHEST',
            'menuSize: 27',
            'items:',
            '  far:',
            '    slot: 40',
            '    itemStack:',
            '      material: STONE',
            '',
        ].join('\n');

        expect(validateMenuSource(source, 'java').valid).toBe(false);
    });

    it('warns about a menu with no file_version', () => {
        const source = 'menuName: Test\ntype: CHEST\nmenuSize: 27\nitems: {}\n';

        expect(validateMenuSource(source, 'java').warnings.length).toBeGreaterThan(0);
    });
});
