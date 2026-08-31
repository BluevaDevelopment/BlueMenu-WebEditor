import * as YAML from 'yaml';
import { parseYamlToVisual, updateYamlDocumentFromVisual } from './visualParser';
import type { VisualMenu, YamlRecord } from './model';

/**
 * Applies a visual edit back onto the original text.
 *
 * The change is written into the parsed document rather than regenerating the
 * file, so the comments the plugin ships its example menus with survive an edit
 * made in the visual editor.
 */
export function applyVisualEdit(source: string, visual: YamlRecord, platform: string): string {
    const document = YAML.parseDocument(source);
    const updated = updateYamlDocumentFromVisual(document, visual, platform);

    return typeof updated === 'string' ? updated : String(document);
}

export function readVisual(source: string, platform: string): VisualMenu {
    return parseYamlToVisual(source, platform);
}
