import { useMemo, useState } from 'react';
import { parseMiniMessage } from '../../editor/miniMessage';
import { applyVisualEdit, readVisual } from '../../editor/yamlDocument';
import { BedrockComponentEditor } from './BedrockComponentEditor';
import { BedrockButtonEditor } from './BedrockButtonEditor';
import type { VisualBedrockButton, VisualBedrockMenu, YamlRecord } from '../../editor/model';

interface FormBuilderProps {
    source: string;
    serverVersion: string | null;
    onChange: (source: string) => void;
}

const COMPONENT_PALETTE: { type: string; icon: string; name: string; description: string }[] = [
    { type: 'LABEL', icon: '📝', name: 'Label', description: 'Informational text' },
    { type: 'INPUT', icon: '✏️', name: 'Text Field', description: 'Text input' },
    { type: 'DROPDOWN', icon: '📋', name: 'Dropdown', description: 'List of options' },
    { type: 'TOGGLE', icon: '🔘', name: 'Toggle', description: 'True/False' },
    { type: 'SLIDER', icon: '🎚️', name: 'Slider', description: 'Numeric value' },
    { type: 'STEPSLIDER', icon: '📊', name: 'Step Slider', description: 'Preset steps' },
];

const FORM_TYPES: { value: string; label: string }[] = [
    { value: 'SIMPLE', label: 'SIMPLE - Button List' },
    { value: 'MODAL', label: 'MODAL - Dialog (2 Buttons)' },
    { value: 'CUSTOM', label: 'CUSTOM - Form' },
];

type Selection = { kind: 'button' | 'component'; key: string } | null;

/**
 * Builds the three Bedrock form types beside a mock of the phone screen, so the
 * layout can be judged the way a Bedrock player will actually see it.
 */
