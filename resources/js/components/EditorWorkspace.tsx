import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { deleteMenu, fetchMenu, fetchMenus, menuKey, saveMenu, SETTINGS_DESCRIPTOR } from '../editor/menus';
import { EDITOR_VERSION } from '../editor/config';
import { activeTab, hasUnsavedWork, useEditorStore } from '../editor/store';
import { validateMenuSource, type MenuDiagnostics } from '../editor/validator';
import { AdminTerminal } from './AdminTerminal';
import { MaintenanceBanner } from './MaintenanceBanner';

// Echo and Pusher ride along with this component, so it is fetched only once
// a session actually has live updates available.
const RealtimeBridge = lazy(() => import('./RealtimeBridge').then(m => ({ default: m.RealtimeBridge })));
import { WorkspaceLayout } from './WorkspaceLayout';
import { useToast } from './Toasts';
import type { MenuDescriptor, SessionState } from '../types/editor';

interface EditorWorkspaceProps {
    sessionId: string;
    session: SessionState;
    realtimeReady: boolean;
}

/** The live editor, bound to one confirmed session and its Minecraft server. */
export function EditorWorkspace({ sessionId, session, realtimeReady }: EditorWorkspaceProps) {
    const { store, dispatch } = useEditorStore();
    const notify = useToast();
    const [diagnostics, setDiagnostics] = useState<MenuDiagnostics | null>(null);
    const [busy, setBusy] = useState(false);
    // Menus open in the visual editor, as they did before the migration.
    const [visualMode, setVisualMode] = useState(true);
    const [terminalOpen, setTerminalOpen] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const current = activeTab(store);

    const report = useCallback(
        (error: unknown, fallback: string): void => {
            if (error instanceof ApiError && error.isServerOffline) {
                dispatch({ type: 'plugin/status', online: false });
                notify('error', 'The Minecraft server is not answering');

                return;
            }

            notify('error', error instanceof Error ? error.message : fallback);
        },
        [dispatch, notify],
    );

    const loadMenus = useCallback(async (): Promise<void> => {
        try {
            dispatch({ type: 'menus/loaded', menus: [...(await fetchMenus()), SETTINGS_DESCRIPTOR] });
            dispatch({ type: 'plugin/status', online: true });
            setLoadError(null);
        } catch (error) {
            // An empty sidebar looks like a server with no menus, so say what
            // actually happened rather than leaving it blank.
            dispatch({ type: 'menus/loaded', menus: [SETTINGS_DESCRIPTOR] });
            setLoadError(
                error instanceof ApiError && error.isServerOffline
                    ? 'The Minecraft server did not answer. Check that it is online and that the plugin connected to the editor.'
                    : error instanceof Error
                      ? error.message
                      : 'Could not load the menu list',
            );
            report(error, 'Could not load the menu list');
        }
    }, [dispatch, report]);

    useEffect(() => {
        void loadMenus();
    }, [loadMenus]);

    const openMenu = useCallback(
        async (menu: MenuDescriptor): Promise<void> => {
            // An already open menu may hold unsaved edits, so never refetch it.
            if (store.tabs.some(tab => tab.key === menuKey(menu))) {
                dispatch({ type: 'tab/activated', key: menuKey(menu) });

                return;
            }

            try {
                const loaded = await fetchMenu(menu.platform, menu.fileName);
                dispatch({ type: 'tab/opened', menu, content: loaded.content });
            } catch (error) {
                report(error, `Could not open ${menu.fileName}`);
            }
        },
        [dispatch, report, store.tabs],
    );

    const save = useCallback(async (): Promise<void> => {
        if (current === null || busy) {
            return;
        }

        setBusy(true);

        try {
            const result = validateMenuSource(current.content, current.menu.platform);
            setDiagnostics(result);

            if (!result.valid) {
                notify('error', 'Fix the errors before saving');

                return;
            }

            await saveMenu(current.menu.platform, current.menu.fileName, current.content);
            dispatch({ type: 'tab/saved', key: current.key });
            notify('success', `${current.menu.fileName} saved`);
        } catch (error) {
            report(error, 'Could not save the menu');
        } finally {
            setBusy(false);
        }
    }, [busy, current, dispatch, notify, report]);

    const remove = useCallback(
        async (menu: MenuDescriptor): Promise<void> => {
            if (!window.confirm(`Delete ${menu.fileName}? The file is removed from the server.`)) {
                return;
            }

            try {
                await deleteMenu(menu.platform, menu.fileName);
                dispatch({ type: 'tab/closed', key: menuKey(menu) });
                notify('success', `${menu.fileName} deleted`);
                await loadMenus();
            } catch (error) {
                report(error, `Could not delete ${menu.fileName}`);
            }
        },
        [dispatch, loadMenus, notify, report],
    );

    const create = useCallback(
        async (platform: string): Promise<void> => {
            const fileName = window.prompt(`New ${platform.toLowerCase()} menu file name`, 'new_menu.yml');

            if (fileName === null || fileName.trim() === '') {
                return;
            }

            try {
                await saveMenu(platform, fileName.trim(), starterMenu(platform, fileName.trim()));
                notify('success', `${fileName.trim()} created`);
                await loadMenus();
            } catch (error) {
                report(error, `Could not create ${fileName}`);
            }
        },
        [loadMenus, notify, report],
    );

    useSaveShortcut(save);
    useUnsavedWarning(hasUnsavedWork(store));

    return (
        <>
            {realtimeReady && (
                <Suspense fallback={null}>
                    <RealtimeBridge
                        sessionId={sessionId}
                        onPluginStatus={online => {
                            dispatch({ type: 'plugin/status', online });

                            if (online) {
                                void loadMenus();
                            }
                        }}
                        onMenuChanged={() => void loadMenus()}
                    />
                </Suspense>
            )}

            <WorkspaceLayout
                connectionLabel={store.pluginOnline ? 'Connected' : 'Server offline'}
                connectionState={store.pluginOnline ? 'connected' : 'offline'}
                sessionInfo={sessionInfo(sessionId, session.serverVersion)}
                banner={<MaintenanceBanner />}
                toolbar={
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setTerminalOpen(open => !open)}
                >
                    ⌨ Terminal
                </button>
            }
                serverVersion={session.serverVersion}
                diagnostics={diagnostics}
                visualMode={visualMode}
                busy={busy}
                canSave
                onToggleVisual={() => setVisualMode(mode => !mode)}
                onValidate={() =>
                current !== null && setDiagnostics(validateMenuSource(current.content, current.menu.platform))
            }
                onSave={() => void save()}
                onOpen={menu => void openMenu(menu)}
                onCreate={platform => void create(platform)}
                onDelete={menu => void remove(menu)}
                statusLeft={`${store.menus.filter(menu => menu.platform !== 'CONFIG').length} menus loaded`}
                statusRight={EDITOR_VERSION}
                onCloseDiagnostics={() => setDiagnostics(null)}
                notice={loadError}
                onRetry={() => void loadMenus()}
                footer={terminalOpen ? <AdminTerminal onClose={() => setTerminalOpen(false)} /> : null}
            />
        </>
    );
}

