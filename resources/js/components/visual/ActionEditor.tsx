import { useState } from 'react';
import { ACTION_TYPES, CLICK_TYPES, buildActionString, describeAction, parseAction } from '../../editor/actions';
import { Modal } from '../Modal';

interface ActionEditorProps {
    actions: string[];
    onChange: (actions: string[]) => void;
}

/** Click actions of one item, edited in a dialog as the legacy editor did. */
export function ActionEditor({ actions, onChange }: ActionEditorProps) {
    const [editing, setEditing] = useState<number | null>(null);
    const [dragged, setDragged] = useState<number | null>(null);

    const close = (): void => setEditing(null);

    return (
        <>
            <div className="section-heading">
                <span>Actions</span>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                        onChange([...actions, '[LEFT_CLICK] CLOSE']);
                        setEditing(actions.length);
                    }}
                >
                    + Add
                </button>
            </div>

            <div className="actions-list">
                {actions.length === 0 && (
                    <div className="actions-empty">
                        <span>This item does nothing when clicked.</span>
                    </div>
                )}

                {actions.map((action, index) => {
                    const parsed = parseAction(action);

                    return (
                        <div
                            key={`${index}-${action}`}
                            className="action-item"
                            draggable
                            onDragStart={() => setDragged(index)}
                            onDragEnd={() => setDragged(null)}
                            onDragOver={event => event.preventDefault()}
                            onDrop={() => {
                                if (dragged !== null && dragged !== index) {
                                    onChange(move(actions, dragged, index));
                                }
                                setDragged(null);
                            }}
                        >
                            <div className="action-item-drag">⋮⋮</div>

                            <div className="action-item-content">
                                <div className="action-item-header">
                                    <span className="action-item-click-type">
                                        {CLICK_TYPES[parsed.clickType] ?? parsed.clickType}
                                    </span>
                                    <span className="action-item-type">{describeAction(parsed)}</span>
                                </div>
                                {parsed.params !== null && <div className="action-item-params">{parsed.params}</div>}
                            </div>

                            <div className="action-item-actions">
                                <button type="button" className="btn-icon" title="Edit" onClick={() => setEditing(index)}>
                                    ✏️
                                </button>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    title="Delete"
                                    onClick={() => onChange(actions.filter((_unused, position) => position !== index))}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {editing !== null && actions[editing] !== undefined && (
                <ActionDialog
                    action={actions[editing]}
                    onSave={value => {
                        onChange(actions.map((existing, position) => (position === editing ? value : existing)));
                        close();
                    }}
                    onClose={close}
                />
            )}
        </>
    );
}

function ActionDialog({
    action,
    onSave,
    onClose,
}: {
    action: string;
    onSave: (action: string) => void;
    onClose: () => void;
}) {
    const parsed = parseAction(action);
    const [clickType, setClickType] = useState(parsed.clickType);
    const [type, setType] = useState(parsed.type);
    const [params, setParams] = useState(parsed.params ?? '');

    const definition = ACTION_TYPES[type];

    return (
        <Modal
            title="Action"
            variant="action-editor-modal"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onSave(buildActionString(clickType, type, params === '' ? null : params))}
                    >
                        Save
                    </button>
                </>
            }
        >
            <label className="modal-label" htmlFor="action-click">
                Click
            </label>
            <select
                id="action-click"
                className="modal-select"
                value={clickType}
                onChange={event => setClickType(event.target.value)}
            >
                {Object.entries(CLICK_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>

            <label className="modal-label" htmlFor="action-type">
                Action
            </label>
            <select
                id="action-type"
                className="modal-select"
                value={type}
                onChange={event => {
                    setType(event.target.value);
                    setParams('');
                }}
            >
                {Object.entries(ACTION_TYPES).map(([value, entry]) => (
                    <option key={value} value={value}>
                        {entry.name}
                    </option>
                ))}
            </select>

            {definition !== undefined && <p className="empty-note">{definition.description}</p>}

            {definition?.hasParams && (
                <>
                    <label className="modal-label" htmlFor="action-params">
                        {definition.fields.map(field => field.label).join(' ; ')}
                    </label>
                    {definition.fields[0]?.type === 'textarea' ? (
                        <textarea
                            id="action-params"
                            className="modal-input"
                            rows={3}
                            value={params}
                            placeholder={definition.fields[0]?.placeholder}
                            onChange={event => setParams(event.target.value)}
                        />
                    ) : (
                        <input
                            id="action-params"
                            className="modal-input"
                            value={params}
                            placeholder={definition.fields.map(field => field.placeholder).join(';')}
                            onChange={event => setParams(event.target.value)}
                        />
                    )}
                    <p className="empty-note">{definition.fields[0]?.hint}</p>
                </>
            )}
        </Modal>
    );
}

function move(actions: string[], from: number, to: number): string[] {
    const next = [...actions];
    const [moved] = next.splice(from, 1);

    if (moved !== undefined) {
        next.splice(to, 0, moved);
    }

    return next;
}
