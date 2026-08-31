import { useState, type DragEvent } from 'react';
import { ItemIcon } from './ItemIcon';
import { ItemTooltip } from './ItemTooltip';
import type { VisualItem } from '../../editor/model';

const MATERIAL_DRAG_TYPE = 'application/x-bluemenu-material';
const SLOT_DRAG_TYPE = 'application/x-bluemenu-slot';

interface MenuCanvasProps {
    size: number;
    items: Record<number, VisualItem>;
    selectedSlot: number | null;
    serverVersion: string | null;
    onSelect: (slot: number) => void;
    onPlaceMaterial: (slot: number, material: string) => void;
    onMoveItem: (fromSlot: number, toSlot: number) => void;
    onContextMenu: (slot: number, position: { x: number; y: number }) => void;
}

/**
 * The chest inventory as the player will see it: nine columns, one tile per
 * slot, so a menu can be laid out without counting slot numbers by hand.
 */
export function MenuCanvas({
    size,
    items,
    selectedSlot,
    serverVersion,
    onSelect,
    onPlaceMaterial,
    onMoveItem,
    onContextMenu,
}: MenuCanvasProps) {
    const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ item: VisualItem; x: number; y: number } | null>(null);

    const handleDrop = (event: DragEvent<HTMLDivElement>, slot: number): void => {
        event.preventDefault();
        setHoveredSlot(null);

        const material = event.dataTransfer.getData(MATERIAL_DRAG_TYPE);

        if (material !== '') {
            onPlaceMaterial(slot, material);

            return;
        }

        const from = event.dataTransfer.getData(SLOT_DRAG_TYPE);

        if (from !== '' && Number(from) !== slot) {
            onMoveItem(Number(from), slot);
        }
    };

    return (
        <>
            {tooltip !== null && <ItemTooltip item={tooltip.item} x={tooltip.x} y={tooltip.y} />}

            <div className="menu-canvas" style={{ gridTemplateColumns: 'repeat(9, 60px)' }}>
            {Array.from({ length: size }, (_unused, slot) => {
                const item = items[slot];

                return (
                    <div
                        key={slot}
                        role="button"
                        tabIndex={0}
                        className={[
                            'canvas-slot',
                            selectedSlot === slot ? 'selected' : '',
                            hoveredSlot === slot ? 'drag-over' : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        onClick={() => onSelect(slot)}
                        onKeyDown={event => event.key === 'Enter' && onSelect(slot)}
                        onContextMenu={event => {
                            event.preventDefault();
                            onContextMenu(slot, { x: event.clientX, y: event.clientY });
                        }}
                        draggable={item !== undefined}
                        onDragStart={event => event.dataTransfer.setData(SLOT_DRAG_TYPE, String(slot))}
                        onDragOver={event => event.preventDefault()}
                        onDragEnter={() => setHoveredSlot(slot)}
                        onDragLeave={() => setHoveredSlot(current => (current === slot ? null : current))}
                        onDrop={event => handleDrop(event, slot)}
                        onMouseEnter={event =>
                            item !== undefined && setTooltip({ item, x: event.clientX, y: event.clientY })
                        }
                        onMouseMove={event =>
                            item !== undefined && setTooltip({ item, x: event.clientX, y: event.clientY })
                        }
                        onMouseLeave={() => setTooltip(null)}
                        aria-label={item === undefined ? `Empty slot ${slot}` : `${item.material} in slot ${slot}`}
                    >
                        <span className="slot-number">{slot}</span>
                        {item !== undefined && (
                            <div className="canvas-item">
                                <div className="item-icon">
                                    <ItemIcon item={item} serverVersion={serverVersion} variant="canvas" />
                                </div>
                                {item.amount > 1 && <span className="item-amount">{item.amount}</span>}
                            </div>
                        )}
                    </div>
                );
            })}
            </div>
        </>
    );
}
