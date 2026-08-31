/**
 * Click actions, stored in YAML as "[CLICK_TYPE] ACTION_TYPE;params".
 *
 * The catalogue mirrors what the plugin's action manager dispatches, so the
 * editor never offers an action the server would ignore.
 */

export interface ActionField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'number';
    placeholder: string;
    hint: string;
    required: boolean;
}

export interface ActionType {
    name: string;
    description: string;
    hasParams: boolean;
    fields: ActionField[];
}

export interface ParsedAction {
    clickType: string;
    type: string;
    params: string | null;
}

export const CLICK_TYPES: Record<string, string> = {
    LEFT_CLICK: 'Left Click',
    RIGHT_CLICK: 'Right Click',
    SHIFT_LEFT_CLICK: 'Shift + Left Click',
    SHIFT_RIGHT_CLICK: 'Shift + Right Click',
    MIDDLE_CLICK: 'Middle Click',
    BOTH: 'Left + Right Click',
    BOTH_SHIFT: 'Shift Left + Shift Right',
    ALL: 'All Clicks',
};

export const ACTION_TYPES: Record<string, ActionType> = {
    CLOSE: { name: 'Close Menu', description: 'Close the current menu', hasParams: false, fields: [] },
    REFRESH_MENU: {
        name: 'Refresh Menu',
        description: 'Reload the current menu for the player',
        hasParams: false,
        fields: [],
    },
    OPEN_MENU: {
        name: 'Open Menu',
        description: 'Open another menu by name (Java)',
        hasParams: true,
        fields: [
            {
                id: 'menu',
                label: 'Menu Name',
                type: 'text',
                placeholder: 'lobby_menu',
                hint: 'Menu name defined in java_menus.',
                required: true,
            },
        ],
    },
    CONSOLE: {
        name: 'Run Command (Console)',
        description: 'Run a command from the server console',
        hasParams: true,
        fields: [
            {
                id: 'command',
                label: 'Command',
                type: 'text',
                placeholder: 'give {player_name} diamond 1',
                hint: 'Command to run, without the slash. Placeholders such as {player_name} are supported.',
                required: true,
            },
        ],
    },
    PLAYER: {
        name: 'Run Command (Player)',
        description: 'Run a command as if the player typed it',
        hasParams: true,
        fields: [
            {
                id: 'command',
                label: 'Command',
                type: 'text',
                placeholder: 'spawn',
                hint: 'Command to run, without the slash. Placeholders such as {player_name} are supported.',
                required: true,
            },
        ],
    },
    MESSAGE: {
        name: 'Send Message',
        description: 'Send a message to the player',
        hasParams: true,
        fields: [
            {
                id: 'message',
                label: 'Message',
                type: 'textarea',
                placeholder: '<aqua>Welcome to the server!</aqua>',
                hint: 'Supports MiniMessage formatting and placeholders.',
                required: true,
            },
        ],
    },
    BROADCAST: {
        name: 'Broadcast',
        description: 'Send a global message to the server',
        hasParams: true,
        fields: [
            {
                id: 'broadcast',
                label: 'Global Message',
                type: 'textarea',
                placeholder: '<yellow>Global event in 5 minutes</yellow>',
                hint: 'Supports MiniMessage formatting and placeholders.',
                required: true,
            },
        ],
    },
    SOUND: {
        name: 'Play Sound',
        description: 'Play a sound for the player (sound;volume;pitch)',
        hasParams: true,
        fields: [
            {
                id: 'sound',
                label: 'Sound',
                type: 'text',
                placeholder: 'ENTITY_EXPERIENCE_ORB_PICKUP',
                hint: 'Bukkit sound name.',
                required: true,
            },
            { id: 'volume', label: 'Volume', type: 'number', placeholder: '1.0', hint: 'Optional, defaults to 1.0.', required: false },
            { id: 'pitch', label: 'Pitch', type: 'number', placeholder: '1.0', hint: 'Optional, defaults to 1.0.', required: false },
        ],
    },
    CONNECT: {
        name: 'Connect (Proxy)',
        description: 'Send the player to another server through the configured proxy',
        hasParams: true,
        fields: [
            {
                id: 'proxyServer',
                label: 'Server',
                type: 'text',
                placeholder: 'lobby',
                hint: 'Server name in your proxy.',
                required: true,
            },
        ],
    },
};

const ACTION_PATTERN = /^\[([^\]]+)\]\s+([^;]+)(?:;(.+))?$/;

export function parseAction(actionString: string): ParsedAction {
    const match = ACTION_PATTERN.exec(actionString);

    if (match === null) {
        return { clickType: 'LEFT_CLICK', type: 'CLOSE', params: null };
    }

    return {
        clickType: match[1],
        type: normalizeActionType(match[2]),
        params: match[3] ?? null,
    };
}

export function buildActionString(clickType: string, actionType: string, params: string | null): string {
    const definition = ACTION_TYPES[actionType];

    if (definition?.hasParams && params) {
        return `[${clickType}] ${actionType};${params}`;
    }

    return `[${clickType}] ${actionType}`;
}

export function describeAction(action: ParsedAction): string {
    const definition = ACTION_TYPES[action.type];

    return definition?.name ?? action.type;
}

/**
 * The proxy actions differ only in which proxy the server runs, and the editor
 * offers a single CONNECT entry for both.
 */
function normalizeActionType(actionType: string): string {
    const trimmed = actionType.trim();

    return trimmed === 'CONNECT_BUNGEE' || trimmed === 'CONNECT_VELOCITY' ? 'CONNECT' : trimmed;
}
