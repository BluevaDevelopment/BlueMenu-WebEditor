import { useState } from 'react';
import { getMaterialEmoji, getMaterialImageUrl } from '../../editor/materials';
import { getPlayerHeadImageUrl } from '../../editor/heads';

type IconVariant = 'canvas' | 'palette' | 'material-list';

interface ItemIconProps {
    item: { material: string; value?: unknown };
    serverVersion: string | null;
    variant?: IconVariant;
}

const CLASSES: Record<IconVariant, { image: string; fallback: string }> = {
    canvas: { image: 'item-icon-image', fallback: 'item-icon-fallback' },
    palette: { image: 'palette-item-image', fallback: 'palette-item-fallback' },
    'material-list': { image: 'material-list-image', fallback: 'material-list-fallback' },
};

/**
 * Draws the item's texture, falling back to an emoji when the sprite for that
 * material is missing rather than showing a broken image.
 */
export function ItemIcon({ item, serverVersion, variant = 'palette' }: ItemIconProps) {
    const [broken, setBroken] = useState(false);
    const classes = CLASSES[variant];

    const source =
        item.material === 'PLAYER_HEAD'
            ? getPlayerHeadImageUrl(typeof item.value === 'string' ? item.value : null)
            : getMaterialImageUrl(item.material, serverVersion);

    if (broken) {
        return (
            <div className={classes.fallback} aria-hidden>
                {getMaterialEmoji(item.material)}
            </div>
        );
    }

    return (
        <img
            src={source}
            alt={item.material}
            loading="lazy"
            onError={() => setBroken(true)}
            className={classes.image}
        />
    );
}
