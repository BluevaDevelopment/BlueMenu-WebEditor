import { useState } from 'react';
import { getMaterialImageUrl } from '../../editor/materials';
import { getPlayerHeadImageUrl } from '../../editor/heads';
import { parseMiniMessage } from '../../editor/miniMessage';
import type { VisualItem } from '../../editor/model';

interface ItemPreviewProps {
    item: VisualItem;
    serverVersion: string | null;
}

/** How the item will look in game, beside the fields that define it. */
export function ItemPreview({ item, serverVersion }: ItemPreviewProps) {
    const [broken, setBroken] = useState(false);
    const lore = Array.isArray(item.lore) ? item.lore : [];
    const attributeCount = countAttributes(item);

    const source =
        item.material === 'PLAYER_HEAD'
            ? getPlayerHeadImageUrl(typeof item.value === 'string' ? item.value : null)
            : getMaterialImageUrl(item.material, serverVersion);

    return (
        <div className="item-preview-container">
            <div className="item-preview-image-wrapper">
                {broken ? (
                    <div className="item-preview-fallback">📦</div>
                ) : (
                    <img
                        src={source}
                        alt={item.material}
                        className="item-preview-image"
                        onError={() => setBroken(true)}
                    />
                )}
                {item.amount > 1 && <span className="item-preview-amount">{item.amount}</span>}
            </div>

            <div className="item-preview-details">
                {typeof item.name === 'string' && item.name !== '' ? (
                    <div
                        className="item-preview-name"
                        dangerouslySetInnerHTML={{ __html: parseMiniMessage(item.name) }}
                    />
                ) : (
                    <div className="item-preview-name" style={{ color: '#fff' }}>
                        {item.material}
                    </div>
                )}

                {lore.map((line, index) => (
                    <div
                        key={`${index}-${line}`}
                        className="item-preview-lore-line"
                        dangerouslySetInnerHTML={{ __html: parseMiniMessage(line) }}
                    />
                ))}

                {attributeCount > 0 && (
                    <div className="item-preview-flags">
                        {attributeCount} attribute{attributeCount === 1 ? '' : 's'}
                    </div>
                )}
            </div>
        </div>
    );
}

function countAttributes(item: VisualItem): number {
    const attributes = item.attributes;

    if (attributes === undefined) {
        return 0;
    }

    const flags = attributes.flags ?? {};
    const enchantments = attributes.enchantments ?? {};

    return Object.keys(flags).length + Object.keys(enchantments).length;
}
