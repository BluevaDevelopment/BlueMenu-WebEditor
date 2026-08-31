import * as YAML from 'yaml';
import { VALID_MENU_TYPES, VALID_CHEST_SIZES, VALID_COMPONENT_TYPES, normalizeMenuSize } from './config';
import type { YamlRecord } from './model';

/** One problem found in a menu, anchored to the line that caused it. */
export interface Diagnostic {
    message: string;
    line: number | null;
    column?: number;
}

export interface MenuDiagnostics {
    valid: boolean;
    errors: Diagnostic[];
    warnings: Diagnostic[];
}

/**
 * Checks a menu the way the plugin would, so the editor refuses a file the
 * server could not load instead of letting the player find out in game.
 *
 * A syntax error stops the pass: the semantic checks need a parsed document,
 * and reporting them on top of broken YAML only buries the real problem.
 */
export function validateMenuSource(content: string, platform: string): MenuDiagnostics {
    const syntaxErrors = validateYAML(content);

    if (syntaxErrors.length > 0) {
        return { valid: false, errors: syntaxErrors, warnings: [] };
    }

    const semantic = validateBlueMenu(content, platform);

    return { valid: semantic.errors.length === 0, ...semantic };
}

function validateYAML(content: string): Diagnostic[] {
    const errors: Diagnostic[] = [];

    try {
        YAML.parse(content);
        return errors;
    } catch (caught) {
        const e = caught as { message?: string; mark?: { line: number; column: number } };
        const errorMessage = e.message || 'YAML syntax error';

        if (e.mark) {
            const lineNum = e.mark.line + 1;
            const column = e.mark.column + 1;

            let cleanMessage = errorMessage;

            if (errorMessage.includes('(')) {
                cleanMessage = errorMessage.substring(0, errorMessage.indexOf('(')).trim();
            }

            cleanMessage = cleanMessage
                .replace("could not find expected ':'", "missing ':' character")
                .replace('while scanning a simple key', 'key scan error')
                .replace('mapping values are not allowed here', 'mapping values are not allowed here')
                .replace('did not find expected key', 'did not find expected key')
                .replace('expected end of block', 'expected end of block')
                .replace('found unexpected end of stream', 'unexpected end of file')
                .replace('bad indentation', 'bad indentation')
                .replace("found character '\\t'", 'tab character found (not allowed in YAML)')
                .replace('expected alphabetic or numeric character', 'expected alphabetic or numeric character');

            errors.push({
                line: lineNum,
                column: column,
                message: cleanMessage
            });
        } else {
            errors.push({
                line: 1,
                column: 1,
                message: errorMessage
            });
        }
    }

    return errors;
}

function validateBlueMenu(content: string, platform: string): Omit<MenuDiagnostics, 'valid'> {
    const errors: Diagnostic[] = [];
    const warnings: Diagnostic[] = [];

    let config;
    try {
        config = YAML.parse(content);
    } catch {
        return { errors, warnings };
    }

    if (!config || typeof config !== 'object') {
        errors.push({
            line: 1,
            message: 'The file must contain a valid configuration'
        });
        return { errors, warnings };
    }

    const lines = content.split('\n');

    if (!config.file_version) {
        warnings.push({
            line: 1,
            message: 'It is recommended to specify file_version: 1'
        });
    }

    const normalizedPlatform = platform.toUpperCase();

    if (normalizedPlatform === 'JAVA') {
        validateJavaMenu(config, errors, warnings, lines);
    } else if (normalizedPlatform === 'BEDROCK') {
        validateBedrockMenu(config, errors, warnings, lines);
    }

    return { errors, warnings };
}

