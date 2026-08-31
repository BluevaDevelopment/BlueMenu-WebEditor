import { useState } from 'react';
import type { SessionState } from '../types/editor';

interface StatusOverlayProps {
    session: SessionState;
}

const LABELS: Record<SessionState['phase'], { chip: string; title: string }> = {
    registering: { chip: 'SESSION', title: 'Preparing your session' },
    'awaiting-confirmation': { chip: 'CONFIRM', title: 'Confirm your session' },
    validating: { chip: 'SESSION', title: 'Validating your session' },
    ready: { chip: 'READY', title: 'Ready' },
    consumed: { chip: 'CONSUMED', title: 'Session unavailable' },
    unreachable: { chip: 'OFFLINE', title: 'Editor unreachable' },
};

/**
 * Blocks the editor until the session is usable, and shows the /bm confirm
 * command while the player still has to approve this window in game.
 */
export function StatusOverlay({ session }: StatusOverlayProps) {
    const [copied, setCopied] = useState(false);
    const labels = LABELS[session.phase];
    const command = session.verificationId === null ? null : `/bluemenu confirm ${session.verificationId}`;
    const working = session.phase === 'registering' || session.phase === 'validating';

    return (
        <div className="loading-overlay">
            <div className="status-card">
                <div className="status-card-header">
                    <span className="status-chip">{labels.chip}</span>
                    <h2 className="status-title">{labels.title}</h2>
                    <p className="status-description">{session.message}</p>
                </div>

                <div className="status-card-body">
                    {working && <div className="status-icon" />}

                    {session.phase === 'awaiting-confirmation' && command !== null && (
                        <div className="session-command">
                            <label htmlFor="sessionCommandInput">Paste this command on the server to confirm:</label>
                            <div className="session-command-input">
                                <input
                                    id="sessionCommandInput"
                                    type="text"
                                    readOnly
                                    value={command}
                                    onFocus={event => event.currentTarget.select()}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                        void navigator.clipboard.writeText(command);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
