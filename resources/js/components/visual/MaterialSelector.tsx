import { useDeferredValue, useMemo, useState } from 'react';
import { formatMaterialName } from '../../editor/materials';
import { getAvailableMaterials } from '../../editor/materialCatalogue';
import { Modal } from '../Modal';
import { ItemIcon } from './ItemIcon';

interface MaterialSelectorProps {
    material: string;
    serverVersion: string | null;
    onChange: (material: string) => void;
}

const VISIBLE_LIMIT = 300;

/** Picks a material from the catalogue rather than making anyone type it. */
export function MaterialSelector({ material, serverVersion, onChange }: MaterialSelectorProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" className="material-selector-btn" onClick={() => setOpen(true)}>
                <span className="material-preview-inline">
                    <ItemIcon item={{ material }} serverVersion={serverVersion} variant="material-list" />
                    <span className="material-list-name">{formatMaterialName(material)}</span>
                </span>
                <span className="material-change-icon">Change</span>
            </button>

            {open && (
                <MaterialModal
                    serverVersion={serverVersion}
                    onPick={picked => {
                        onChange(picked);
                        setOpen(false);
                    }}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

function MaterialModal({
    serverVersion,
    onPick,
    onClose,
}: {
    serverVersion: string | null;
    onPick: (material: string) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const deferred = useDeferredValue(search);
    const materials = useMemo(() => getAvailableMaterials(serverVersion), [serverVersion]);

    const matches = useMemo(() => {
        const needle = deferred.trim().toUpperCase();

        return (needle === '' ? materials : materials.filter(name => name.includes(needle))).slice(0, VISIBLE_LIMIT);
    }, [materials, deferred]);

    return (
        <Modal
            title="Choose a material"
            variant="material-selector-modal"
            onClose={onClose}
            footer={
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Cancel
                </button>
            }
        >
            <input
                autoFocus
                type="search"
                className="modal-input"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search material..."
                aria-label="Search material"
            />

            <div className="material-list-modal">
                {matches.map(name => (
                    <div
                        key={name}
                        className="material-list-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => onPick(name)}
                        onKeyDown={event => event.key === 'Enter' && onPick(name)}
                        title={name}
                    >
                        <ItemIcon item={{ material: name }} serverVersion={serverVersion} variant="material-list" />
                        <span className="material-list-name">{formatMaterialName(name)}</span>
                    </div>
                ))}
            </div>

            {matches.length === VISIBLE_LIMIT && (
                <p className="empty-note">Showing the first {VISIBLE_LIMIT}. Narrow the search to find more.</p>
            )}
        </Modal>
    );
}
