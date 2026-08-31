import { formatMaterialName } from '../../editor/materials';
import { ActionEditor } from './ActionEditor';
import { AttributeEditor } from './AttributeEditor';
import { ConditionEditor } from './ConditionEditor';
import { FormattedInput } from './FormattedInput';
import { ItemIcon } from './ItemIcon';
import { ItemPreview } from './ItemPreview';
import { MaterialSelector } from './MaterialSelector';
import type { VisualItem } from '../../editor/model';

interface ItemEditorProps {
    slot: number;
    item: VisualItem | undefined;
    serverVersion: string | null;
    onChange: (item: VisualItem) => void;
    onRemove: () => void;
}

export function ItemEditor({ slot, item, serverVersion, onChange, onRemove }: ItemEditorProps) {
    if (item === undefined) {
        return (
            <div className="item-editor-notice">
                Slot {slot} is empty. Drop a material on it, or pick one from the palette.
            </div>
        );
    }

    const update = (patch: Partial<VisualItem>): void => onChange({ ...item, ...patch });
    const lore = Array.isArray(item.lore) ? item.lore : [];
    const actions = Array.isArray(item.actions) ? (item.actions as unknown as string[]) : [];

    return (
        <>
            <div className="item-editor-header">
                <div className="palette-item-icon">
                    <ItemIcon item={item} serverVersion={serverVersion} variant="palette" />
                </div>
                <div className="menu-item-info">
                    <div className="menu-item-name">{formatMaterialName(item.material)}</div>
                    <div className="menu-item-meta">Slot {slot}</div>
                </div>
                <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
                    Remove
                </button>
            </div>

            <div className="item-editor-body">
                <div className="item-editor-section">
                    <ItemPreview item={item} serverVersion={serverVersion} />
                </div>

                <div className="item-editor-section">
                    <div className="editor-field">
                        <span className="item-label">Material</span>
                        <MaterialSelector
                            material={item.material}
                            serverVersion={serverVersion}
                            onChange={material => update({ material })}
                        />
                    </div>

                    <div className="editor-field">
                        <label className="item-label" htmlFor="item-amount">Amount</label>
                        <input
                            id="item-amount"
                            className="item-input"
                            type="number"
                            min={1}
                            max={64}
                            value={item.amount}
                            onChange={event => update({ amount: Number(event.target.value) })}
                        />
                    </div>

                    {item.material === 'PLAYER_HEAD' && (
                        <div className="editor-field">
                            <label className="item-label" htmlFor="item-head">Head texture</label>
                            <input
                                id="item-head"
                                className="item-input"
                                value={typeof item.value === 'string' ? item.value : ''}
                                onChange={event => update({ value: event.target.value })}
                            />
                            <span className="field-hint">Player name, texture URL or base64 value</span>
                        </div>
                    )}
                </div>

                <div className="item-editor-section">
                    <div className="editor-field">
                        <span className="item-label">Name</span>
                        <FormattedInput
                            ariaLabel="Item name"
                            value={typeof item.name === 'string' ? item.name : ''}
                            onChange={name => update({ name })}
                        />
                    </div>

                    <div className="editor-field">
                        <span className="item-label">Lore</span>
                        <FormattedInput
                            ariaLabel="Item lore"
                            multiline
                            rows={4}
                            value={lore.join('\n')}
                            onChange={text => update({ lore: text.split('\n') })}
                        />
                        <span className="field-hint">One line per row</span>
                    </div>
                </div>

                <div className="item-editor-section">
                    <ActionEditor
                        actions={actions}
                        onChange={next => update({ actions: next as unknown as VisualItem['actions'] })}
                    />
                </div>

                <div className="item-editor-section">
                    <AttributeEditor attributes={item.attributes} onChange={next => update({ attributes: next })} />
                </div>

                <div className="item-editor-section">
                    <ConditionEditor
                        label="Display conditions"
                        conditions={item.display_conditions}
                        onChange={next => update({ display_conditions: next })}
                    />
                </div>
            </div>
        </>
    );
}
