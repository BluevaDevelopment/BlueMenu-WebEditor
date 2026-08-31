import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { MaintenanceStatus } from '../types/editor';

const POLL_INTERVAL_MS = 30000;

/**
 * Warns that the editor is going down, and how long is left.
 *
 * The status is public so an open window learns about a maintenance window
 * without holding the admin token.
 */
export function MaintenanceBanner() {
    const [status, setStatus] = useState<MaintenanceStatus | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let cancelled = false;

        const poll = async (): Promise<void> => {
            try {
                const next = await api.get<MaintenanceStatus>('/api/admin/maintenance');

                if (!cancelled) {
                    setStatus(next);
                }
            } catch {
                // A failed poll is not worth interrupting the editor over.
            }
        };

        void poll();
        const timer = setInterval(() => void poll(), POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(timer);
    }, []);

    if (status === null || (!status.enabled && status.scheduledAt === null)) {
        return null;
    }

    // The last minute gets the loud treatment, so nobody loses an edit to it.
    const urgent = !status.enabled && status.scheduledAt !== null && status.scheduledAt - now < 60000;

    return (
        <div className={`maintenance-banner${urgent ? ' maintenance-urgent' : ''}`}>
            <div className="maintenance-icon">🔧</div>
            <div className="maintenance-text">
                <span className="maintenance-title">Maintenance</span>
                <span className="maintenance-description">
                    {status.enabled
                        ? 'The editor is in maintenance. Saving may be unavailable.'
                        : 'The editor goes down shortly. Save your work.'}
                </span>
            </div>
            {!status.enabled && status.scheduledAt !== null && (
                <div className="maintenance-countdown">{countdown(status.scheduledAt, now)}</div>
            )}
        </div>
    );
}

function countdown(target: number, now: number): string {
    const seconds = Math.max(0, Math.floor((target - now) / 1000));
    const minutes = Math.floor(seconds / 60);

    if (minutes >= 60) {
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }

    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}