function validateJavaMenu(config: YamlRecord, errors: Diagnostic[], warnings: Diagnostic[], lines: string[]): void {
    if (!config.menuName) {
        errors.push({ line: 1, message: 'Missing required field: menuName' });
    }

    // The Java plugin never reads "type": every Java menu is built as a chest
    // (new FastInv(menuSize, title)). So a missing or exotic type is not fatal.
    if (!config.type) {
        warnings.push({ line: 1, message: 'No "type" set, Java menus always open as a CHEST' });
    } else {
        const validTypes = VALID_MENU_TYPES.JAVA;
        const upperType = config.type.toUpperCase();
        if (!validTypes.includes(upperType)) {
            warnings.push({
                line: findLineWithKey(lines, 'type'),
                message: 'Unknown type "' + config.type + '". Known types: ' + validTypes.join(', ')
            });
        } else if (upperType !== 'CHEST') {
            warnings.push({
                line: findLineWithKey(lines, 'type'),
                message: 'Java only honours CHEST, so "' + upperType + '" will still open as a chest'
            });
        }
    }

    if (!config.openCommand) {
        warnings.push({ line: 1, message: 'It is recommended to specify openCommand' });
    }

    if (config.size !== undefined && !config.menuSize) {
        errors.push({
            line: findLineWithKey(lines, 'size'),
            message: 'Use "menuSize" instead of "size"'
        });
    }

    // menuSize: the plugin defaults to 27 when absent and rounds anything else to
    // a legal chest size (9..54, multiple of 9), so none of this is fatal.
    if (!config.menuSize) {
        if (config.size === undefined) {
            warnings.push({ line: 1, message: 'No menuSize set, the menu will default to 27 (3 rows)' });
        }
    } else {
        const size = parseInt(config.menuSize);
        if (isNaN(size)) {
            errors.push({
                line: findLineWithKey(lines, 'menuSize'),
                message: 'menuSize must be a number'
            });
        } else if (!VALID_CHEST_SIZES.includes(size)) {
            warnings.push({
                line: findLineWithKey(lines, 'menuSize'),
                message: 'menuSize ' + size + ' is not a multiple of 9 in 9-54, so the plugin will use ' + normalizeMenuSize(size)
            });
        }
    }

    if (config.items) {
        if (typeof config.items !== 'object') {
            errors.push({
                line: findLineWithKey(lines, 'items'),
                message: 'items must be a section with individual items'
            });
        } else {
            const maxSlot = normalizeMenuSize(config.menuSize || 27) - 1;
            for (const [itemKey, item] of Object.entries<any>(config.items)) {
                validateJavaItem(item, itemKey, maxSlot, errors, warnings, lines);
            }
        }
    }

    if (config.animations) {
        if (typeof config.animations !== 'object') {
            errors.push({
                line: findLineWithKey(lines, 'animations'),
                message: 'animations must be a section with individual animations'
            });
        } else {
            for (const [animKey, anim] of Object.entries<any>(config.animations)) {
                if (!anim.interval) {
                    errors.push({
                        line: findLineWithKey(lines, animKey),
                        message: `Animation "${animKey}": missing required field interval`
                    });
                }
                if (!anim.frames) {
                    errors.push({
                        line: findLineWithKey(lines, animKey),
                        message: `Animation "${animKey}": missing required field frames`
                    });
                }
            }
        }
    }
}

