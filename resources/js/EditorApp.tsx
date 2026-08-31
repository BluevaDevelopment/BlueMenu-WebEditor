import { StatusOverlay } from './components/StatusOverlay';
import { EditorWorkspace } from './components/EditorWorkspace';
import { ToastProvider } from './components/Toasts';
import { EditorStoreProvider } from './editor/store';
import { useEditorSession } from './session/useEditorSession';

interface EditorAppProps {
    sessionId: string;
    realtimeReady: boolean;
}

export function EditorApp({ sessionId, realtimeReady }: EditorAppProps) {
    const session = useEditorSession(sessionId);

    if (session.phase !== 'ready') {
        return <StatusOverlay session={session} />;
    }

    return (
        <ToastProvider>
            <EditorStoreProvider>
                <EditorWorkspace sessionId={sessionId} session={session} realtimeReady={realtimeReady} />
            </EditorStoreProvider>
        </ToastProvider>
    );
}
