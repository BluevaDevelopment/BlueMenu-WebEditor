import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as YAML from 'yaml';
import { describe, expect, it } from 'vitest';
import { parseVisualToYaml, parseYamlToVisual, validateVisualData } from '../visualParser';
import type { VisualBedrockMenu, VisualJavaMenu } from '../model';

/** The menus the plugin itself ships, so the codec is exercised on real input. */
function demoMenu(platform: string, fileName: string): string {
    return readFileSync(resolve(__dirname, `../../../demo/menus/${platform}/${fileName}`), 'utf8');
}

describe('java menus', () => {
    it('reads the shipped chest example without losing its identity', () => {
        const visual = parseYamlToVisual(demoMenu('java', 'chest_example.yml'), 'java') as VisualJavaMenu;

        expect(visual.platform).toBe('java');
        expect(visual.type).toBe('CHEST');
        expect(visual.size).toBe(54);
        expect(visual.openCommand).toBe('/menu');
        expect(visual.title).toContain('BlueMenu');
    });

    it('keys items by the slot the menu declares, not by the item name', () => {
        const visual = parseYamlToVisual(demoMenu('java', 'chest_example.yml'), 'java') as VisualJavaMenu;

        expect(visual.items[22]).toBeDefined();
        expect(visual.items[22].material).toBe('PLAYER_HEAD');
    });

    it('survives a round trip through yaml', () => {
        const original = parseYamlToVisual(demoMenu('java', 'chest_example.yml'), 'java') as VisualJavaMenu;
        const roundTripped = parseYamlToVisual(parseVisualToYaml(original, 'java'), 'java') as VisualJavaMenu;

        expect(roundTripped.title).toBe(original.title);
        expect(roundTripped.size).toBe(original.size);
        expect(roundTripped.openCommand).toBe(original.openCommand);
        expect(Object.keys(roundTripped.items).sort()).toEqual(Object.keys(original.items).sort());
    });

    it('keeps every item material and slot across a round trip', () => {
        const original = parseYamlToVisual(demoMenu('java', 'chest_example.yml'), 'java') as VisualJavaMenu;
        const roundTripped = parseYamlToVisual(parseVisualToYaml(original, 'java'), 'java') as VisualJavaMenu;

        for (const slot of Object.keys(original.items)) {
            const index = Number(slot);
            expect(roundTripped.items[index].material).toBe(original.items[index].material);
        }
    });

    it('emits yaml the plugin can parse back', () => {
        const visual = parseYamlToVisual(demoMenu('java', 'chest_example.yml'), 'java');

        expect(() => YAML.parse(parseVisualToYaml(visual, 'java'))).not.toThrow();
    });

    it('clamps a size the plugin would reject to the next legal chest size', () => {
        const visual = parseYamlToVisual('menuName: Test\nmenuSize: 20\ntype: CHEST\n', 'java') as VisualJavaMenu;

        expect(visual.size).toBe(27);
    });
});

describe('bedrock menus', () => {
    it('reads a simple form and keeps its buttons keyed as written', () => {
        const visual = parseYamlToVisual(demoMenu('bedrock', 'simple_example.yml'), 'bedrock') as VisualBedrockMenu;

        expect(visual.platform).toBe('bedrock');
        expect(visual.type).toBe('SIMPLE');
        expect(Object.keys(visual.buttons).length).toBeGreaterThan(0);
    });

    it('survives a round trip through yaml', () => {
        const original = parseYamlToVisual(demoMenu('bedrock', 'simple_example.yml'), 'bedrock') as VisualBedrockMenu;
        const roundTripped = parseYamlToVisual(
            parseVisualToYaml(original, 'bedrock'),
            'bedrock',
        ) as VisualBedrockMenu;

        expect(roundTripped.menuName).toBe(original.menuName);
        expect(roundTripped.type).toBe(original.type);
        expect(Object.keys(roundTripped.buttons)).toEqual(Object.keys(original.buttons));
    });

    it('reads the components of a custom form', () => {
        const visual = parseYamlToVisual(demoMenu('bedrock', 'custom_example.yml'), 'bedrock') as VisualBedrockMenu;

        expect(visual.type).toBe('CUSTOM');
        expect(Object.keys(visual.components).length).toBeGreaterThan(0);
    });
});

describe('validation', () => {
    it('rejects a java menu whose type the plugin does not build', () => {
        const result = validateVisualData({ type: 'HOPPER', size: 27, items: {} }, 'java');

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toContain('HOPPER');
    });

    it('accepts the shipped chest example', () => {
        const visual = parseYamlToVisual(demoMenu('java', 'chest_example.yml'), 'java');

        expect(validateVisualData(visual, 'java').valid).toBe(true);
    });
});
