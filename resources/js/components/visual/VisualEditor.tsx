import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeMenuSize, VALID_CHEST_SIZES } from '../../editor/config';
import { itemsAtTick, TICK_MS } from '../../editor/animation';
import { applyVisualEdit, readVisual } from '../../editor/yamlDocument';
import { ItemEditor } from './ItemEditor';
import { ItemPalette } from './ItemPalette';
import { MenuCanvas } from './MenuCanvas';
import { SlotContextMenu, type SlotMenuTarget } from './SlotContextMenu';
import { MenuSettings } from './MenuSettings';
import { AnimationEditor } from './AnimationEditor';
import { GlobalTimeline } from './GlobalTimeline';
import type { VisualItem, VisualJavaMenu } from '../../editor/model';

interface VisualEditorProps {
    source: string;
    platform: string;
    serverVersion: string | null;
    onChange: (source: string) => void;
}

/**
 * Lays a Java menu out on a chest grid instead of in YAML.
 *
 * The text stays the source of truth: every gesture is parsed from the current
 * document, applied to the visual model and written straight back.
 */
export function VisualEditor({ source, platform, serverVersion, onChange }: VisualEditorProps) {
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [menuTarget, setMenuTarget] = useState<SlotMenuTarget | null>(null);
    // Copied items live for the session, so one can be pasted across menus.
    const [clipboard, setClipboard] = useState<VisualItem | null>(null);
    const [panel, setPanel] = useState<PanelKey>('palette');
    const playback = usePlayback();

    const parsed = useMemo(() => {
        try {
            return { menu: readVisual(source, platform) as VisualJavaMenu, error: null };
        } catch (error) {
            return { menu: null, error: error instanceof Error ? error.message : 'Could not read this menu' };
        }
    }, [source, platform]);

    if (parsed.menu === null) {
        return (
            <div className="visual-editor-container">
                <div className="item-editor-content">
                    <p>{parsed.error}</p>
                    <p>Fix the YAML before switching to the visual editor.</p>
                </div>
            </div>
        );
    }

    const menu = parsed.menu;

    const commit = (next: VisualJavaMenu): void => onChange(applyVisualEdit(source, next, platform));

    const setItem = (slot: number, item: VisualItem | undefined): void => {
        const items = { ...menu.items };

        if (item === undefined) {
            delete items[slot];
        } else {
            items[slot] = { ...item, slot };
        }

        commit({ ...menu, items });
    };

    useSlotShortcuts({
        slot: selectedSlot,
        item: selectedSlot === null ? undefined : menu.items[selectedSlot],
        clipboard,
        onCopy: setClipboard,
        onPaste: item => selectedSlot !== null && setItem(selectedSlot, item),
        onDelete: () => selectedSlot !== null && setItem(selectedSlot, undefined),
    });

    return (
        <div className="visual-editor-container">
            <div className="visual-editor-main">
                <div className="visual-editor-canvas-area">
                    <div className="canvas-header">
                        <span>Menu Canvas</span>
                        <select
                            className="inline-input"
                            style={{ width: 'auto' }}
                            value={normalizeMenuSize(menu.size)}
                            onChange={event => commit({ ...menu, size: Number(event.target.value) })}
                            aria-label="Menu size"
                        >
                            {VALID_CHEST_SIZES.map(size => (
                                <option key={size} value={size}>
                                    {size / 9} rows ({size} slots)
                                </option>
                            ))}
                        </select>
                    </div>

                    <MenuCanvas
                        size={normalizeMenuSize(menu.size)}
                        items={playback.playing ? itemsAtTick(menu, playback.tick) : menu.items}
                        selectedSlot={selectedSlot}
                        serverVersion={serverVersion}
                        onSelect={slot => {
                            setSelectedSlot(slot);
                            setPanel('item');
                        }}
                        onPlaceMaterial={(slot, material) => {
                            setItem(slot, { ...menu.items[slot], material, amount: menu.items[slot]?.amount ?? 1 });
                            setSelectedSlot(slot);
                        }}
                        onMoveItem={(from, to) => {
                            const moved = menu.items[from];

                            if (moved === undefined) {
                                return;
                            }

                            const items = { ...menu.items };
                            delete items[from];
                            items[to] = { ...moved, slot: to };
                            commit({ ...menu, items });
                            setSelectedSlot(to);
                        }}
                        onContextMenu={(slot, position) => {
                            setSelectedSlot(slot);
                            setMenuTarget({ slot, ...position });
                        }}
                    />

                    <AnimationEditor menu={menu} serverVersion={serverVersion} onChange={commit} playback={playback} />

                    <GlobalTimeline menu={menu} serverVersion={serverVersion} playback={playback} />
                </div>

                <div className="visual-editor-right-panel">
                    <div className="visual-editor-tabs">
                        {PANELS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`visual-tab-btn${panel === tab.key ? ' active' : ''}`}
                                onClick={() => setPanel(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="visual-tab-content">
                        <div className="visual-tab-panel active" style={{ display: 'flex' }}>
                            {panel === 'palette' && (
                                <ItemPalette
                                    serverVersion={serverVersion}
                                    onPick={material => {
                                        const target = selectedSlot ?? firstFreeSlot(menu);

                                        if (target !== null) {
                                            setItem(target, {
                                                ...menu.items[target],
                                                material,
                                                amount: menu.items[target]?.amount ?? 1,
                                            });
                                            setSelectedSlot(target);
                                        }
                                    }}
                                />
                            )}

                            {panel === 'item' &&
                                (selectedSlot === null ? (
                                    <p className="item-editor-content">Pick a slot on the grid to edit its item.</p>
                                ) : (
                                    <ItemEditor
                                        slot={selectedSlot}
                                        item={menu.items[selectedSlot]}
                                        serverVersion={serverVersion}
                                        onChange={item => setItem(selectedSlot, item)}
                                        onRemove={() => {
                                            setItem(selectedSlot, undefined);
                                            setSelectedSlot(null);
                                        }}
                                    />
                                ))}

                            {panel === 'settings' && <MenuSettings menu={menu} onChange={commit} />}
                        </div>
                    </div>
                </div>
            </div>

            {menuTarget !== null && (
                <SlotContextMenu
                    target={menuTarget}
                    hasItem={menu.items[menuTarget.slot] !== undefined}
                    canPaste={clipboard !== null}
                    onCopy={() => {
                        setClipboard(menu.items[menuTarget.slot] ?? null);
                        setMenuTarget(null);
                    }}
                    onPaste={() => {
                        if (clipboard !== null) {
                            setItem(menuTarget.slot, { ...clipboard });
                        }
                        setMenuTarget(null);
                    }}
                    onDelete={() => {
                        setItem(menuTarget.slot, undefined);
                        setMenuTarget(null);
                    }}
                    onDismiss={() => setMenuTarget(null)}
                />
            )}
        </div>
    );
}

type PanelKey = 'palette' | 'settings' | 'item';

const PANELS: { key: PanelKey; label: string }[] = [
    { key: 'palette', label: 'Item Palette' },
    { key: 'settings', label: 'Menu Settings' },
    { key: 'item', label: 'Item Editor' },
];

export interface Playback {
    playing: boolean;
    tick: number;
    play: () => void;
    stop: () => void;
    reset: () => void;
}

/**
 * Drives every animation of the menu off one tick counter, so two animations
 * with different intervals stay in step exactly as they do in game.
 */
function usePlayback(): Playback {
    const [playing, setPlaying] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!playing) {
            return;
        }

        const timer = setInterval(() => setTick(current => current + 1), TICK_MS);

        return () => clearInterval(timer);
    }, [playing]);

    return {
        playing,
        tick,
        play: () => setPlaying(true),
        stop: () => setPlaying(false),
        reset: () => setTick(0),
    };
}

