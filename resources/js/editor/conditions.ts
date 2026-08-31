import type { YamlRecord } from './model';

/**
 * Display and open conditions.
 *
 * The plugin accepts three shapes: a plain list, meaning every entry must hold,
 * or an all/any/none grouping. Both are edited here through the same model.
 */

export type ConditionGroup = 'all' | 'any' | 'none';

export interface Condition {
    placeholder: string;
    operator: string;
    value: string;
}

export interface ConditionSet {
    mode: 'simple' | 'grouped';
    simple: string[];
    groups: Record<ConditionGroup, string[]>;
}

export const CONDITION_OPERATORS: readonly string[] = [
    '>=',
    '<=',
    '==',
    '!=',
    '>',
    '<',
    'equals',
    'equalsIgnoreCase',
    'contains',
    'startsWith',
    'endsWith',
    'matches',
];

/** Longest first, so ">=" is never mistaken for ">". */
const MATCH_ORDER: readonly string[] = [
    '>=',
    '<=',
    '==',
    '!=',
    '>',
    '<',
    ' startsWith ',
    ' endsWith ',
    ' contains ',
    ' equalsIgnoreCase ',
    ' matches ',
    ' equals ',
];

export const EMPTY_CONDITION_SET: ConditionSet = {
    mode: 'simple',
    simple: [],
    groups: { all: [], any: [], none: [] },
};

export function parseCondition(conditionString: string): Condition {
    for (const operator of MATCH_ORDER) {
        if (!conditionString.includes(operator)) {
            continue;
        }

        const parts = conditionString.split(operator);

        if (parts.length >= 2) {
            return {
                placeholder: parts[0].trim(),
                operator: operator.trim(),
                value: unquote(parts.slice(1).join(operator).trim()),
            };
        }
    }

    return { placeholder: conditionString.trim(), operator: '>=', value: '' };
}

export function buildCondition(condition: Condition): string {
    return `${condition.placeholder} ${condition.operator} ${condition.value}`.trim();
}

/**
 * Reads whatever the YAML holds into the editable model.
 */
export function readConditions(raw: unknown): ConditionSet {
    if (Array.isArray(raw)) {
        return { ...EMPTY_CONDITION_SET, mode: 'simple', simple: raw.map(String) };
    }

    if (raw !== null && typeof raw === 'object') {
        const record = raw as YamlRecord;

        return {
            mode: 'grouped',
            simple: [],
            groups: {
                all: toList(record.all),
                any: toList(record.any),
                none: toList(record.none),
            },
        };
    }

    return EMPTY_CONDITION_SET;
}

/**
 * Writes the model back, dropping it entirely when nothing is configured so an
 * empty section never lands in the file.
 */
export function writeConditions(set: ConditionSet): string[] | YamlRecord | null {
    if (set.mode === 'simple') {
        return set.simple.length === 0 ? null : set.simple;
    }

    const groups: YamlRecord = {};

    for (const group of ['all', 'any', 'none'] as ConditionGroup[]) {
        if (set.groups[group].length > 0) {
            groups[group] = set.groups[group];
        }
    }

    return Object.keys(groups).length === 0 ? null : groups;
}

function toList(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : [];
}

function unquote(value: string): string {
    return value.replace(/^['"]|['"]$/g, '');
}
