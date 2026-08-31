import { useState, type ReactNode } from 'react';
import { isDirty, type OpenTab } from '../editor/store';
import { ContextMenu } from './ContextMenu';

interface EditorTabsProps {
    tabs: OpenTab[];
    activeKey: string | null;
    actions?: ReactNode;
    onActivate: (key: string) => void;
    onClose: (key: string) => void;
    onCloseOthers: (key: string) => void;
    onCloseAll: () => void;
    onReload: (key: string) => void;
    onReorder: (from: number, to: number) => void;
}

export function EditorTabs({
    tabs,
    activeKey,
    actions,
    onActivate,
    onClose,
    onCloseOthers,
    onCloseAll,
    onReload,
    onReorder,
}: EditorTabsProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const [menu, setMenu] = useState<{ key: string; x: number; y: number } | null>(null);

    return (
        <div className="editor-tabs">
            <div className="tabs-container" role="tablist">
                {tabs.map((tab, index) => (
                    <div
                        key={tab.key}
                        role="tab"
                        tabIndex={0}
                        aria-selected={tab.key === activeKey}
                        draggable
                        onDragStart={() => setDraggedIndex(index)}
                        onDragEnd={() => {
                            setDraggedIndex(null);
                            setOverIndex(null);
                        }}
                        onDragOver={event => {
                            event.preventDefault();
                            setOverIndex(index);
                        }}
                        onDrop={() => {
                            if (draggedIndex !== null && draggedIndex !== index) {
                                onReorder(draggedIndex, index);
                            }
                            setDraggedIndex(null);
                            setOverIndex(null);
                        }}
                        onClick={() => onActivate(tab.key)}
                        onKeyDown={event => event.key === 'Enter' && onActivate(tab.key)}
                        onContextMenu={event => {
                            event.preventDefault();
                            setMenu({ key: tab.key, x: event.clientX, y: event.clientY });
                        }}
                        className={[
                            'editor-tab',
                            tab.key === activeKey ? 'active' : '',
                            draggedIndex === index ? 'dragging' : '',
                            overIndex === index && draggedIndex !== index ? 'drag-over' : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        <span>{tab.menu.fileName}</span>
                        {isDirty(tab) && <span className="tab-dirty" aria-label="Unsaved changes" />}
                        <button
                            type="button"
                            className="tab-close"
                            aria-label={`Close ${tab.menu.fileName}`}
                            onClick={event => {
                                event.stopPropagation();
                                onClose(tab.key);
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {actions !== undefined && <div className="tabs-actions">{actions}</div>}

            {menu !== null && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onDismiss={() => setMenu(null)}
                    entries={[
                        { label: 'Reload from server', onSelect: () => onReload(menu.key) },
                        'divider',
                        { label: 'Close', onSelect: () => onClose(menu.key) },
                        { label: 'Close others', disabled: tabs.length < 2, onSelect: () => onCloseOthers(menu.key) },
                        { label: 'Close all', onSelect: onCloseAll },
                    ]}
                />
            )}
        </div>
    );
}