interface SlotShortcuts {
    slot: number | null;
    item: VisualItem | undefined;
    clipboard: VisualItem | null;
    onCopy: (item: VisualItem) => void;
    onPaste: (item: VisualItem) => void;
    onDelete: () => void;
}

/**
 * Copy, paste and delete on the selected slot. Ignored while a form field has
 * focus, so typing Ctrl+C in a text box still copies the text.
 */
function useSlotShortcuts({ slot, item, clipboard, onCopy, onPaste, onDelete }: SlotShortcuts): void {
    const handler = useCallback(
        (event: KeyboardEvent): void => {
            if (slot === null || isTyping(event.target)) {
                return;
            }

            const key = event.key.toLowerCase();

            if ((event.ctrlKey || event.metaKey) && key === 'c' && item !== undefined) {
                event.preventDefault();
                onCopy(item);
            } else if ((event.ctrlKey || event.metaKey) && key === 'v' && clipboard !== null) {
                event.preventDefault();
                onPaste({ ...clipboard });
            } else if (event.key === 'Delete' && item !== undefined) {
                event.preventDefault();
                onDelete();
            }
        },
        [clipboard, item, onCopy, onDelete, onPaste, slot],
    );

    useEffect(() => {
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [handler]);
}

function isTyping(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function firstFreeSlot(menu: VisualJavaMenu): number | null {
    for (let slot = 0; slot < normalizeMenuSize(menu.size); slot++) {
        if (menu.items[slot] === undefined) {
            return slot;
        }
    }

    return null;
}