function validateJavaItem(item: YamlRecord, itemKey: string, maxSlot: number, errors: Diagnostic[], warnings: Diagnostic[], lines: string[]): void {
    if (!item || typeof item !== 'object') {
        errors.push({
            line: findLineWithKey(lines, itemKey),
            message: `Item "${itemKey}": must be a valid section`
        });
        return;
    }

    if (!item.name) {
        errors.push({
            line: findLineWithKey(lines, itemKey),
            message: `Item "${itemKey}": missing required field name`
        });
    }

    if (item.slot === undefined || item.slot === null) {
        errors.push({
            line: findLineWithKey(lines, itemKey),
            message: `Item "${itemKey}": missing required field slot`
        });
    } else {
        const slot = parseInt(item.slot);
        if (isNaN(slot) || slot < 0) {
            errors.push({
                line: findLineWithKey(lines, itemKey),
                message: `Item "${itemKey}": slot must be a number >= 0`
            });
        } else if (slot > maxSlot) {
            // The plugin skips an out-of-range item but still opens the menu.
            warnings.push({
                line: findLineWithKey(lines, itemKey),
                message: `Item "${itemKey}": slot ${slot} is outside the menu (0-${maxSlot}) and will be skipped in-game`
            });
        }
    }

    if (!item.itemStack) {
        errors.push({
            line: findLineWithKey(lines, itemKey),
            message: `Item "${itemKey}": missing required field itemStack`
        });
    } else {
        if (!item.itemStack.material) {
            errors.push({
                line: findLineWithKey(lines, itemKey),
                message: `Item "${itemKey}": itemStack.material is required`
            });
        }
        if (!item.itemStack.amount) {
            errors.push({
                line: findLineWithKey(lines, itemKey),
                message: `Item "${itemKey}": itemStack.amount is required`
            });
        } else {
            const amount = parseInt(item.itemStack.amount);
            if (isNaN(amount) || amount < 1 || amount > 64) {
                errors.push({
                    line: findLineWithKey(lines, itemKey),
                    message: `Item "${itemKey}": amount must be between 1 and 64`
                });
            }
        }
    }
}

function validateBedrockMenu(config: YamlRecord, errors: Diagnostic[], warnings: Diagnostic[], lines: string[]): void {
    if (!config.menuName) {
        errors.push({ line: 1, message: 'Missing required field: menuName' });
    }

    if (!config.type) {
        errors.push({ line: 1, message: 'Missing required field: type' });
        return;
    }

    const validTypes = VALID_MENU_TYPES.BEDROCK;
    const type = config.type.toUpperCase();
    if (!validTypes.includes(type)) {
        errors.push({
            line: findLineWithKey(lines, 'type'),
            message: 'Invalid type. Valid types: ' + validTypes.join(', ')
        });
        return;
    }

    if (!config.openCommand) {
        warnings.push({ line: 1, message: 'It is recommended to specify openCommand' });
    }

    if (type === 'SIMPLE') {
        validateBedrockSimple(config, errors, warnings, lines);
    } else if (type === 'MODAL') {
        validateBedrockModal(config, errors, warnings, lines);
    } else if (type === 'CUSTOM') {
        validateBedrockCustom(config, errors, warnings, lines);
    }
}

function validateBedrockSimple(config: YamlRecord, errors: Diagnostic[], warnings: Diagnostic[], lines: string[]): void {
    if (!config.content) {
        errors.push({
            line: 1,
            message: 'SIMPLE forms require content field (list of text lines)'
        });
    } else if (!Array.isArray(config.content)) {
        errors.push({
            line: findLineWithKey(lines, 'content'),
            message: 'content must be a list of text lines'
        });
    }

    if (config.buttons) {
        if (typeof config.buttons !== 'object') {
            errors.push({
                line: findLineWithKey(lines, 'buttons'),
                message: 'buttons must be a section with individual buttons'
            });
        } else {
            for (const [btnKey, button] of Object.entries<any>(config.buttons)) {
                if (!button.text) {
                    errors.push({
                        line: findLineWithKey(lines, btnKey),
                        message: `Button "${btnKey}": missing required field text`
                    });
                }
            }
        }
    }
}

