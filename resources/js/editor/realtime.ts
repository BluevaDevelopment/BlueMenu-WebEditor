export interface RealtimeSettings {
    key: string;
    host: string;
    port: number;
    scheme: string;
}

/**
 * Reads the Reverb settings the server put on the mount point.
 *
 * They travel with the page rather than being baked into the bundle: the asset
 * is built in CI, where those values do not exist, and an empty key makes
 * Pusher throw on construction and takes the whole editor down with it.
 */
export function readRealtimeSettings(root: HTMLElement): RealtimeSettings | null {
    const key = root.dataset.reverbKey ?? '';
    const host = root.dataset.reverbHost ?? '';

    if (key === '' || host === '') {
        return null;
    }

    return {
        key,
        host,
        port: Number(root.dataset.reverbPort ?? 443),
        scheme: root.dataset.reverbScheme ?? 'https',
    };
}

/**
 * Loads and configures Echo.
 *
 * Pusher is a large dependency that only a confirmed live session uses, so it
 * is fetched on demand rather than shipped in the first download.
 *
 * @returns true when live updates are available
 */
export async function startRealtime(settings: RealtimeSettings | null): Promise<boolean> {
    if (settings === null) {
        return false;
    }

    try {
        const { configureEcho } = await import('@laravel/echo-react');

        configureEcho({
            broadcaster: 'reverb',
            key: settings.key,
            wsHost: settings.host,
            wsPort: settings.port,
            wssPort: settings.port,
            forceTLS: settings.scheme === 'https',
            enabledTransports: ['ws', 'wss'],
        });

        return true;
    } catch {
        // Live updates are a convenience: the editor still works over HTTP.
        return false;
    }
}
