import { ActionEditor } from './ActionEditor';
import { ConditionEditor } from './ConditionEditor';
import type { VisualBedrockButton, YamlRecord } from '../../editor/model';

interface BedrockButtonEditorProps {
    button: VisualBedrockButton;
    onChange: (button: VisualBedrockButton) => void;
    onRemove: () => void;
}

export function BedrockButtonEditor({ button, onChange, onRemove }: BedrockButtonEditorProps) {
    return (
        <>
            <div className="bedrock-setting-section">
                <label className="bedrock-setting-label" htmlFor="button-text">
                    Text
                </label>
                <input
                    id="button-text"
                    className="bedrock-setting-input"
                    value={button.text}
                    onChange={event => onChange({ ...button, text: event.target.value })}
                />
            </div>

            <div className="bedrock-setting-section">
                <label className="bedrock-setting-label" htmlFor="button-image">
                    Image (url or path)
                </label>
                <input
                    id="button-image"
                    className="bedrock-setting-input"
                    value={button.image ?? ''}
                    onChange={event => onChange({ ...button, image: event.target.value || null })}
                />
            </div>

            <ActionEditor
                actions={Array.isArray(button.actions) ? button.actions.map(String) : []}
                onChange={actions => onChange({ ...button, actions: actions as unknown as YamlRecord[] })}
            />

            <ConditionEditor
                label="Display conditions"
                conditions={button.display_conditions}
                onChange={next => onChange({ ...button, display_conditions: next as YamlRecord | null })}
            />

            <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
                Remove button
            </button>
        </>
    );
}
