import { useCallback, useEffect, useState } from 'react';
import { EDITOR_VERSION } from '../editor/config';
import { DEMO_MENUS, fetchDemoMenu } from '../editor/demo';
import { menuKey } from '../editor/menus';
import { activeTab, useEditorStore } from '../editor/store';
import { validateMenuSource, type MenuDiagnostics } from '../editor/validator';
import { WorkspaceLayout } from './WorkspaceLayout';
import { useToast } from './Toasts';
import type { MenuDescriptor } from '../types/editor';

/**
 * The editor with no server behind it, running on the sample menus.
 *
 * Everything renders and every editor works; saving is the one thing that
 * cannot, because there is nowhere to write to.
 */
export function DemoWorkspace() {
    const { store, dispatch } = useEditorStore();
    const notify = useToast();
    const [diagnostics, setDiagnostics] = useState<MenuDiagnostics | null>(null);
    // Menus open in the visual editor, as they did before the migration.
    const [visualMode, setVisualMode] = useState(true);

    const current = activeTab(store);

    useEffect(() => {
        dispatch({ type: 'menus/loaded', menus: DEMO_MENUS });
    }, [dispatch]);

    const openMenu = useCallback(
        async (menu: MenuDescriptor): Promise<void> => {
            if (store.tabs.some(tab => tab.key === menuKey(menu))) {
                dispatch({ type: 'tab/activated', key: menuKey(menu) });

                return;
            }

            try {
                dispatch({ type: 'tab/opened', menu, content: await fetchDemoMenu(menu) });
            } catch (error) {
                notify('error', error instanceof Error ? error.message : 'Could not load the sample');
            }
        },
        [dispatch, notify, store.tabs],
    );

    return (
        <WorkspaceLayout
            connectionLabel="Demo Mode"
            connectionState="demo"
            sessionInfo="Session: Demo mode"
            serverVersion={null}
            diagnostics={diagnostics}
            visualMode={visualMode}
            busy={false}
            canSave={false}
            onToggleVisual={() => setVisualMode(mode => !mode)}
            onValidate={() =>
                current !== null && setDiagnostics(validateMenuSource(current.content, current.menu.platform))
            }
            onSave={() => notify('info', 'The demo cannot save. Open the editor from your server to keep changes.')}
            onOpen={menu => void openMenu(menu)}
            onCreate={() => notify('info', 'The demo cannot create menus. Open the editor from your server.')}
            onDelete={null}
            statusLeft={`${store.menus.filter(menu => menu.platform !== 'CONFIG').length} menus loaded`}
            statusRight={EDITOR_VERSION}
            onCloseDiagnostics={() => setDiagnostics(null)}
        />
    );
}
