import { useEcho } from '@laravel/echo-react';

interface RealtimeBridgeProps {
    sessionId: string;
    onPluginStatus: (connected: boolean) => void;
    onMenuChanged: () => void;
}

/**
 * Subscribes to the session channel.
 *
 * Kept in its own component so the editor can be rendered without it: the hooks
 * cannot be called conditionally, and a missing or unreachable Reverb must not
 * stop anyone editing over plain HTTP.
 */
export function RealtimeBridge({ sessionId, onPluginStatus, onMenuChanged }: RealtimeBridgeProps) {
    useEcho<{ connected: boolean }>(`session.${sessionId}`, '.plugin.status', payload => {
        onPluginStatus(payload.connected);
    });

    useEcho<{ platform: string; fileName: string; change: string }>(`session.${sessionId}`, '.menu.changed', () => {
        onMenuChanged();
    });

    return null;
}
