import { useState } from 'react';
import { Modal } from './Modal';

interface NewMenuDialogProps {
    platform: string;
    onCreate: (fileName: string, type: string, menuName: string) => void;
    onClose: () => void;
}

const TYPES: Record<string, { value: string; label: string }[]> = {
    // The Java plugin builds every menu as a chest inventory, so no other type
    // is offered: it would be accepted and then ignored.
    JAVA: [{ value: 'CHEST', label: 'CHEST (Chest)' }],
    BEDROCK: [
        { value: 'SIMPLE', label: 'SIMPLE (Simple form)' },
        { value: 'MODAL', label: 'MODAL (Form with buttons)' },
        { value: 'CUSTOM', label: 'CUSTOM (Custom form)' },
    ],
};

export function NewMenuDialog({ platform, onCreate, onClose }: NewMenuDialogProps) {
    const types = TYPES[platform.toUpperCase()] ?? TYPES.JAVA;
    const [fileName, setFileName] = useState('');
    const [type, setType] = useState(types[0].value);
    const [menuName, setMenuName] = useState('');

    const create = (): void => {
        const trimmed = fileName.trim();

        if (trimmed !== '') {
            onCreate(trimmed, type, menuName.trim() === '' ? trimmed : menuName.trim());
        }
    };

    return (
        <Modal
            title={`Create New ${platform.toUpperCase()} Menu`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={create} disabled={fileName.trim() === ''}>
                        Create
                    </button>
                </>
            }
        >
            <label className="modal-label" htmlFor="new-menu-file">
                File name (without extension):
            </label>
            <input
                id="new-menu-file"
                autoFocus
                className="modal-input"
                value={fileName}
                placeholder="my_menu"
                onChange={event => setFileName(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && create()}
            />

            <label className="modal-label" htmlFor="new-menu-type">
                Menu type:
            </label>
            <select id="new-menu-type" className="modal-select" value={type} onChange={event => setType(event.target.value)}>
                {types.map(entry => (
                    <option key={entry.value} value={entry.value}>
                        {entry.label}
                    </option>
                ))}
            </select>

            <label className="modal-label" htmlFor="new-menu-name">
                Menu name:
            </label>
            <input
                id="new-menu-name"
                className="modal-input"
                value={menuName}
                placeholder="My Menu"
                onChange={event => setMenuName(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && create()}
            />
        </Modal>
    );
}
