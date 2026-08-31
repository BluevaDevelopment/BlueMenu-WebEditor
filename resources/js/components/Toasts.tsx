import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { TOAST_DURATION_MS } from '../editor/config';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

interface Toast {
    id: number;
    tone: ToastTone;
    message: string;
}

const ToastContext = createContext<((tone: ToastTone, message: string) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const notify = useCallback((tone: ToastTone, message: string): void => {
        const id = Date.now() + Math.random();
        setToasts(current => [...current, { id, tone, message }]);
        setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), TOAST_DURATION_MS);
    }, []);

    const value = useMemo(() => notify, [notify]);

    return (
        <ToastContext value={value}>
            {children}
            {toasts.map((toast, index) => (
                <output
                    key={toast.id}
                    className={`toast ${toast.tone}`}
                    // Stack them upwards so a burst stays readable.
                    style={{ bottom: `${30 + index * 56}px` }}
                >
                    {toast.message}
                </output>
            ))}
        </ToastContext>
    );
}

export function useToast() {
    const notify = useContext(ToastContext);

    if (notify === null) {
        throw new Error('useToast must be used inside a ToastProvider');
    }

    return notify;
}
