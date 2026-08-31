import { useState } from 'react';
import { parseMiniMessage } from '../../editor/miniMessage';
import { Modal } from '../Modal';

interface HexColourPickerProps {
    onApply: (tag: string) => void;
    onClose: () => void;
}

/** Inserts an arbitrary `<#rrggbb>` colour, beyond the sixteen named ones. */
export function HexColourPicker({ onApply, onClose }: HexColourPickerProps) {
    const [colour, setColour] = useState('#55FFFF');

    return (
        <Modal
            title="Pick a colour"
            variant="color-picker-modal"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => onApply(`<${colour}>`)}>
                        Apply
                    </button>
                </>
            }
        >
            <input
                type="color"
                value={colour}
                onChange={event => setColour(event.target.value.toUpperCase())}
                aria-label="Colour"
                style={{ width: '100%', height: '120px', border: 'none', cursor: 'pointer' }}
            />

            <label className="modal-label" htmlFor="hex-value">
                Hex
            </label>
            <input
                id="hex-value"
                className="modal-input"
                value={colour}
                onChange={event => setColour(event.target.value.toUpperCase())}
            />

            <div className="menu-title-preview" style={{ display: 'block' }}>
                <span dangerouslySetInnerHTML={{ __html: parseMiniMessage(`<${colour}>Sample text`) }} />
            </div>
        </Modal>
    );
}
