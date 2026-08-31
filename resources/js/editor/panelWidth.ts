import { useCallback, useState } from 'react';

const STORAGE_PREFIX = 'bluemenu.panel.';

/**
 * A panel width the viewer can drag, remembered for their browser.
 *
 * Storage can be unavailable (a private window, blocked site data), so both
 * reading and writing fall back to the default rather than throwing.
 */
export function usePanelWidth(name: string, fallback: number): [number, (width: number) => void] {
    const [width, setWidth] = useState(() => read(name, fallback));

    const update = useCallback(
        (next: number): void => {
            setWidth(next);

            try {
                localStorage.setItem(STORAGE_PREFIX + name, String(Math.round(next)));
            } catch {
                // The width still applies for this session.
            }
        },
        [name],
    );

    return [width, update];
}

function read(name: string, fallback: number): number {
    try {
        const stored = Number(localStorage.getItem(STORAGE_PREFIX + name));

        return Number.isFinite(stored) && stored > 0 ? stored : fallback;
    } catch {
        return fallback;
    }
}
