import { useState } from 'react';
import {
    CONDITION_OPERATORS,
    buildCondition,
    parseCondition,
    readConditions,
    writeConditions,
    type ConditionGroup,
    type ConditionSet,
} from '../../editor/conditions';
import { Modal } from '../Modal';
import type { YamlRecord } from '../../editor/model';

interface ConditionEditorProps {
    label: string;
    conditions: unknown;
    onChange: (conditions: string[] | YamlRecord | null) => void;
}

const GROUPS: { key: ConditionGroup; label: string; hint: string }[] = [
    { key: 'all', label: 'All of', hint: 'Every condition must hold' },
    { key: 'any', label: 'Any of', hint: 'At least one must hold' },
    { key: 'none', label: 'None of', hint: 'None may hold' },
];

type Editing = { group: ConditionGroup | null; index: number } | null;

export function ConditionEditor({ label, conditions, onChange }: ConditionEditorProps) {
    const [set, setSet] = useState<ConditionSet>(() => readConditions(conditions));
    const [editing, setEditing] = useState<Editing>(null);

    const commit = (next: ConditionSet): void => {
        setSet(next);
        onChange(writeConditions(next));
    };

    const entriesOf = (group: ConditionGroup | null): string[] =>
        group === null ? set.simple : set.groups[group];

    const replace = (group: ConditionGroup | null, entries: string[]): void =>
        group === null
            ? commit({ ...set, simple: entries })
            : commit({ ...set, groups: { ...set.groups, [group]: entries } });

    return (
        <>
            <div className="section-heading">
                <span>{label}</span>
                <select
                    className="inline-input"
                    style={{ width: 'auto' }}
                    value={set.mode}
                    onChange={event => commit({ ...set, mode: event.target.value as ConditionSet['mode'] })}
                    aria-label="Condition mode"
                >
                    <option value="simple">All must hold</option>
                    <option value="grouped">Grouped logic</option>
                </select>
            </div>

            {set.mode === 'simple' ? (
                <ConditionList
                    entries={set.simple}
                    onAdd={() => {
                        replace(null, [...set.simple, '{player_level} >= 1']);
                        setEditing({ group: null, index: set.simple.length });
                    }}
                    onEdit={index => setEditing({ group: null, index })}
                    onDelete={index => replace(null, set.simple.filter((_unused, position) => position !== index))}
                />
            ) : (
                GROUPS.map(group => (
                    <div key={group.key} className="condition-group">
                        <div className="condition-group-header">
                            <span className="condition-group-label" title={group.hint}>
                                {group.label}
                            </span>
                        </div>
                        <ConditionList
                            entries={set.groups[group.key]}
                            onAdd={() => {
                                replace(group.key, [...set.groups[group.key], '{player_level} >= 1']);
                                setEditing({ group: group.key, index: set.groups[group.key].length });
                            }}
                            onEdit={index => setEditing({ group: group.key, index })}
                            onDelete={index =>
                                replace(
                                    group.key,
                                    set.groups[group.key].filter((_unused, position) => position !== index),
                                )
                            }
                        />
                    </div>
                ))
            )}

            {editing !== null && entriesOf(editing.group)[editing.index] !== undefined && (
                <ConditionDialog
                    condition={entriesOf(editing.group)[editing.index]}
                    onSave={value => {
                        replace(
                            editing.group,
                            entriesOf(editing.group).map((entry, position) => (position === editing.index ? value : entry)),
                        );
                        setEditing(null);
                    }}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function ConditionList({
    entries,
    onAdd,
    onEdit,
    onDelete,
}: {
    entries: string[];
    onAdd: () => void;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}) {
    return (
        <div className="conditions-list">
            {entries.length === 0 && <div className="conditions-empty">No conditions, so this always shows.</div>}

            {entries.map((entry, index) => (
                <div key={`${index}-${entry}`} className="condition-item">
                    <div className="condition-item-content">
                        <code>{entry}</code>
                    </div>
                    <div className="condition-item-actions">
                        <button type="button" className="btn-icon" title="Edit" onClick={() => onEdit(index)}>
                            ✏️
                        </button>
                        <button type="button" className="btn-icon" title="Delete" onClick={() => onDelete(index)}>
                            🗑️
                        </button>
                    </div>
                </div>
            ))}

            <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
                + Add condition
            </button>
        </div>
    );
}

function ConditionDialog({
    condition,
    onSave,
    onClose,
}: {
    condition: string;
    onSave: (condition: string) => void;
    onClose: () => void;
}) {
    const parsed = parseCondition(condition);
    const [placeholder, setPlaceholder] = useState(parsed.placeholder);
    const [operator, setOperator] = useState(parsed.operator);
    const [value, setValue] = useState(parsed.value);

    const preview = buildCondition({ placeholder, operator, value });

    return (
        <Modal
            title="Condition"
            variant="condition-editor-modal"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => onSave(preview)}>
                        Save
                    </button>
                </>
            }
        >
            <label className="modal-label" htmlFor="condition-placeholder">
                Placeholder
            </label>
            <input
                id="condition-placeholder"
                className="modal-input"
                value={placeholder}
                placeholder="{player_level}"
                onChange={event => setPlaceholder(event.target.value)}
            />

            <label className="modal-label" htmlFor="condition-operator">
                Operator
            </label>
            <select
                id="condition-operator"
                className="modal-select"
                value={operator}
                onChange={event => setOperator(event.target.value)}
            >
                {CONDITION_OPERATORS.map(entry => (
                    <option key={entry} value={entry}>
                        {entry}
                    </option>
                ))}
            </select>

            <label className="modal-label" htmlFor="condition-value">
                Value
            </label>
            <input
                id="condition-value"
                className="modal-input"
                value={value}
                placeholder="10"
                onChange={event => setValue(event.target.value)}
            />

            <div className="condition-preview-full">{preview}</div>
        </Modal>
    );
}
