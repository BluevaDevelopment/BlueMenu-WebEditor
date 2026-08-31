import { ActionEditor } from './ActionEditor';
import { ConditionEditor } from './ConditionEditor';
import type { YamlRecord } from '../../editor/model';

interface BedrockComponentEditorProps {
    component: YamlRecord;
    onChange: (component: YamlRecord) => void;
    onRemove: () => void;
}

export const COMPONENT_TYPES: readonly string[] = ['LABEL', 'INPUT', 'DROPDOWN', 'TOGGLE', 'SLIDER', 'STEPSLIDER'];

/**
 * One field of a CUSTOM form. Which inputs are shown follows the component
 * type, because the plugin reads a different set of keys for each.
 */
export function BedrockComponentEditor({ component, onChange, onRemove }: BedrockComponentEditorProps) {
    const update = (patch: YamlRecord): void => onChange({ ...component, ...patch });
    const type = String(component.type ?? 'LABEL');

    return (
        <article className="entry-card">
            <header className="entry-card-header">
                <select
                    value={type}
                    onChange={event => update({ type: event.target.value })}
                    aria-label="Component type"
                    className="inline-input"
                >
                    {COMPONENT_TYPES.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <button type="button" onClick={onRemove} className="btn btn-danger btn-sm">
                    Remove
                </button>
            </header>

            <Text label="Text" value={String(component.text ?? '')} onChange={text => update({ text })} />

            {type === 'INPUT' && (
                <>
                    <Text
                        label="Placeholder"
                        value={String(component.placeholder ?? '')}
                        onChange={placeholder => update({ placeholder })}
                    />
                    <Text label="Default" value={String(component.default ?? '')} onChange={value => update({ default: value })} />
                </>
            )}

            {type === 'DROPDOWN' && (
                <>
                    <Lines
                        label="Options"
                        values={toStringList(component.options)}
                        onChange={options => update({ options })}
                    />
                    <Number label="Default index" value={toNumber(component.default, 0)} onChange={value => update({ default: value })} />
                </>
            )}

            {type === 'TOGGLE' && (
                <label className="editor-row">
                    <input
                        type="checkbox"
                        checked={component.default === true}
                        onChange={event => update({ default: event.target.checked })}
                    />
                    On by default
                </label>
            )}

            {type === 'SLIDER' && (
                <div className="editor-row">
                    <Number label="Min" value={toNumber(component.min, 0)} onChange={min => update({ min })} />
                    <Number label="Max" value={toNumber(component.max, 100)} onChange={max => update({ max })} />
                    <Number label="Step" value={toNumber(component.step, 1)} onChange={step => update({ step })} />
                    <Number label="Default" value={toNumber(component.default, 50)} onChange={value => update({ default: value })} />
                </div>
            )}

            {type === 'STEPSLIDER' && (
                <>
                    <Lines label="Steps" values={toStringList(component.steps)} onChange={steps => update({ steps })} />
                    <Number label="Default index" value={toNumber(component.default, 0)} onChange={value => update({ default: value })} />
                </>
            )}

            <ActionEditor
                actions={toStringList(component.actions)}
                onChange={actions => update({ actions })}
            />

            <ConditionEditor
                label="Display conditions"
                conditions={component.display_conditions}
                onChange={next => update({ display_conditions: next })}
            />
        </article>
    );
}

const inputClass = 'inline-input';

function Text({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label>
            {label}
            <input value={value} onChange={event => onChange(event.target.value)} className={inputClass} />
        </label>
    );
}

function Number({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    return (
        <label>
            {label}
            <input
                type="number"
                value={value}
                onChange={event => onChange(globalThis.Number(event.target.value))}
                className={inputClass}
            />
        </label>
    );
}

function Lines({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
    return (
        <label>
            {label} (one per line)
            <textarea
                rows={3}
                value={values.join('\n')}
                onChange={event => onChange(event.target.value.split('\n').filter(line => line !== ''))}
                className={inputClass}
            />
        </label>
    );
}

function toStringList(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : [];
}

function toNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' ? value : fallback;
}
