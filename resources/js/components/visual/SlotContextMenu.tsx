import { ContextMenu } from '../ContextMenu';

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
    if (!hasItem && !canPaste) {
        return null;
    }

    return (
        <ContextMenu
            x={target.x}
            y={target.y}
            onDismiss={onDismiss}
            entries={[
                ...(hasItem ? [{ label: 'Copy', shortcut: 'Ctrl+C', onSelect: onCopy }] : []),
                ...(canPaste
                    ? [{ label: hasItem ? 'Paste (replace)' : 'Paste', shortcut: 'Ctrl+V', onSelect: onPaste }]
                    : []),
                ...(hasItem ? ['divider' as const, { label: 'Delete', shortcut: 'Del', danger: true, onSelect: onDelete }] : []),
            ]}
        />
    );
}
