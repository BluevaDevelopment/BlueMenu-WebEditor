import { useDeferredValue, useMemo, useState } from 'react';
import { formatMaterialName } from '../../editor/materials';
import { getAvailableMaterials } from '../../editor/materialCatalogue';
import { ItemIcon } from './ItemIcon';

interface ItemPaletteProps {
    serverVersion: string | null;
    onPick: (material: string) => void;
}

/** How many sprites to render at once: the catalogue is thousands of entries. */
const VISIBLE_LIMIT = 240;

export function ItemPalette({ serverVersion, onPick }: ItemPaletteProps) {
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const materials = useMemo(() => getAvailableMaterials(serverVersion), [serverVersion]);

    const matches = useMemo(() => {
        const needle = deferredSearch.trim().toUpperCase();

        if (needle === '') {
            return materials.slice(0, VISIBLE_LIMIT);
        }

        return materials.filter(material => material.includes(needle)).slice(0, VISIBLE_LIMIT);
    }, [materials, deferredSearch]);

    return (
        <>
            <div className="palette-search">
                <input
                    type="search"
                    className="palette-search-input"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="🔍 Search item..."
                    aria-label="Search materials"
                />
            </div>

            <div className="palette-items">
                {matches.map(material => (
                    <div
                        key={material}
                        className="palette-item"
                        draggable
                        role="button"
                        tabIndex={0}
                        onDragStart={event => event.dataTransfer.setData('application/x-bluemenu-material', material)}
                        onClick={() => onPick(material)}
                        onKeyDown={event => event.key === 'Enter' && onPick(material)}
                        title={material}
                    >
                        <div className="palette-item-icon">
                            <ItemIcon item={{ material }} serverVersion={serverVersion} variant="palette" />
                        </div>
                        <span className="palette-item-name">{formatMaterialName(material)}</span>
                    </div>
                ))}

                {matches.length === VISIBLE_LIMIT && (
                    <p className="item-editor-content">
                        Showing the first {VISIBLE_LIMIT}. Narrow the search to find more.
                    </p>
                )}
            </div>
        </>
    );
}
