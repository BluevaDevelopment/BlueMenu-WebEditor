import { describe, expect, it } from 'vitest';
import { activeTab, editorReducer, hasUnsavedWork, initialStore, isDirty, type EditorStore } from '../store';
import type { MenuDescriptor } from '../../types/editor';

function menu(fileName: string, platform = 'JAVA'): MenuDescriptor {
    return {
        fileName,
        menuName: fileName,
        platform,
        type: 'CHEST',
        openCommand: '',
        itemCount: 0,
        registered: true,
        source: 'disk',
    };
}

function withTabs(...fileNames: string[]): EditorStore {
    return fileNames.reduce(
        (store, fileName) => editorReducer(store, { type: 'tab/opened', menu: menu(fileName), content: 'a: 1' }),
        initialStore,
    );
}

describe('opening menus', () => {
    it('focuses the new tab', () => {
        const store = withTabs('shop.yml');

        expect(store.activeKey).toBe('java-shop.yml');
        expect(activeTab(store)?.menu.fileName).toBe('shop.yml');
    });

    it('focuses the existing tab instead of discarding unsaved edits', () => {
        let store = withTabs('shop.yml', 'warps.yml');
        store = editorReducer(store, { type: 'tab/edited', key: 'java-shop.yml', content: 'edited' });
        store = editorReducer(store, { type: 'tab/opened', menu: menu('shop.yml'), content: 'a: 1' });

        expect(store.tabs).toHaveLength(2);
        expect(store.activeKey).toBe('java-shop.yml');
        expect(activeTab(store)?.content).toBe('edited');
    });

    it('keeps java and bedrock menus of the same name apart', () => {
        let store = withTabs('menu.yml');
        store = editorReducer(store, { type: 'tab/opened', menu: menu('menu.yml', 'BEDROCK'), content: 'a: 1' });

        expect(store.tabs.map(tab => tab.key)).toEqual(['java-menu.yml', 'bedrock-menu.yml']);
    });
});

describe('dirty tracking', () => {
    it('marks a tab dirty once its text differs from what was loaded', () => {
        let store = withTabs('shop.yml');
        expect(hasUnsavedWork(store)).toBe(false);

        store = editorReducer(store, { type: 'tab/edited', key: 'java-shop.yml', content: 'b: 2' });
        expect(isDirty(store.tabs[0])).toBe(true);
    });

    it('clears the dirty flag after a save', () => {
        let store = withTabs('shop.yml');
        store = editorReducer(store, { type: 'tab/edited', key: 'java-shop.yml', content: 'b: 2' });
        store = editorReducer(store, { type: 'tab/saved', key: 'java-shop.yml' });

        expect(hasUnsavedWork(store)).toBe(false);
    });

    it('does not consider a tab dirty when an edit restores the original text', () => {
        let store = withTabs('shop.yml');
        store = editorReducer(store, { type: 'tab/edited', key: 'java-shop.yml', content: 'b: 2' });
        store = editorReducer(store, { type: 'tab/edited', key: 'java-shop.yml', content: 'a: 1' });

        expect(hasUnsavedWork(store)).toBe(false);
    });
});

describe('closing tabs', () => {
    it('focuses the tab on the right', () => {
        let store = withTabs('a.yml', 'b.yml', 'c.yml');
        store = editorReducer(store, { type: 'tab/activated', key: 'java-b.yml' });
        store = editorReducer(store, { type: 'tab/closed', key: 'java-b.yml' });

        expect(store.activeKey).toBe('java-c.yml');
    });

    it('falls back to the tab on the left when the last one closes', () => {
        let store = withTabs('a.yml', 'b.yml');
        store = editorReducer(store, { type: 'tab/closed', key: 'java-b.yml' });

        expect(store.activeKey).toBe('java-a.yml');
    });

    it('leaves the focus alone when another tab closes', () => {
        let store = withTabs('a.yml', 'b.yml');
        store = editorReducer(store, { type: 'tab/activated', key: 'java-b.yml' });
        store = editorReducer(store, { type: 'tab/closed', key: 'java-a.yml' });

        expect(store.activeKey).toBe('java-b.yml');
    });

    it('clears the focus when the last tab closes', () => {
        let store = withTabs('a.yml');
        store = editorReducer(store, { type: 'tab/closed', key: 'java-a.yml' });

        expect(store.activeKey).toBeNull();
        expect(store.tabs).toEqual([]);
    });
});

describe('reordering tabs', () => {
    it('moves a tab to the requested position', () => {
        let store = withTabs('a.yml', 'b.yml', 'c.yml');
        store = editorReducer(store, { type: 'tab/moved', from: 0, to: 2 });

        expect(store.tabs.map(tab => tab.menu.fileName)).toEqual(['b.yml', 'c.yml', 'a.yml']);
    });
});

describe('closing several tabs', () => {
    it('keeps only the one asked for', () => {
        let store = withTabs('a.yml', 'b.yml', 'c.yml');
        store = editorReducer(store, { type: 'tabs/closedOthers', key: 'java-b.yml' });

        expect(store.tabs.map(tab => tab.key)).toEqual(['java-b.yml']);
        expect(store.activeKey).toBe('java-b.yml');
    });

    it('closes everything', () => {
        let store = withTabs('a.yml', 'b.yml');
        store = editorReducer(store, { type: 'tabs/closedAll' });

        expect(store.tabs).toEqual([]);
        expect(store.activeKey).toBeNull();
    });
});

describe('reloading a tab', () => {
    it('replaces the text and clears the dirty flag', () => {
        let store = withTabs('a.yml');
        store = editorReducer(store, { type: 'tab/edited', key: 'java-a.yml', content: 'edited' });
        store = editorReducer(store, { type: 'tab/reloaded', key: 'java-a.yml', content: 'from server' });

        expect(store.tabs[0].content).toBe('from server');
        expect(hasUnsavedWork(store)).toBe(false);
    });
});
