import { useState } from 'react';
import { parseMiniMessage } from '../../editor/miniMessage';
import { Modal } from '../Modal';

interface GradientBuilderProps {
    initialText: string;
    onApply: (tagged: string) => void;
    onClose: () => void;
}

const PRESETS: { label: string; from: string; to: string }[] = [
    { label: 'Red-Gold', from: '#FF5555', to: '#FFAA00' },
    { label: 'Aqua-Blue', from: '#55FFFF', to: '#5555FF' },
    { label: 'Green-Yellow', from: '#55FF55', to: '#FFFF55' },
    { label: 'Purple-Blue', from: '#FF55FF', to: '#5555FF' },
    { label: 'Gold-Yellow', from: '#FFAA00', to: '#FFFF55' },
    { label: 'Dark Red', from: '#AA0000', to: '#FF5555' },
];

/** Builds a `<gradient:#a:#b>text</gradient>` tag with a live preview. */
export function GradientBuilder({ initialText, onApply, onClose }: GradientBuilderProps) {
    const [from, setFrom] = useState('#FF0000');
    const [to, setTo] = useState('#0000FF');
    const [text, setText] = useState(initialText === '' ? 'Text' : initialText);

    const tagged = `<gradient:${from}:${to}>${text}</gradient>`;

    return (
        <Modal
            title="Create Gradient"
            variant="gradient-builder-modal"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => onApply(tagged)}>
                        Apply
                    </button>
                </>
            }
        >
            <label className="modal-label">Preset gradients</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '16px' }}>
                {PRESETS.map(preset => (
                    <button
                        key={preset.label}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                            background: `linear-gradient(90deg, ${preset.from}, ${preset.to})`,
                            color: 'white',
                            fontSize: '11px',
                        }}
                        onClick={() => {
                            setFrom(preset.from);
                            setTo(preset.to);
                        }}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <ColourField label="Start Color" value={from} onChange={setFrom} />
                <ColourField label="End Color" value={to} onChange={setTo} />
            </div>

            <label className="modal-label" htmlFor="gradient-text">
                Text
            </label>
            <input
                id="gradient-text"
                className="modal-input"
                value={text}
                onChange={event => setText(event.target.value)}
            />

            <div className="menu-title-preview" style={{ display: 'block' }}>
                <span dangerouslySetInnerHTML={{ __html: parseMiniMessage(tagged) }} />
            </div>
        </Modal>
    );
}

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div style={{ flex: 1, textAlign: 'center' }}>
            <label className="modal-label" htmlFor={`gradient-${label}`}>
                {label}
            </label>
            <input
                id={`gradient-${label}`}
                type="color"
                value={value}
                onChange={event => onChange(event.target.value.toUpperCase())}
                style={{ width: '100%', height: '80px', border: 'none', cursor: 'pointer' }}
            />
            <input className="item-input" readOnly value={value} style={{ marginTop: '8px', textAlign: 'center' }} />
        </div>
    );
}
