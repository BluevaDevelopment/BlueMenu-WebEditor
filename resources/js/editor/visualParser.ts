import * as YAML from 'yaml';
import { VALID_MENU_TYPES, VALID_CHEST_SIZES, normalizeMenuSize } from './config';
/** Verdict of a structural check, with every reason it failed. */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

import type { VisualBedrockButton, VisualBedrockMenu, VisualItem, VisualJavaMenu, VisualMenu, YamlRecord } from './model';

/**
 * Parse YAML content to visual representation
 * @param {string} yamlContent - The YAML content
 * @param {string} platform - 'java' or 'bedrock'
 * @returns {Object} Visual data structure
 */
export function parseYamlToVisual(yamlContent: string, platform: string): VisualMenu {
    try {
        // Parse YAML using eemeli/yaml library
        const data = YAML.parse(yamlContent);

        if (!data) {
            throw new Error('Invalid YAML content');
        }

        // Normalize platform to lowercase
        const normalizedPlatform = platform.toLowerCase();

        if (normalizedPlatform === 'java') {
            return parseJavaMenuToVisual(data);
        } else if (normalizedPlatform === 'bedrock') {
            return parseBedrockMenuToVisual(data);
        } else {
            throw new Error('Unknown platform: ' + platform);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Parse Java menu YAML to visual
 */
function parseJavaMenuToVisual(data: YamlRecord): VisualJavaMenu {
    // Normalize size the same way the plugin does (round up to a multiple of 9,
    // clamp to 9..54) instead of silently snapping everything to 27.
    const rawSize = data.menuSize || data.size || 27;
    const normalizedSize = normalizeMenuSize(rawSize);

    const visual: VisualJavaMenu = {
        platform: 'java',
        title: data.menuName || data.title || 'Untitled Menu',
        openCommand: data.openCommand || data.command || '',  // Support both openCommand and legacy command
        openPermission: data.openPermission || '',
        open_conditions: data.open_conditions || null,
        open_actions: Array.isArray(data.open_actions) ? data.open_actions : [],
        type: data.type || 'CHEST',
        size: normalizedSize,
        items: {},
        animations: {}
    };

    // Parse items (BlueMenu format has 'slot' property in each item)
    if (data.items) {
        for (const [itemKey, itemData] of Object.entries<any>(data.items)) {
            // Check if item has a slot property (BlueMenu format)
            if (itemData.slot !== undefined) {
                const slot = itemData.slot;
                visual.items[slot] = parseItemData(itemData);
            } else {
                // Fallback: try to parse key as slot number
                const slot = parseInt(itemKey);
                if (!isNaN(slot)) {
                    visual.items[slot] = parseItemData(itemData);
                }
            }
        }
    }

    // Parse animations
    if (data.animations) {
        for (const [animKey, animData] of Object.entries<any>(data.animations)) {
            const parsedFrames: Record<string, VisualItem> = {};

            // Parse each frame to ensure proper structure
            if (animData.frames && typeof animData.frames === 'object') {
                for (const [frameKey, frameData] of Object.entries<any>(animData.frames)) {
                    parsedFrames[frameKey] = parseFrameData(frameData);
                }
            }

            visual.animations[animKey] = {
                interval: animData.interval || 2,
                frames: parsedFrames
            };
        }
    }

    return visual;
}

/**
 * Parse frame data from YAML (similar to parseItemData but for animation frames)
 */
function parseFrameData(frameData: YamlRecord): VisualItem {
    if (!frameData || typeof frameData !== 'object') {
        return {
            name: '&f',
            actions: [],
            slot: 0,
            material: 'STONE',
            amount: 1
        };
    }

    const frame: VisualItem = {
        material: 'STONE',
        amount: 1,
        name: frameData.name || '&f',
        actions: frameData.actions || [],
        slot: frameData.slot !== undefined ? frameData.slot : 0
    };

    // Parse itemStack
    if (frameData.itemStack) {
        frame.material = frameData.itemStack.material || 'STONE';
        frame.amount = frameData.itemStack.amount || 1;
        if (frameData.itemStack.value) {
            frame.value = frameData.itemStack.value;
        }
    } else {
        // Legacy format support
        frame.material = frameData.material || 'STONE';
        frame.amount = frameData.amount || 1;
    }

    // Optional properties
    if (frameData.lore) frame.lore = Array.isArray(frameData.lore) ? frameData.lore : [frameData.lore];
    if (frameData.data) frame.data = frameData.data;
    if (frameData.enchantments) frame.enchantments = frameData.enchantments;
    if (frameData.attributes) frame.attributes = parseAttributes(frameData.attributes);

    return frame;
}

/**
 * Parse Bedrock menu YAML to visual
 */
function parseBedrockMenuToVisual(data: YamlRecord): VisualBedrockMenu {
    const visual: VisualBedrockMenu = {
        platform: 'bedrock',
        menuName: data.menuName || data.title || 'Untitled Form',
        openCommand: data.openCommand || '',
        type: data.type || 'SIMPLE',
        content: [],
        buttons: {},  // Keep as object/map like BlueMenu YAML format
        components: {}  // Keep as object/map like BlueMenu YAML format
    };

    // Parse content (for SIMPLE and MODAL forms)
    if (data.content) {
        if (Array.isArray(data.content)) {
            visual.content = data.content;
        } else if (typeof data.content === 'string') {
            visual.content = [data.content];
        }
    }

    // Parse buttons (for SIMPLE and MODAL forms)
    // BlueMenu uses a map structure like { button1: {...}, button2: {...} }
    if (data.buttons && typeof data.buttons === 'object') {
        // Keep as object/map, parse each button
        for (const [key, btn] of Object.entries<any>(data.buttons)) {
            visual.buttons[key] = parseBedrockButton(btn);
        }
    }

    // Parse components (for CUSTOM forms)
    // BlueMenu uses a map structure like { component1: {...}, component2: {...} }
    if (data.components && typeof data.components === 'object') {
        // Keep as object/map, parse each component
        for (const [key, comp] of Object.entries<any>(data.components)) {
            visual.components[key] = parseBedrockComponent(comp);
        }
    }

    return visual;
}

/**
 * Parse a Bedrock button from YAML format
 */
function parseBedrockButton(btn: YamlRecord): VisualBedrockButton {
    return {
        text: btn.text || '',
        image: btn.image || btn.icon || null, // BlueMenu uses 'image' key
        actions: btn.actions || [],
        display_conditions: btn.display_conditions || null
    };
}

/**
 * Parse a Bedrock component from YAML format
 */
function parseBedrockComponent(comp: YamlRecord): YamlRecord {
    const parsed: YamlRecord = {
        type: comp.type || 'LABEL',
        text: comp.text || ''
    };

    // Type-specific properties
    switch (comp.type) {
        case 'INPUT':
            parsed.placeholder = comp.placeholder || '';
            parsed.default = comp.default || '';
            break;
        case 'DROPDOWN':
            parsed.options = comp.options || [];
            parsed.default = comp.default !== undefined ? comp.default : 0;
            break;
        case 'TOGGLE':
            parsed.default = comp.default !== undefined ? comp.default : false;
            break;
        case 'SLIDER':
            parsed.min = comp.min !== undefined ? comp.min : 0;
            parsed.max = comp.max !== undefined ? comp.max : 100;
            parsed.step = comp.step !== undefined ? comp.step : 1;
            parsed.default = comp.default !== undefined ? comp.default : 50;
            break;
        case 'STEPSLIDER':
            parsed.steps = comp.steps || [];
            parsed.default = comp.default !== undefined ? comp.default : 0;
            break;
    }

    // Actions (if present)
    if (comp.actions) {
        parsed.actions = comp.actions;
    }

    // Display conditions (if present)
    if (comp.display_conditions) {
        parsed.display_conditions = comp.display_conditions;
    }

    return parsed;
}

/**
 * Parse item data from YAML
 */
function parseItemData(itemData: YamlRecord): VisualItem {
    if (typeof itemData === 'string') {
        // Simple format: just material name
        return { material: itemData, amount: 1 };
    }

    // Extract material and amount from itemStack if present (BlueMenu format)
    let material, amount, value;
    if (itemData.itemStack) {
        material = itemData.itemStack.material || 'STONE';
        amount = itemData.itemStack.amount || 1;
        value = itemData.itemStack.value; // For custom heads
    } else {
        // Fallback to old format
        material = itemData.material || 'STONE';
        amount = itemData.amount || 1;
    }

    const item: VisualItem = {
        material: material,
        amount: amount
    };

    // Optional properties
    if (itemData.name) item.name = itemData.name;
    if (itemData.lore) item.lore = Array.isArray(itemData.lore) ? itemData.lore : [itemData.lore];
    if (itemData.data) item.data = itemData.data;
    if (itemData.enchantments) item.enchantments = itemData.enchantments;
    if (value) item.value = value;

    // Parse attributes (BlueMenu format: ["[BOOLEAN] FLAG_NAME;true", "[ENCHANTMENT] NAME;LEVEL"])
    if (itemData.attributes) {
        item.attributes = parseAttributes(itemData.attributes);
    }

    if (itemData.actions) item.actions = itemData.actions;
    if (itemData.priority !== undefined && itemData.priority !== null) item.priority = itemData.priority;
    if (itemData.condition) item.condition = itemData.condition; // Legacy support
    if (itemData.display_conditions) item.display_conditions = itemData.display_conditions;
    if (itemData['custom-model-data']) item['custom-model-data'] = itemData['custom-model-data'];
    if (itemData.skull) item.skull = itemData.skull;
    if (itemData.color) item.color = itemData.color;
    if (itemData.potion) item.potion = itemData.potion;

    return item;
}

/**
 * Parse attributes array from YAML format to internal representation
 * Format: ["[BOOLEAN] HIDE_ENCHANTS;true", "[ENCHANTMENT] FIRE_ASPECT;1"]
 */
function parseAttributes(attributes: unknown): YamlRecord {
    if (!Array.isArray(attributes)) return { flags: {}, enchantments: {} };

    const parsed: YamlRecord = {
        flags: {},      // { HIDE_ENCHANTS: true, HIDE_ATTRIBUTES: false }
        enchantments: {} // { FIRE_ASPECT: 1, SHARPNESS: 2 }
    };

    for (const attr of attributes as string[]) {
        // Match pattern: [TYPE] VALUE
        const match = attr.match(/^\[([^\]]+)\]\s*(.+)$/);
        if (!match) continue;

        const type = match[1].trim().toUpperCase();
        const value = match[2].trim();

        if (type === 'BOOLEAN') {
            // Format: FLAG_NAME;true/false
            const [flagName, flagValue] = value.split(';').map((s: string) => s.trim());
            if (flagName) {
                parsed.flags[flagName.toUpperCase()] = flagValue === 'true';
            }
        } else if (type === 'ENCHANTMENT') {
            // Format: ENCHANTMENT_NAME;LEVEL
            const [enchName, enchLevel] = value.split(';').map((s: string) => s.trim());
            if (enchName) {
                parsed.enchantments[enchName.toUpperCase()] = parseInt(enchLevel) || 1;
            }
        }
        // Add more attribute types here as needed
    }

    return parsed;
}

/**
 * Update YAML Document from visual data (preserves comments and formatting)
 * @param {Object} yamlDoc - The YAML Document to update
 * @param {Object} visualData - The visual data structure
 * @param {string} platform - 'java' or 'bedrock'
 * @returns {string} YAML content with preserved comments
 */
export function updateYamlDocumentFromVisual(yamlDoc: any, visualData: YamlRecord, platform: string): any {
    if (!yamlDoc) {
        // Fallback: create new YAML if document doesn't exist
        return parseVisualToYaml(visualData, platform);
    }

    try {

        // Get the document contents
        const doc = yamlDoc.contents;

        // Update title/menuName
        // For Bedrock, visualData uses 'menuName'; for Java uses 'title'
        const titleValue = visualData.menuName || visualData.title;
        if (titleValue) {
            doc.set('menuName', titleValue);
        }

        // Update type
        if (visualData.type) {
            doc.set('type', visualData.type);
        }

        // Update openCommand if present
        if (visualData.openCommand !== undefined) {
            if (visualData.openCommand && visualData.openCommand.trim() !== '') {
                doc.set('openCommand', visualData.openCommand);
            }
            // Note: we don't delete it if empty, to preserve existing value
        }

        // Update openPermission
        if (visualData.openPermission !== undefined) {
            if (visualData.openPermission && String(visualData.openPermission).trim() !== '') {
                doc.set('openPermission', visualData.openPermission);
            } else {
                doc.delete('openPermission');
            }
        }

        // Platform-specific updates
        if (platform.toLowerCase() === 'java') {
            // Update size for Java
            if (visualData.size) {
                doc.set('menuSize', normalizeMenuSize(visualData.size));
            }

            if (visualData.open_conditions !== undefined) {
                if (visualData.open_conditions) {
                    doc.set('open_conditions', visualData.open_conditions);
                } else {
                    doc.delete('open_conditions');
                }
            }

            if (visualData.open_actions !== undefined) {
                if (Array.isArray(visualData.open_actions) && visualData.open_actions.length > 0) {
                    doc.set('open_actions', visualData.open_actions);
                } else if (Array.isArray(visualData.open_actions) && visualData.open_actions.length === 0) {
                    doc.delete('open_actions');
                }
            }

            // Update items (Java format)
            if (visualData.items) {
                updateJavaItemsInDocument(doc, visualData.items);
            }

            // Update animations (Java format)
            if (visualData.animations) {
                updateJavaAnimationsInDocument(doc, visualData.animations);
            }
        } else if (platform.toLowerCase() === 'bedrock') {
            // Update Bedrock form data
            updateBedrockFormInDocument(doc, visualData);
        }

        // Return the document as string (preserves comments and fields like file_version, openCommand)
        const result = yamlDoc.toString();
        return result;
    } catch (error) {
        // Fallback to creating new YAML
        return parseVisualToYaml(visualData, platform);
    }
}

/**
 * Update Bedrock form data in YAML document
 */
function updateBedrockFormInDocument(doc: any, visualData: YamlRecord): void {
    // Update content for SIMPLE and MODAL forms
    if (visualData.type === 'SIMPLE' || visualData.type === 'MODAL') {
        if (visualData.content && visualData.content.length > 0) {
            doc.set('content', visualData.content);
        } else {
            doc.delete('content');
        }

        // Update buttons
        // CRITICAL FIX: visualData.buttons is an OBJECT/MAP, not an array
        if (visualData.buttons && typeof visualData.buttons === 'object' && Object.keys(visualData.buttons).length > 0) {
            const buttons: YamlRecord = {};
            for (const [key, btn] of Object.entries<any>(visualData.buttons)) {
                // text is REQUIRED by validator (line 339-344)
                const button: YamlRecord = { text: btn.text || '' };
                // CRITICAL FIX: visualData uses 'image' not 'icon' (from form-builder)
                if (btn.image) button.image = btn.image; // BlueMenu uses 'image' key
                if (btn.actions && btn.actions.length > 0) button.actions = btn.actions;
                // Add display_conditions if present
                if (btn.display_conditions) button.display_conditions = btn.display_conditions;
                buttons[key] = button;  // Use original key from visualData
            }
            doc.set('buttons', buttons);
        } else {
            doc.delete('buttons');
        }

        // Remove components if switching from CUSTOM
        doc.delete('components');
    } else if (visualData.type === 'CUSTOM') {
        // Update components for CUSTOM forms
        // CRITICAL FIX: visualData.components is an OBJECT/MAP, not an array
        if (visualData.components && typeof visualData.components === 'object' && Object.keys(visualData.components).length > 0) {
            const components: YamlRecord = {};
            for (const [key, comp] of Object.entries<any>(visualData.components)) {
                components[key] = serializeBedrockComponent(comp);  // Use original key from visualData
            }
            doc.set('components', components);
        } else {
            doc.delete('components');
        }

        // Remove content and buttons if switching from SIMPLE/MODAL
        doc.delete('content');
        doc.delete('buttons');
    }
}

/**
 * Update items section in YAML document
 */
function updateJavaItemsInDocument(doc: any, items: YamlRecord): void {
    // Build new items object
    const newItems: YamlRecord = {};

    let itemCounter = 1;
    for (const [slot, itemData] of Object.entries<any>(items)) {
        if (itemData && !itemData._isAnimation) {
            const cleanItemData = { ...itemData };
            delete cleanItemData._isAnimation;
            delete cleanItemData._animationKey;
            delete cleanItemData._animationData;

            const serializedItem = serializeItemData(cleanItemData);
            serializedItem.slot = parseInt(slot);

            newItems[`item${itemCounter}`] = serializedItem;
            itemCounter++;
        }
    }

    // Replace entire items section with new object
    // This preserves top-level structure while updating items
    doc.set('items', newItems);
}

/**
 * Update animations section in YAML document
 */
function updateJavaAnimationsInDocument(doc: any, visualAnimations: YamlRecord): void {
    // Collect animations from visual data
    const animations = { ...visualAnimations };

    if (Object.keys(animations).length === 0) {
        // Remove animations section if empty
        doc.delete('animations');
        return;
    }

    // Build new animations object
    const newAnimations: YamlRecord = {};

    for (const [animKey, animData] of Object.entries<any>(animations)) {
        const serializedFrames: YamlRecord = {};

        // Serialize each frame with all required fields
        if (animData.frames && typeof animData.frames === 'object') {
            for (const [frameKey, frameData] of Object.entries<any>(animData.frames)) {
                serializedFrames[frameKey] = serializeFrameData(frameData);
            }
        }

        newAnimations[animKey] = {
            interval: animData.interval || 2,
            frames: serializedFrames
        };
    }

    // Replace entire animations section with new object
    doc.set('animations', newAnimations);
}

/**
 * Serialize frame data for animations (BlueMenu format)
 * Each frame needs: name, actions, slot, itemStack
 */
function serializeFrameData(frame: YamlRecord): YamlRecord {
    const serialized: YamlRecord = {
        name: frame.name || '&f',  // Required
        actions: frame.actions || [],  // Required (can be empty array)
        slot: frame.slot !== undefined ? frame.slot : 0,  // Required
        itemStack: {
            material: frame.material || (frame.itemStack && frame.itemStack.material) || 'STONE',
            amount: frame.amount || (frame.itemStack && frame.itemStack.amount) || 1
        }
    };

    // Optional: add value for custom heads
    if (frame.value || (frame.itemStack && frame.itemStack.value)) {
        serialized.itemStack.value = frame.value || frame.itemStack.value;
    }

    // Optional properties that frames can have
    if (frame.lore && frame.lore.length > 0) {
        serialized.lore = frame.lore;
    }

    if (frame.data !== undefined) serialized.data = frame.data;
    if (frame.enchantments) serialized.enchantments = frame.enchantments;

    // Serialize attributes if present
    if (frame.attributes) {
        const attributesArray = serializeAttributes(frame.attributes);
        if (attributesArray.length > 0) {
            serialized.attributes = attributesArray;
        }
    }

    return serialized;
}

/**
 * Parse visual representation to YAML content (fallback when no document exists)
 * @param {Object} visualData - The visual data structure
 * @param {string} platform - 'java' or 'bedrock'
 * @returns {string} YAML content
 */
export function parseVisualToYaml(visualData: YamlRecord, platform: string): string {
    try {
        // Normalize platform to lowercase
        const normalizedPlatform = platform.toLowerCase();

        if (normalizedPlatform === 'java') {
            return parseJavaVisualToYaml(visualData);
        } else if (normalizedPlatform === 'bedrock') {
            return parseBedrockVisualToYaml(visualData);
        } else {
            throw new Error('Unknown platform: ' + platform);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Parse Java visual to YAML (BlueMenu format)
 */
function parseJavaVisualToYaml(visual: YamlRecord): string {
    const data: YamlRecord = {
        file_version: 1,  // Recommended by validator (line 128-131)
        menuName: visual.title,
        menuSize: normalizeMenuSize(visual.size || 27),
        type: visual.type,
        items: {}
    };

    // Add openCommand if present (recommended by validator - line 161)
    if (visual.openCommand && visual.openCommand.trim() !== '') {
        data.openCommand = visual.openCommand;
    }

    if (visual.openPermission && String(visual.openPermission).trim() !== '') {
        data.openPermission = visual.openPermission;
    }

    if (visual.open_conditions) {
        data.open_conditions = visual.open_conditions;
    }

    if (Array.isArray(visual.open_actions) && visual.open_actions.length > 0) {
        data.open_actions = visual.open_actions;
    }

    // Separate normal items from animations
    const normalItems: YamlRecord = {};
    const animationItems: YamlRecord = {};

    if (visual.items) {
        for (const [slot, itemData] of Object.entries<any>(visual.items)) {
            if (itemData) {
                // Check if this is an animation
                if (itemData._isAnimation && itemData._animationData) {
                    animationItems[slot] = itemData;
                } else {
                    normalItems[slot] = itemData;
                }
            }
        }
    }

    // Convert normal items with slot property (BlueMenu format)
    let itemCounter = 1;
    for (const [slot, itemData] of Object.entries<any>(normalItems)) {
        // Remove internal metadata before serialization
        const cleanItemData = { ...itemData };
        delete cleanItemData._isAnimation;
        delete cleanItemData._animationKey;
        delete cleanItemData._animationData;

        const serializedItem = serializeItemData(cleanItemData);
        serializedItem.slot = parseInt(slot);
        data.items[`item${itemCounter}`] = serializedItem;
        itemCounter++;
    }

    // Convert animations
    // First check if we have animations from visual.animations or from items marked as animations
    const animations: YamlRecord = {};

    // Add animations from visual.animations (if any)
    if (visual.animations && Object.keys(visual.animations).length > 0) {
        for (const [animKey, animData] of Object.entries<any>(visual.animations)) {
            const serializedFrames: YamlRecord = {};

            // Serialize each frame with all required fields
            if (animData.frames && typeof animData.frames === 'object') {
                for (const [frameKey, frameData] of Object.entries<any>(animData.frames)) {
                    serializedFrames[frameKey] = serializeFrameData(frameData);
                }
            }

            animations[animKey] = {
                interval: animData.interval || 2,
                frames: serializedFrames
            };
        }
    }

    // Add animations from items marked as animations (they have the full animation data)
    for (const [slot, itemData] of Object.entries<any>(animationItems)) {
        if (itemData._animationKey && itemData._animationData) {
            const serializedFrames: YamlRecord = {};

            // Serialize each frame with all required fields
            const animData = itemData._animationData;
            if (animData.frames && typeof animData.frames === 'object') {
                for (const [frameKey, frameData] of Object.entries<any>(animData.frames)) {
                    serializedFrames[frameKey] = serializeFrameData(frameData);
                }
            }

            animations[itemData._animationKey] = {
                interval: animData.interval || 2,
                frames: serializedFrames
            };
        }
    }

    // Only add animations section if we have animations
    if (Object.keys(animations).length > 0) {
        data.animations = animations;
    }

    // Convert to YAML using eemeli/yaml
    return YAML.stringify(data, {
        indent: 2,
        lineWidth: 0,  // 0 = unlimited
        aliasDuplicateObjects: false
    });
}

/**
 * Parse Bedrock visual to YAML
 */
function parseBedrockVisualToYaml(visual: YamlRecord): string {
    const data: YamlRecord = {
        file_version: 1,  // Recommended by validator (line 128-131)
        menuName: visual.menuName || visual.title || 'Untitled Form',
        type: visual.type
    };

    // Add openCommand if present (recommended by validator - line 305)
    if (visual.openCommand && visual.openCommand.trim() !== '') {
        data.openCommand = visual.openCommand;
    }

    // Add content for SIMPLE and MODAL forms
    if ((visual.type === 'SIMPLE' || visual.type === 'MODAL') && visual.content && visual.content.length > 0) {
        data.content = visual.content;
    }

    // Add buttons for SIMPLE and MODAL forms
    // CRITICAL FIX: visualData.buttons is an OBJECT/MAP, not an array (from form-builder)
    if ((visual.type === 'SIMPLE' || visual.type === 'MODAL') && visual.buttons && typeof visual.buttons === 'object' && Object.keys(visual.buttons).length > 0) {
        // Already in BlueMenu map format: { button1: {...}, button2: {...} }
        data.buttons = {};
        for (const [key, btn] of Object.entries<any>(visual.buttons)) {
            // text is REQUIRED by validator (line 339-344)
            const button: YamlRecord = { text: btn.text || '' };
            // CRITICAL FIX: visualData uses 'image' not 'icon' (from form-builder)
            // BlueMenu YAML uses 'image' key for button icons
            if (btn.image) button.image = btn.image;
            if (btn.actions && btn.actions.length > 0) button.actions = btn.actions;
            // Add display_conditions if present
            if (btn.display_conditions) button.display_conditions = btn.display_conditions;
            data.buttons[key] = button;  // Use original key from visualData
        }
    }

    // Add components for CUSTOM forms
    // CRITICAL FIX: visualData.components is an OBJECT/MAP, not an array (from form-builder)
    if (visual.type === 'CUSTOM' && visual.components && typeof visual.components === 'object' && Object.keys(visual.components).length > 0) {
        // Already in BlueMenu map format: { component1: {...}, component2: {...} }
        data.components = {};
        for (const [key, comp] of Object.entries<any>(visual.components)) {
            data.components[key] = serializeBedrockComponent(comp);  // Use original key from visualData
        }
    }

    // Convert to YAML
    return YAML.stringify(data, {
        indent: 2,
        lineWidth: 0,  // 0 = unlimited
        aliasDuplicateObjects: false
    });
}

/**
 * Serialize a Bedrock component to YAML format
 */
function serializeBedrockComponent(comp: YamlRecord): YamlRecord {
    const serialized: YamlRecord = {
        type: comp.type,
        text: comp.text || ''
    };

    // Type-specific properties
    switch (comp.type) {
        case 'INPUT':
            if (comp.placeholder) serialized.placeholder = comp.placeholder;
            if (comp.default) serialized.default = comp.default;
            break;
        case 'DROPDOWN':
            if (comp.options && comp.options.length > 0) serialized.options = comp.options;
            if (comp.default !== undefined) serialized.default = comp.default;
            break;
        case 'TOGGLE':
            if (comp.default !== undefined) serialized.default = comp.default;
            break;
        case 'SLIDER':
            serialized.min = comp.min !== undefined ? comp.min : 0;
            serialized.max = comp.max !== undefined ? comp.max : 100;
            serialized.step = comp.step !== undefined ? comp.step : 1;
            if (comp.default !== undefined) serialized.default = comp.default;
            break;
        case 'STEPSLIDER':
            if (comp.steps && comp.steps.length > 0) serialized.steps = comp.steps;
            if (comp.default !== undefined) serialized.default = comp.default;
            break;
    }

    // Actions (if present and not empty)
    if (comp.actions && comp.actions.length > 0) {
        serialized.actions = comp.actions;
    }

    // Display conditions (if present)
    if (comp.display_conditions) {
        serialized.display_conditions = comp.display_conditions;
    }

    return serialized;
}

/**
 * Serialize item data for YAML output (BlueMenu format)
 */
function serializeItemData(item: YamlRecord): YamlRecord {
    const serialized: YamlRecord = {};

    // Name (REQUIRED by validator - line 234)
    serialized.name = item.name || '&f';

    // ItemStack section (BlueMenu format)
    // Both material and amount are REQUIRED by validator (lines 256-272)
    serialized.itemStack = {
        material: item.material || 'STONE',
        amount: item.amount || 1
    };

    // Add value for custom heads
    if (item.value) {
        serialized.itemStack.value = item.value;
    }

    // Lore
    if (item.lore && item.lore.length > 0) {
        serialized.lore = item.lore;
    }

    // Data
    if (item.data !== undefined) serialized.data = item.data;

    // Enchantments
    if (item.enchantments) serialized.enchantments = item.enchantments;

    // Serialize attributes (convert internal representation to BlueMenu format)
    if (item.attributes) {
        const attributesArray = serializeAttributes(item.attributes);
        if (attributesArray.length > 0) {
            serialized.attributes = attributesArray;
        }
    }

    // Actions
    if (item.actions && item.actions.length > 0) {
        serialized.actions = item.actions;
    }

    // Priority
    if (item.priority !== undefined && item.priority !== null) {
        serialized.priority = item.priority;
    }

    // Conditions
    if (item.condition) serialized.condition = item.condition; // Legacy support
    if (item.display_conditions) serialized.display_conditions = item.display_conditions;

    // Other properties
    if (item['custom-model-data']) serialized['custom-model-data'] = item['custom-model-data'];
    if (item.skull) serialized.skull = item.skull;
    if (item.color) serialized.color = item.color;
    if (item.potion) serialized.potion = item.potion;

    return serialized;
}

/**
 * Serialize attributes to BlueMenu YAML format
 * Input: { flags: { HIDE_ENCHANTS: true }, enchantments: { FIRE_ASPECT: 1 } }
 * Output: ["[BOOLEAN] HIDE_ENCHANTS;true", "[ENCHANTMENT] FIRE_ASPECT;1"]
 */
function serializeAttributes(attributes: YamlRecord): string[] {
    const result: string[] = [];

    // Serialize BOOLEAN flags
    if (attributes.flags) {
        for (const [flagName, flagValue] of Object.entries<any>(attributes.flags)) {
            result.push(`[BOOLEAN] ${flagName};${flagValue}`);
        }
    }

    // Serialize ENCHANTMENT attributes
    if (attributes.enchantments) {
        for (const [enchName, enchLevel] of Object.entries<any>(attributes.enchantments)) {
            result.push(`[ENCHANTMENT] ${enchName};${enchLevel}`);
        }
    }

    return result;
}

/**
 * Validate visual data structure
 */
export function validateVisualData(visualData: YamlRecord, platform: string): ValidationResult {
    const errors: string[] = [];

    if (!visualData) {
        errors.push('Visual data is null or undefined');
        return { valid: false, errors };
    }

    if (platform === 'java') {
        // Validate Java menu
        if (!visualData.type || !VALID_MENU_TYPES.JAVA.includes(visualData.type)) {
            errors.push(`Invalid menu type: ${visualData.type}`);
        }

        if (visualData.type === 'CHEST') {
            if (!visualData.size || !VALID_CHEST_SIZES.includes(visualData.size)) {
                errors.push(`Invalid chest size: ${visualData.size}`);
            }
        }

        // Validate items
        if (visualData.items) {
            for (const [slot, itemData] of Object.entries<any>(visualData.items)) {
                const slotNum = parseInt(slot);
                if (isNaN(slotNum) || slotNum < 0 || slotNum >= (visualData.size || 54)) {
                    errors.push(`Invalid slot number: ${slot}`);
                }

                if (!itemData.material) {
                    errors.push(`Item in slot ${slot} missing material`);
                }
            }
        }

    } else if (platform === 'bedrock') {
        // Validate Bedrock form
        if (!visualData.type || !VALID_MENU_TYPES.BEDROCK.includes(visualData.type)) {
            errors.push(`Invalid form type: ${visualData.type}`);
        }

        if (!visualData.title) {
            errors.push('Form title is required');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
