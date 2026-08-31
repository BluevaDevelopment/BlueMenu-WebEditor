import { useState } from 'react';
import { Modal } from './Modal';
import type { MenuDescriptor } from '../types/editor';

interface DeleteMenuDialogProps {
    menu: MenuDescriptor;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * Deleting asks twice, as it did before the migration: the file is removed from
 * the server and there is no undo.
 */
export function DeleteMenuDialog({ menu, onConfirm, onClose }: DeleteMenuDialogProps) {
    const [confirming, setConfirming] = useState(false);

    if (!confirming) {
        return (
            <Modal
                title="⚠️ Confirm Deletion"
                onClose={onClose}
                footer={
                    <>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
                            Delete
                        </button>
                    </>
                }
            >
                <p style={{ color: 'var(--error-color)', fontWeight: 'bold', marginBottom: '12px' }}>
                    WARNING! This action is irreversible.
                </p>
                <p style={{ marginBottom: '8px' }}>You are about to delete the menu:</p>
                <p
                    style={{
                        background: 'var(--bg-secondary)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        marginBottom: '12px',
                    }}
                >
                    📄 {menu.fileName}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    The file will be permanently deleted from the server.
                </p>
            </Modal>
        );
    }

    return (
        <Modal
            title="⚠️ Final Confirmation"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onConfirm}>
                        Delete permanently
                    </button>
                </>
            }
        >
            <p style={{ color: 'var(--error-color)', fontWeight: 'bold', marginBottom: '12px' }}>FINAL WARNING!</p>
            <p>
                <code>{menu.fileName}</code> will be deleted from the server and cannot be recovered.
            </p>
        </Modal>
    );
}
