import { useEffect, useRef } from 'react';

export interface SlotMenuTarget {
    slot: number;
    x: number;
    y: number;
}

interface SlotContextMenuProps {
    target: SlotMenuTarget;
    hasItem: boolean;
    canPaste: boolean;
    onCopy: () => void;
    onPaste: () => void;
    onDelete: () => void;
    onDismiss: () => void;
}

export function SlotContextMenu({
    target,
    hasItem,
    canPaste,
    onCopy,
    onPaste,
    onDelete,
    onDismiss,
}: SlotContextMenuProps) {
    const menu = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dismiss = (event: MouseEvent): void => {
            if (menu.current !== null && !menu.current.contains(event.target as Node)) {
                onDismiss();
            }
        };

        const escape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onDismiss();
            }
        };

        document.addEventListener('mousedown', dismiss);
        document.addEventListener('keydown', escape);

        return () => {
            document.removeEventListener('mousedown', dismiss);
            document.removeEventListener('keydown', escape);
        };
    }, [onDismiss]);

    if (!hasItem && !canPaste) {
        return null;
    }

    return (
        <div
            ref={menu}
            role="menu"
            style={{ left: target.x, top: target.y }}
            className="context-menu"
        >
            {hasItem && <Entry label="Copy" shortcut="Ctrl+C" onClick={onCopy} />}
            {canPaste && <Entry label={hasItem ? 'Paste (replace)' : 'Paste'} shortcut="Ctrl+V" onClick={onPaste} />}
            {hasItem && <div className="context-menu-divider" />}
            {hasItem && <Entry label="Delete" shortcut="Del" onClick={onDelete} tone="danger" />}
        </div>
    );
}

function Entry({
    label,
    shortcut,
    onClick,
    tone = '',
}: {
    label: string;
    shortcut: string;
    onClick: () => void;
    tone?: string;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className={`context-menu-item ${tone}`}
        >
            {label}
            <span className="shortcut">{shortcut}</span>
        </button>
    );
}
