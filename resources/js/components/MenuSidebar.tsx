import { useState } from 'react';
import { menuKey } from '../editor/menus';
import { ContextMenu } from './ContextMenu';
import { ResizeHandle } from './ResizeHandle';
import { usePanelWidth } from '../editor/panelWidth';
import type { MenuDescriptor } from '../types/editor';

interface MenuSidebarProps {
    menus: MenuDescriptor[];
    activeKey: string | null;
    onOpen: (menu: MenuDescriptor) => void;
    onCreate: ((platform: string) => void) | null;
    onDelete: ((menu: MenuDescriptor) => void) | null;
}

interface Section {
    platform: string;
    label: string;
    icon: string;
    itemIcon: string;
    createLabel: string | null;
}

const SECTIONS: Section[] = [
    { platform: 'JAVA', label: '☕ Java', icon: '☕', itemIcon: '📄', createLabel: '➕ New Java menu' },
    { platform: 'BEDROCK', label: '🎮 Bedrock', icon: '🎮', itemIcon: '📄', createLabel: '➕ New Bedrock menu' },
    { platform: 'CONFIG', label: '⚙️ Settings', icon: '⚙️', itemIcon: '⚙️', createLabel: null },
];

export function MenuSidebar({ menus, activeKey, onOpen, onCreate, onDelete }: MenuSidebarProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [menu, setMenu] = useState<{ menu: MenuDescriptor; x: number; y: number } | null>(null);
    const [width, setWidth] = usePanelWidth('sidebar', 280);

    return (
        <aside className="ide-sidebar" style={{ width: `${width}px` }}>
            <div className="sidebar-header">Server Menus</div>

            <div className="sidebar-content">
                {SECTIONS.map(section => {
                    const entries = menus
                        .filter(menu => menu.platform.toUpperCase() === section.platform)
                        .sort((left, right) => left.fileName.localeCompare(right.fileName));
                    const isCollapsed = collapsed[section.platform] ?? false;

                    return (
                        <div key={section.platform} className="sidebar-section">
                            <div
                                className={`section-header${isCollapsed ? ' collapsed' : ''}`}
                                role="button"
                                tabIndex={0}
                                aria-expanded={!isCollapsed}
                                onClick={() =>
                                    setCollapsed(current => ({ ...current, [section.platform]: !isCollapsed }))
                                }
                                onKeyDown={event =>
                                    event.key === 'Enter' &&
                                    setCollapsed(current => ({ ...current, [section.platform]: !isCollapsed }))
                                }
                            >
                                <span className="section-arrow">▼</span>
                                <span>{section.label}</span>
                                <span className="section-count">{entries.length}</span>
                            </div>

                            <div className="section-content" style={isCollapsed ? { maxHeight: 0 } : undefined}>
                                {entries.map(menu => (
                                    <MenuRow
                                        key={menuKey(menu)}
                                        menu={menu}
                                        icon={section.itemIcon}
                                        active={menuKey(menu) === activeKey}
                                        onOpen={onOpen}
                                        onDelete={section.createLabel === null ? null : onDelete}
                                        onContextMenu={(target, position) =>
                                            setMenu({ menu: target, ...position })
                                        }
                                    />
                                ))}

                                {section.createLabel !== null && onCreate !== null && (
                                    <div
                                        className="section-new-button"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onCreate(section.platform)}
                                        onKeyDown={event => event.key === 'Enter' && onCreate(section.platform)}
                                    >
                                        {section.createLabel}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <ResizeHandle edge="right" width={width} min={200} max={500} onResize={setWidth} />

            {menu !== null && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    onDismiss={() => setMenu(null)}
                    entries={[
                        { label: 'Open', onSelect: () => onOpen(menu.menu) },
                        'divider',
                        {
                            label: 'Delete',
                            danger: true,
                            disabled: onDelete === null || menu.menu.platform.toUpperCase() === 'CONFIG',
                            onSelect: () => onDelete?.(menu.menu),
                        },
                    ]}
                />
            )}
        </aside>
    );
}

function MenuRow({
    menu,
    icon,
    active,
    onOpen,
    onDelete,
    onContextMenu,
}: {
    menu: MenuDescriptor;
    icon: string;
    active: boolean;
    onOpen: (menu: MenuDescriptor) => void;
    onDelete: ((menu: MenuDescriptor) => void) | null;
    onContextMenu: (menu: MenuDescriptor, position: { x: number; y: number }) => void;
}) {
    return (
        <div
            className={`menu-item-sidebar${active ? ' active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(menu)}
            onKeyDown={event => event.key === 'Enter' && onOpen(menu)}
            onContextMenu={event => {
                event.preventDefault();
                onContextMenu(menu, { x: event.clientX, y: event.clientY });
            }}
        >
            <span className="menu-icon">{icon}</span>

            <div className="menu-item-info">
                <div className="menu-item-name">{menu.fileName}</div>
                <div className="menu-item-meta">{metaLine(menu)}</div>
            </div>

            {onDelete !== null && (
                <button
                    type="button"
                    className="tab-close"
                    aria-label={`Delete ${menu.fileName}`}
                    onClick={event => {
                        event.stopPropagation();
                        onDelete(menu);
                    }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}

function metaLine(menu: MenuDescriptor): string {
    if (menu.platform.toUpperCase() === 'CONFIG') {
        return 'Plugin settings';
    }

    let meta = `${menu.type} • ${menu.itemCount} items`;

    if (menu.source === 'mysql') {
        meta += ' • ⛁ MySQL';
    }

    if (!menu.registered) {
        meta += ' • ⚠ not registered';
    }

    return meta;
}
