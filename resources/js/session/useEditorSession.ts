import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { SessionState, SessionValidation, VerificationToken } from '../types/editor';

const CONFIRMATION_POLL_MS = 3000;

/**
 * Drives the three step handshake the plugin expects: this window asks for its
 * own verification token, the player confirms that token in game, and the
 * window then validates to take ownership of the session.
 */
export function useEditorSession(sessionId: string): SessionState {
    const [state, setState] = useState<SessionState>({
        phase: 'registering',
        verificationId: null,
        serverVersion: null,
        message: 'Generating verification token...',
    });

    const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const validate = useCallback(
        async (verificationId: string): Promise<void> => {
            try {
                const result = await api.get<SessionValidation>(
                    `/api/session/${encodeURIComponent(sessionId)}?verificationId=${encodeURIComponent(verificationId)}`,
                );

                setState(current => ({ ...current, ...toPhase(result, verificationId) }));

                if (!result.valid && !result.confirmed && result.verificationMatch) {
                    pollTimer.current = setTimeout(() => void validate(verificationId), CONFIRMATION_POLL_MS);
                }
            } catch (error) {
                setState(current => ({
                    ...current,
                    phase: 'unreachable',
                    message: error instanceof ApiError ? error.message : 'Could not reach the editor server',
                }));
            }
        },
        [sessionId],
    );

    useEffect(() => {
        let cancelled = false;

        const start = async (): Promise<void> => {
            try {
                const token = await api.post<VerificationToken>(
                    `/api/session/${encodeURIComponent(sessionId)}/verification`,
                );

                if (cancelled) {
                    return;
                }

                if (!token.success || token.verificationId === null) {
                    setState({
                        phase: 'consumed',
                        verificationId: null,
                        serverVersion: null,
                        message: token.message,
                    });

                    return;
                }

                setState({
                    phase: 'validating',
                    verificationId: token.verificationId,
                    serverVersion: null,
                    message: 'Validating your session...',
                });

                await validate(token.verificationId);
            } catch (error) {
                if (!cancelled) {
                    setState({
                        phase: 'consumed',
                        verificationId: null,
                        serverVersion: null,
                        message: error instanceof ApiError ? error.message : 'Could not create a verification token',
                    });
                }
            }
        };

        void start();

        return () => {
            cancelled = true;

            if (pollTimer.current !== null) {
                clearTimeout(pollTimer.current);
            }
        };
    }, [sessionId, validate]);

    return state;
}

function toPhase(result: SessionValidation, verificationId: string): Omit<SessionState, 'verificationId'> & {
    verificationId: string;
} {
    if (result.valid) {
        return {
            phase: 'ready',
            verificationId,
            serverVersion: result.serverVersion,
            message: result.message,
        };
    }

    // A window that holds a token nobody confirmed yet just has to wait.
    if (!result.confirmed && result.verificationMatch) {
        return {
            phase: 'awaiting-confirmation',
            verificationId,
            serverVersion: null,
            message: 'Waiting for you to confirm the session on the server...',
        };
    }

    if (!result.confirmed) {
        return {
            phase: 'awaiting-confirmation',
            verificationId,
            serverVersion: null,
            message: result.message,
        };
    }

    return {
        phase: 'consumed',
        verificationId,
        serverVersion: null,
        message: result.message,
    };
}