export function FormBuilder({ source, onChange }: FormBuilderProps) {
    const [selected, setSelected] = useState<Selection>(null);

    const parsed = useMemo(() => {
        try {
            return { menu: readVisual(source, 'bedrock') as VisualBedrockMenu, error: null };
        } catch (error) {
            return { menu: null, error: error instanceof Error ? error.message : 'Could not read this form' };
        }
    }, [source]);

    if (parsed.menu === null) {
        return (
            <div className="item-editor-content">
                <p>{parsed.error}</p>
                <p>Fix the YAML before switching to the form builder.</p>
            </div>
        );
    }

    const menu = parsed.menu;
    const commit = (next: VisualBedrockMenu): void => onChange(applyVisualEdit(source, next, 'bedrock'));
    const isCustom = menu.type.toUpperCase() === 'CUSTOM';
    const atModalLimit = menu.type.toUpperCase() === 'MODAL' && Object.keys(menu.buttons).length >= 2;

    const addComponent = (type: string): void => {
        const key = nextKey(menu.components, 'component');
        commit({ ...menu, components: { ...menu.components, [key]: { type, text: '' } } });
        setSelected({ kind: 'component', key });
    };

    const addElement = (): void => {
        if (isCustom) {
            const key = nextKey(menu.components, 'component');
            commit({ ...menu, components: { ...menu.components, [key]: { type: 'LABEL', text: '' } } });
            setSelected({ kind: 'component', key });

            return;
        }

        const key = nextKey(menu.buttons, 'button');
        commit({ ...menu, buttons: { ...menu.buttons, [key]: emptyButton() } });
        setSelected({ kind: 'button', key });
    };

    return (
        <div className="bedrock-form-builder">
            <div className="bedrock-mobile-preview">
                <div className="bedrock-mobile-screen">
                    <div className="bedrock-mobile-content">
                        <div
                            className="bedrock-form-title"
                            dangerouslySetInnerHTML={{ __html: parseMiniMessage(menu.menuName || 'Form Title') }}
                        />

                        <div className="bedrock-form-content-preview">
                            {menu.content.map((line, index) => (
                                <div
                                    key={`${index}-${line}`}
                                    className="bedrock-content-line"
                                    dangerouslySetInnerHTML={{ __html: parseMiniMessage(line) }}
                                />
                            ))}
                        </div>

                        <div className={isCustom ? 'bedrock-form-components' : 'bedrock-form-buttons'}>
                            {isCustom
                                ? Object.entries(menu.components).map(([key, component]) => (
                                      <div
                                          key={key}
                                          className={`bedrock-preview-component${
                                              selected?.key === key && selected.kind === 'component' ? ' selected' : ''
                                          }`}
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => setSelected({ kind: 'component', key })}
                                          onKeyDown={event =>
                                              event.key === 'Enter' && setSelected({ kind: 'component', key })
                                          }
                                      >
                                          <div
                                              className="bedrock-component-label"
                                              dangerouslySetInnerHTML={{
                                                  __html: parseMiniMessage(String(component.text ?? 'No text')),
                                              }}
                                          />
                                          <div className="bedrock-component-preview">{describe(component)}</div>
                                      </div>
                                  ))
                                : Object.entries(menu.buttons).map(([key, button]) => (
                                      <div
                                          key={key}
                                          className={`bedrock-preview-button${
                                              selected?.key === key && selected.kind === 'button' ? ' selected' : ''
                                          }`}
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => setSelected({ kind: 'button', key })}
                                          onKeyDown={event => event.key === 'Enter' && setSelected({ kind: 'button', key })}
                                      >
                                          {button.image !== null && button.image !== '' && (
                                              <img src={button.image} alt="" className="bedrock-button-image" />
                                          )}
                                          <span
                                              className="bedrock-button-text"
                                              dangerouslySetInnerHTML={{
                                                  __html: parseMiniMessage(button.text || 'No text'),
                                              }}
                                          />
                                      </div>
                                  ))}

                            {!isCustom && Object.keys(menu.buttons).length === 0 && (
                                <div className="bedrock-empty-state">No buttons yet. Add one on the right.</div>
                            )}
                            {isCustom && Object.keys(menu.components).length === 0 && (
                                <div className="bedrock-empty-state">No components yet. Add one on the right.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bedrock-right-panel">
                <div className="bedrock-settings-panel">
                    <div className="bedrock-setting-section">
                        <label className="bedrock-setting-label" htmlFor="form-type">
                            Form Type
                        </label>
                        <select
                            id="form-type"
                            className="bedrock-setting-input"
                            value={menu.type.toUpperCase()}
                            onChange={event => commit({ ...menu, type: event.target.value })}
                        >
                            {FORM_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bedrock-setting-section">
                        <label className="bedrock-setting-label" htmlFor="form-title">
                            Title
                        </label>
                        <input
                            id="form-title"
                            className="bedrock-setting-input"
                            value={menu.menuName}
                            onChange={event => commit({ ...menu, menuName: event.target.value })}
                            placeholder="Form title"
                        />
                    </div>

                    <div className="bedrock-setting-section">
                        <label className="bedrock-setting-label" htmlFor="form-content">
                            Content
                        </label>
                        <textarea
                            id="form-content"
                            className="bedrock-setting-input"
                            rows={3}
                            value={menu.content.join('\n')}
                            onChange={event => commit({ ...menu, content: event.target.value.split('\n') })}
                            placeholder="Lines of text..."
                        />
                    </div>

                    <div className="bedrock-palette-section">
                        {isCustom ? (
                            COMPONENT_PALETTE.map(entry => (
                                <div
                                    key={entry.type}
                                    className="bedrock-palette-item"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => addComponent(entry.type)}
                                    onKeyDown={event => event.key === 'Enter' && addComponent(entry.type)}
                                >
                                    <div className="bedrock-palette-icon">{entry.icon}</div>
                                    <div className="bedrock-palette-info">
                                        <div className="bedrock-palette-label">{entry.name}</div>
                                        <div className="empty-note">{entry.description}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div
                                className="bedrock-palette-item"
                                role="button"
                                tabIndex={0}
                                aria-disabled={atModalLimit}
                                onClick={() => !atModalLimit && addElement()}
                                onKeyDown={event => event.key === 'Enter' && !atModalLimit && addElement()}
                            >
                                <div className="bedrock-palette-icon">🔘</div>
                                <div className="bedrock-palette-info">
                                    <div className="bedrock-palette-label">Add Empty Button</div>
                                    <div className="empty-note">
                                        {atModalLimit ? 'A modal form shows exactly two buttons.' : 'A button that closes the form'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {selected !== null && (
                    <div className="bedrock-element-editor">
                        <div className="bedrock-editor-header">
                            <h3>{selected.kind === 'button' ? 'Button' : 'Component'}: {selected.key}</h3>
                            <button type="button" className="btn-icon" onClick={() => setSelected(null)}>
                                ✕
                            </button>
                        </div>

                        <div className="bedrock-editor-body">
                            {selected.kind === 'button' && menu.buttons[selected.key] !== undefined && (
                                <BedrockButtonEditor
                                    button={menu.buttons[selected.key]}
                                    onChange={button =>
                                        commit({ ...menu, buttons: { ...menu.buttons, [selected.key]: button } })
                                    }
                                    onRemove={() => {
                                        const buttons = { ...menu.buttons };
                                        delete buttons[selected.key];
                                        commit({ ...menu, buttons });
                                        setSelected(null);
                                    }}
                                />
                            )}

                            {selected.kind === 'component' && menu.components[selected.key] !== undefined && (
                                <BedrockComponentEditor
                                    component={menu.components[selected.key]}
                                    onChange={component =>
                                        commit({
                                            ...menu,
                                            components: { ...menu.components, [selected.key]: component },
                                        })
                                    }
                                    onRemove={() => {
                                        const components = { ...menu.components };
                                        delete components[selected.key];
                                        commit({ ...menu, components });
                                        setSelected(null);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/** A one line hint of what the component renders as on the phone. */
function describe(component: YamlRecord): string {
    switch (String(component.type)) {
        case 'INPUT':
            return String(component.placeholder ?? '(text field)');
        case 'DROPDOWN':
            return (Array.isArray(component.options) ? component.options : []).join(' / ') || '(dropdown)';
        case 'TOGGLE':
            return component.default === true ? '(toggle, on)' : '(toggle, off)';
        case 'SLIDER':
            return `${component.min ?? 0} to ${component.max ?? 100}`;
        case 'STEPSLIDER':
            return (Array.isArray(component.steps) ? component.steps : []).join(' / ') || '(step slider)';
        default:
            return '(label)';
    }
}

function emptyButton(): VisualBedrockButton {
    return { text: '', image: null, actions: [], display_conditions: null };
}

/** Keys are written by hand in YAML, so a new one must not collide. */
function nextKey(existing: Record<string, unknown>, prefix: string): string {
    let index = Object.keys(existing).length + 1;

    while (existing[`${prefix}${index}`] !== undefined) {
        index++;
    }

    return `${prefix}${index}`;
}