function validateBedrockModal(config: YamlRecord, errors: Diagnostic[], warnings: Diagnostic[], lines: string[]): void {
    if (!config.content) {
        errors.push({
            line: 1,
            message: 'MODAL forms require content field (list of text lines)'
        });
    } else if (!Array.isArray(config.content)) {
        errors.push({
            line: findLineWithKey(lines, 'content'),
            message: 'content must be a list of text lines'
        });
    }

    if (!config.buttons) {
        errors.push({ line: 1, message: 'MODAL forms require buttons section' });
    } else {
        if (!config.buttons.button1) {
            errors.push({
                line: findLineWithKey(lines, 'buttons'),
                message: 'MODAL forms require button1'
            });
        } else if (!config.buttons.button1.text) {
            errors.push({
                line: findLineWithKey(lines, 'button1'),
                message: 'button1: missing required field text'
            });
        }

        if (!config.buttons.button2) {
            errors.push({
                line: findLineWithKey(lines, 'buttons'),
                message: 'MODAL forms require button2'
            });
        } else if (!config.buttons.button2.text) {
            errors.push({
                line: findLineWithKey(lines, 'button2'),
                message: 'button2: missing required field text'
            });
        }

        const buttonKeys = Object.keys(config.buttons);
        const extraButtons = buttonKeys.filter(k => k !== 'button1' && k !== 'button2');
        if (extraButtons.length > 0) {
            warnings.push({
                line: findLineWithKey(lines, 'buttons'),
                message: 'MODAL forms should only have button1 and button2. Extra buttons will be ignored: ' + extraButtons.join(', ')
            });
        }
    }
}

function validateBedrockCustom(config: YamlRecord, errors: Diagnostic[], warnings: Diagnostic[], lines: string[]): void {
    if (!config.components) {
        errors.push({ line: 1, message: 'CUSTOM forms require components section' });
        return;
    }

    if (typeof config.components !== 'object') {
        errors.push({
            line: findLineWithKey(lines, 'components'),
            message: 'components must be a section with individual components'
        });
        return;
    }

    for (const [compKey, component] of Object.entries<any>(config.components)) {
        if (!component || typeof component !== 'object') {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": must be a valid section`
            });
            continue;
        }

        if (!component.type) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": missing required field type`
            });
            continue;
        }

        const compType = component.type.toUpperCase();
        if (!VALID_COMPONENT_TYPES.includes(compType)) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": invalid type. Valid types: ` + VALID_COMPONENT_TYPES.join(', ')
            });
            continue;
        }

        validateCustomComponent(component, compKey, compType, errors, warnings, lines);
    }
}

function validateCustomComponent(component: YamlRecord, compKey: string, compType: string, errors: Diagnostic[], warnings: Diagnostic[], lines: string[]): void {
    if (compType !== 'LABEL' && !component.text) {
        errors.push({
            line: findLineWithKey(lines, compKey),
            message: `Component "${compKey}": missing required field text`
        });
    }

    if (compType === 'LABEL' && !component.text) {
        errors.push({
            line: findLineWithKey(lines, compKey),
            message: `Component "${compKey}": LABEL requires text field`
        });
    }

    if (compType === 'DROPDOWN') {
        if (!component.options) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": DROPDOWN requires options field (list)`
            });
        } else if (!Array.isArray(component.options)) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": options must be a list`
            });
        } else if (component.options.length === 0) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": options must contain at least one option`
            });
        }
    }

    if (compType === 'SLIDER') {
        if (component.min === undefined || component.min === null) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": SLIDER requires min field`
            });
        }
        if (component.max === undefined || component.max === null) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": SLIDER requires max field`
            });
        }
        if (component.step === undefined || component.step === null) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": SLIDER requires step field`
            });
        }
        if (component.min !== undefined && component.max !== undefined && component.min >= component.max) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": min must be less than max`
            });
        }
    }

    if (compType === 'STEPSLIDER') {
        if (!component.steps) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": STEPSLIDER requires steps field (list)`
            });
        } else if (!Array.isArray(component.steps)) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": steps must be a list`
            });
        } else if (component.steps.length === 0) {
            errors.push({
                line: findLineWithKey(lines, compKey),
                message: `Component "${compKey}": steps must contain at least one entry`
            });
        }
    }
}

function findLineWithKey(lines: string[], key: string): number | null {
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith(key + ':') || trimmed.startsWith(key + ' :')) {
            return i + 1;
        }
    }
    return 1;
}
