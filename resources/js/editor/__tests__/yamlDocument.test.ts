import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyVisualEdit, readVisual } from '../yamlDocument';
import type { VisualJavaMenu } from '../model';

function chestExample(): string {
    return readFileSync(resolve(__dirname, '../../../demo/menus/java/chest_example.yml'), 'utf8');
}

describe('applyVisualEdit', () => {
    it('keeps the comments the plugin ships in its example menus', () => {
        const source = chestExample();
        const visual = readVisual(source, 'java') as VisualJavaMenu;

        const updated = applyVisualEdit(source, { ...visual, title: 'Renamed' }, 'java');

        expect(updated).toContain('# CHEST MENU EXAMPLE (Java Edition)');
        expect(updated).toContain('Renamed');
    });

    it('writes a changed size back into the document', () => {
        const source = chestExample();
        const visual = readVisual(source, 'java') as VisualJavaMenu;

        const updated = applyVisualEdit(source, { ...visual, size: 27 }, 'java');

        expect((readVisual(updated, 'java') as VisualJavaMenu).size).toBe(27);
    });

    it('produces a document the parser can read back', () => {
        const source = chestExample();
        const visual = readVisual(source, 'java') as VisualJavaMenu;

        const updated = applyVisualEdit(source, visual, 'java');
        const reparsed = readVisual(updated, 'java') as VisualJavaMenu;

        expect(Object.keys(reparsed.items).sort()).toEqual(Object.keys(visual.items).sort());
    });
});
