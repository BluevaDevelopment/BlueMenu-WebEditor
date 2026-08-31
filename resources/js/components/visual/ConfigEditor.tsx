import { useMemo } from 'react';
import * as YAML from 'yaml';
import { CONFIG_SECTIONS, type ConfigField } from '../../editor/configSchema';

interface ConfigEditorProps {
    source: string;
    onChange: (source: string) => void;
}

/**
 * settings.yml as a form.
 *
 * Every change is written into the parsed document, so the long comment blocks
 * the plugin ships the file with are still there afterwards.
 */
export function ConfigEditor({ source, onChange }: ConfigEditorProps) {
    const document = useMemo(() => {
        try {
            return YAML.parseDocument(source);
        } catch {
            return null;
        }
    }, [source]);

    if (document === null || document.errors.length > 0) {
        return (
            <div className="item-editor-content">
                <p>This file does not parse as YAML.</p>
                <p>Fix it in the text editor before using the form.</p>
            </div>
        );
    }

    const write = (path: string[], value: unknown): void => {
        const next = YAML.parseDocument(source);

        if (value === null || value === '') {
            next.deleteIn(path);
        } else {
            next.setIn(path, value);
        }

        onChange(String(next));
    };

    const read = (field: ConfigField): unknown => document.getIn(field.path);

    return (
        <div className="config-visual-editor">
            <div className="config-visual-header">
                <div>
                    <div className="config-visual-title">Plugin Configuration</div>
                    <div className="config-visual-subtitle">
                        Edit settings.yml visually. Comments are shown under each field.
                    </div>
                </div>
                <div className="config-visual-badge">settings.yml</div>
            </div>

            <div className="config-visual-content">
                {CONFIG_SECTIONS.map(section => (
                    <div key={section.id} className="settings-section">
                        <div className="config-section-title">{section.title}</div>
                        <div className="config-section-description">{section.description}</div>

                        {section.fields.map(field => (
                            <div key={field.path.join('.')} className="setting-group">
                                <div className="config-field-label">{field.label}</div>
                                <div className="config-field-description">{field.description}</div>
                                <Control field={field} value={read(field)} onChange={value => write(field.path, value)} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Control({
    field,
    value,
    onChange,
}: {
    field: ConfigField;
    value: unknown;
    onChange: (value: unknown) => void;
}) {
    switch (field.type) {
        case 'toggle':
            return (
                <label className="editor-row">
                    <input type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)} />
                    <span>{value === true ? 'Enabled' : 'Disabled'}</span>
                </label>
            );

        case 'select':
            return (
                <select
                    className="inline-input"
                    value={String(value ?? '')}
                    onChange={event => onChange(event.target.value)}
                    aria-label={field.label}
                >
                    {(field.options ?? []).map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );

        case 'number':
            return (
                <input
                    type="number"
                    className="inline-input"
                    min={field.min}
                    max={field.max}
                    value={typeof value === 'number' ? value : ''}
                    onChange={event => onChange(event.target.value === '' ? null : Number(event.target.value))}
                    aria-label={field.label}
                />
            );

        case 'list':
            return (
                <textarea
                    className="inline-input"
                    rows={Math.min(10, Math.max(3, toLines(value).length + 1))}
                    value={toLines(value).join('\n')}
                    onChange={event => onChange(fromLines(event.target.value))}
                    aria-label={field.label}
                />
            );

        default:
            return (
                <input
                    className="inline-input"
                    value={typeof value === 'string' ? value : ''}
                    placeholder={field.placeholder}
                    onChange={event => onChange(event.target.value)}
                    aria-label={field.label}
                />
            );
    }
}

function toLines(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map(String);
    }

    if (value !== null && typeof value === 'object' && 'toJSON' in value) {
        const plain = (value as { toJSON: () => unknown }).toJSON();

        return Array.isArray(plain) ? plain.map(String) : [];
    }

    return [];
}

function fromLines(text: string): string[] | null {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    return lines.length === 0 ? null : lines;
}
