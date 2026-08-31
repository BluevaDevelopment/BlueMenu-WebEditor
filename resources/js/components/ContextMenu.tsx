import { useEffect, useRef } from 'react';

export interface ContextMenuEntry {
    label: string;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    onSelect: () => void;
}

interface ContextMenuProps {
    x: number;
    y: number;
    entries: (ContextMenuEntry | 'divider')[];
    onDismiss: () => void;
}

/** The editor's right click menu, dismissed by Escape or a click outside. */
export function ContextMenu({ x, y, entries, onDismiss }: ContextMenuProps) {
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

    return (
        <div ref={menu} role="menu" style={{ left: x, top: y }} className="context-menu">
            {entries.map((entry, index) =>
                entry === 'divider' ? (
                    <div key={`divider-${index}`} className="context-menu-divider" />
                ) : (
                    <button
                        key={entry.label}
                        type="button"
                        role="menuitem"
                        disabled={entry.disabled}
                        onClick={() => {
                            entry.onSelect();
                            onDismiss();
                        }}
                        className={`context-menu-item${entry.danger === true ? ' danger' : ''}`}
                    >
                        {entry.label}
                        {entry.shortcut !== undefined && <span className="shortcut">{entry.shortcut}</span>}
                    </button>
                ),
            )}
        </div>
    );
}