function sessionInfo(sessionId: string, serverVersion: string | null): string {
    const suffix = serverVersion === null ? '' : ` · MC ${serverVersion}`;

    return `Session: ${sessionId.slice(0, 8)}${suffix}`;
}

/** A new menu starts from the smallest file the plugin will actually load. */
function starterMenu(platform: string, fileName: string): string {
    const name = fileName.replace(/\.ya?ml$/i, '');

    if (platform.toUpperCase() === 'BEDROCK') {
        return ['file_version: 1', `menuName: '${name}'`, 'type: SIMPLE', 'content:', `  - '${name}'`, 'buttons: {}', ''].join('\n');
    }

    return ['file_version: 1', `menuName: '${name}'`, 'type: CHEST', 'menuSize: 27', 'items: {}', ''].join('\n');
}

/** Ctrl+S and Cmd+S save, which is what anyone editing a file will reach for. */
function useSaveShortcut(save: () => Promise<void>): void {
    useEffect(() => {
        const handler = (event: KeyboardEvent): void => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                void save();
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [save]);
}

function useUnsavedWarning(unsaved: boolean): void {
    useEffect(() => {
        if (!unsaved) {
            return;
        }

        const handler = (event: BeforeUnloadEvent): void => event.preventDefault();
        window.addEventListener('beforeunload', handler);

        return () => window.removeEventListener('beforeunload', handler);
    }, [unsaved]);
}
