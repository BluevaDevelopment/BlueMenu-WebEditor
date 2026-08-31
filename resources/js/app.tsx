import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoWorkspace } from './components/DemoWorkspace';
import { ToastProvider } from './components/Toasts';
import { EditorStoreProvider } from './editor/store';
import { readRealtimeSettings, startRealtime } from './editor/realtime';
import { EditorApp } from './EditorApp';

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error('React root element was not found.');
}

const settings = readRealtimeSettings(rootElement);
const sessionId = rootElement.dataset.sessionId;

/**
 * Brings the editor up straight away and connects live updates behind it, so
 * loading Echo never delays the first paint.
 */
function Editor({ sessionId }: { sessionId: string }) {
    const [realtimeReady, setRealtimeReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void startRealtime(settings).then(ready => {
            if (!cancelled) {
                setRealtimeReady(ready);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return <EditorApp sessionId={sessionId} realtimeReady={realtimeReady} />;
}

createRoot(rootElement).render(
    <StrictMode>
        {sessionId ? (
            <Editor sessionId={sessionId} />
        ) : (
            <ToastProvider>
                <EditorStoreProvider>
                    <DemoWorkspace />
                </EditorStoreProvider>
            </ToastProvider>
        )}
    </StrictMode>,
);
