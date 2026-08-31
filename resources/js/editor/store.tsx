import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { menuKey } from './menus';
import type { MenuDescriptor } from '../types/editor';

/** One menu open in the editor, with the text as loaded and as edited. */
export interface OpenTab {
    key: string;
    menu: MenuDescriptor;
    content: string;
    originalContent: string;
}

export interface EditorStore {
    menus: MenuDescriptor[];
    tabs: OpenTab[];
    activeKey: string | null;
    pluginOnline: boolean;
}

export type EditorAction =
    | { type: 'menus/loaded'; menus: MenuDescriptor[] }
    | { type: 'plugin/status'; online: boolean }
    | { type: 'tab/opened'; menu: MenuDescriptor; content: string }
    | { type: 'tab/activated'; key: string }
    | { type: 'tab/closed'; key: string }
    | { type: 'tab/moved'; from: number; to: number }
    | { type: 'tab/edited'; key: string; content: string }
    | { type: 'tab/saved'; key: string }
    | { type: 'tab/reloaded'; key: string; content: string }
    | { type: 'tabs/closedOthers'; key: string }
    | { type: 'tabs/closedAll' };

export const initialStore: EditorStore = {
    menus: [],
    tabs: [],
    activeKey: null,
    pluginOnline: true,
};

export function isDirty(tab: OpenTab): boolean {
    return tab.content !== tab.originalContent;
}

export function hasUnsavedWork(store: EditorStore): boolean {
    return store.tabs.some(isDirty);
}

export function activeTab(store: EditorStore): OpenTab | null {
    return store.tabs.find(tab => tab.key === store.activeKey) ?? null;
}

export function editorReducer(store: EditorStore, action: EditorAction): EditorStore {
    switch (action.type) {
        case 'menus/loaded': {
            return { ...store, menus: action.menus };
        }

        case 'plugin/status': {
            return { ...store, pluginOnline: action.online };
        }

        case 'tab/opened': {
            const key = menuKey(action.menu);

            // Reopening a menu focuses the tab already holding it, so unsaved
            // edits are never silently replaced by a fresh copy from disk.
            if (store.tabs.some(tab => tab.key === key)) {
                return { ...store, activeKey: key };
            }

            const tab: OpenTab = {
                key,
                menu: action.menu,
                content: action.content,
                originalContent: action.content,
            };

            return { ...store, tabs: [...store.tabs, tab], activeKey: key };
        }

        case 'tab/activated': {
            return { ...store, activeKey: action.key };
        }

        case 'tab/closed': {
            const index = store.tabs.findIndex(tab => tab.key === action.key);

            if (index === -1) {
                return store;
            }

            const tabs = store.tabs.filter(tab => tab.key !== action.key);

            if (store.activeKey !== action.key) {
                return { ...store, tabs };
            }

            // Focus moves to the neighbour on the right, or the left when the
            // closed tab was last, matching how editors normally behave.
            const neighbour = tabs[index] ?? tabs[index - 1] ?? null;

            return { ...store, tabs, activeKey: neighbour?.key ?? null };
        }

        case 'tab/moved': {
            const tabs = [...store.tabs];
            const [moved] = tabs.splice(action.from, 1);

            if (moved === undefined) {
                return store;
            }

            tabs.splice(action.to, 0, moved);

            return { ...store, tabs };
        }

        case 'tab/edited': {
            return {
                ...store,
                tabs: store.tabs.map(tab => (tab.key === action.key ? { ...tab, content: action.content } : tab)),
            };
        }

        case 'tab/reloaded': {
            return {
                ...store,
                tabs: store.tabs.map(tab =>
                    tab.key === action.key ? { ...tab, content: action.content, originalContent: action.content } : tab,
                ),
            };
        }

        case 'tabs/closedOthers': {
            return { ...store, tabs: store.tabs.filter(tab => tab.key === action.key), activeKey: action.key };
        }

        case 'tabs/closedAll': {
            return { ...store, tabs: [], activeKey: null };
        }

        case 'tab/saved': {
            return {
                ...store,
                tabs: store.tabs.map(tab =>
                    tab.key === action.key ? { ...tab, originalContent: tab.content } : tab,
                ),
            };
        }
    }
}

const StoreContext = createContext<{ store: EditorStore; dispatch: Dispatch<EditorAction> } | null>(null);

export function EditorStoreProvider({ children }: { children: ReactNode }) {
    const [store, dispatch] = useReducer(editorReducer, initialStore);
    const value = useMemo(() => ({ store, dispatch }), [store]);

    return <StoreContext value={value}>{children}</StoreContext>;
}

export function useEditorStore() {
    const value = useContext(StoreContext);

    if (value === null) {
        throw new Error('useEditorStore must be used inside an EditorStoreProvider');
    }

    return value;
}
