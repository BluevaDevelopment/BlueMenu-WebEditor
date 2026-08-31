import type { Platform } from '../types/editor';

/**
 * Shapes of the visual model the editors work on.
 *
 * YAML written by hand is not guaranteed to match any of this, so the parser
 * takes a permissive record and normalises it into these types. Only what the
 * editors read is described; unknown keys ride along untouched so saving a menu
 * never drops a field the plugin understands and the editor does not.
 */
export type YamlRecord = Record<string, any>;

export interface VisualItem extends YamlRecord {
    material: string;
    amount: number;
    name?: string;
    lore?: string[];
    slot?: number;
    actions?: YamlRecord[];
    attributes?: YamlRecord;
}

export interface VisualAnimation {
    interval: number;
    frames: Record<string, VisualItem>;
}

export interface VisualJavaMenu {
    platform: 'java';
    title: string;
    openCommand: string;
    openPermission: string;
    open_conditions: YamlRecord | null;
    open_actions: YamlRecord[];
    type: string;
    size: number;
    items: Record<number, VisualItem>;
    animations: Record<string, VisualAnimation>;
}

export interface VisualBedrockButton {
    text: string;
    image: string | null;
    actions: YamlRecord[];
    display_conditions: YamlRecord | null;
}

export interface VisualBedrockMenu {
    platform: 'bedrock';
    menuName: string;
    openCommand: string;
    type: string;
    content: string[];
    buttons: Record<string, VisualBedrockButton>;
    components: Record<string, YamlRecord>;
}

export type VisualMenu = VisualJavaMenu | VisualBedrockMenu;

export function isJavaMenu(menu: VisualMenu): menu is VisualJavaMenu {
    return menu.platform === 'java';
}

export function platformOf(menu: VisualMenu): Platform {
    return menu.platform;
}
