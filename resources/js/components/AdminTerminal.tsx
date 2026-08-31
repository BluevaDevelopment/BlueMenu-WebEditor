import { useState } from 'react';
import { ApiError } from '../api/client';

interface CommandResult {
    success: boolean;
    message: string;
    data: Record<string, unknown> | null;
}

const TOKEN_STORAGE_KEY = 'bluemenu.adminToken';

/**
 * Runs the editor admin commands from the browser.
 *
 * The endpoint is token protected, unlike the open one the Java server exposed,
 * so the operator supplies the token here. It is held for the tab only.
 */
export function AdminTerminal({ onClose }: { onClose: () => void }) {
    const [token, setToken] = useState(() => readToken());
    const [command, setCommand] = useState('help');
    const [lines, setLines] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    const run = async (): Promise<void> => {
        setBusy(true);

        try {
            const response = await fetch('/api/admin/terminal', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'X-Admin-Token': token,
                },
                body: JSON.stringify({ command }),
            });

            const result = (await response.json()) as CommandResult;

            if (response.status === 403) {
                throw new ApiError('The admin token was refused', 403);
            }

            rememberToken(token);
            setLines(current => [...current, `> ${command}`, ...render(result)]);
        } catch (error) {
            setLines(current => [...current, `> ${command}`, error instanceof Error ? error.message : 'Request failed']);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="terminal-panel">
            <header className="output-header">
                <span className="output-title">Admin terminal</span>
                <input
                    type="password"
                    value={token}
                    onChange={event => setToken(event.target.value)}
                    placeholder="Admin token"
                    aria-label="Admin token"
                    className="inline-input" style={{ width: '190px', marginLeft: 'auto' }}
                />
                <button type="button" onClick={onClose} aria-label="Close terminal" className="tab-close">
                    x
                </button>
            </header>

            <output className="terminal-output">
                {lines.length === 0 && <p className="empty-note">Type help to list the available commands.</p>}
                {lines.map((line, index) => (
                    <p key={`${index}-${line}`}>{line}</p>
                ))}
            </output>

            <form
                onSubmit={event => {
                    event.preventDefault();
                    void run();
                }}
                className="terminal-form"
            >
                <input
                    value={command}
                    onChange={event => setCommand(event.target.value)}
                    aria-label="Command"
                    className="inline-input"
                />
                <button
                    type="submit"
                    disabled={busy || token === ''}
                    className="btn btn-primary btn-sm"
                >
                    Run
                </button>
            </form>
        </section>
    );
}

function render(result: CommandResult): string[] {
    const lines = [result.message];
    const data = result.data;

    if (data === null) {
        return lines;
    }

    if (Array.isArray(data.commands)) {
        lines.push(...data.commands.map(String));
    }

    if (Array.isArray(data.sessions)) {
        for (const session of data.sessions as Record<string, unknown>[]) {
            lines.push(`${String(session.sessionId)} - ${String(session.status)}`);
        }
    }

    if (typeof data.enabled === 'boolean') {
        lines.push(`Maintenance is now ${data.enabled ? 'enabled' : 'disabled'}`);
    }

    return lines;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function readToken(): string {
    try {
        return sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
    } catch {
        return '';
    }
}

function rememberToken(token: string): void {
    try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
        // Private windows refuse storage; the operator can retype the token.
    }
}
