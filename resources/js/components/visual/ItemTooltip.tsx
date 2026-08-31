import { formatMaterialName } from '../../editor/materials';
import { parseMiniMessage } from '../../editor/miniMessage';
import type { VisualItem } from '../../editor/model';

interface ItemTooltipProps {
    item: VisualItem;
    x: number;
    y: number;
}

/** The in game tooltip, so a name and its lore can be judged as the player sees them. */
export function ItemTooltip({ item, x, y }: ItemTooltipProps) {
    const lore = Array.isArray(item.lore) ? item.lore : [];

    return (
        <div className="item-tooltip" style={{ left: x + 16, top: y + 16 }}>
            <div className="item-tooltip-content">
                {typeof item.name === 'string' && item.name !== '' ? (
                    <div
                        className="item-tooltip-name"
                        dangerouslySetInnerHTML={{ __html: parseMiniMessage(item.name) }}
                    />
                ) : (
                    <div className="item-tooltip-name" style={{ color: '#FFFFFF' }}>
                        {formatMaterialName(item.material)}
                    </div>
                )}

                {lore.length > 0 && (
                    <div className="item-tooltip-lore">
                        {lore.map((line, index) => (
                            <div
                                key={`${index}-${line}`}
                                className="item-tooltip-lore-line"
                                dangerouslySetInnerHTML={{ __html: parseMiniMessage(line) }}
                            />
                        ))}
                    </div>
                )}

                <div className="item-tooltip-material">{item.material}</div>
            </div>
        </div>
    );
}
