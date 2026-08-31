import { lazy, Suspense, type ReactNode } from 'react';
import { activeTab, isDirty, useEditorStore } from '../editor/store';
import { EditorTabs } from './EditorTabs';
import { MenuSidebar } from './MenuSidebar';
import { OutputPanel } from './OutputPanel';
import { StatusBar } from './StatusBar';

// Each of these pulls a heavy dependency (CodeMirror, the canvas, the form
// builder), and only one of them is on screen at a time.
const YamlEditor = lazy(() => import('./YamlEditor').then(m => ({ default: m.YamlEditor })));
const VisualEditor = lazy(() => import('./visual/VisualEditor').then(m => ({ default: m.VisualEditor })));
const FormBuilder = lazy(() => import('./visual/FormBuilder').then(m => ({ default: m.FormBuilder })));
const ConfigEditor = lazy(() => import('./visual/ConfigEditor').then(m => ({ default: m.ConfigEditor })));
import type { MenuDiagnostics } from '../editor/validator';
import type { MenuDescriptor } from '../types/editor';

interface WorkspaceLayoutProps {
    connectionLabel: string;
    connectionState: 'connected' | 'offline' | 'demo';
    banner?: ReactNode;
    toolbar?: ReactNode;
    sessionInfo?: string;
    serverVersion: string | null;
    diagnostics: MenuDiagnostics | null;
    visualMode: boolean;
    busy: boolean;
    canSave: boolean;
    onToggleVisual: () => void;
    onRefresh: () => void;
    onToggleOutput: () => void;
    onSave: () => void;
    onOpen: (menu: MenuDescriptor) => void;
    onCreate: ((platform: string) => void) | null;
    onDelete: ((menu: MenuDescriptor) => void) | null;
    statusLeft: string;
    statusRight: string;
    onCloseDiagnostics: () => void;
    onReloadTab: (key: string) => void;
    /** Shown in place of the welcome screen when the menu list could not load. */
    notice?: string | null;
    onRetry?: () => void;
    footer?: ReactNode;
}

/**
 * The IDE shell, shared by the live session and the read only demo so both stay
 * in step as the editors grow.
 */
export function WorkspaceLayout({
    connectionLabel,
    connectionState,
    banner,
    toolbar,
    sessionInfo,
    serverVersion,
    diagnostics,
    visualMode,
    busy,
    canSave,
    onToggleVisual,
    onRefresh,
    onToggleOutput,
    onSave,
    onOpen,
    onCreate,
    onDelete,
    statusLeft,
    statusRight,
    onCloseDiagnostics,
    onReloadTab,
    notice,
    onRetry,
    footer,
}: WorkspaceLayoutProps) {
    const { store, dispatch } = useEditorStore();
    const current = activeTab(store);
    const platform = current?.menu.platform.toUpperCase();
    const dotClass = connectionState === 'connected' ? 'connected' : connectionState === 'demo' ? 'demo' : '';

    return (
        <div className="app-shell">
            {banner}

            <div className="ide-container">
                <header className="ide-header">
                    <div className="header-left">
                        <img className="header-logo" src="/editor/img/logo.png" alt="BlueMenu" />
                        <span className="header-title">BlueMenu Web Editor</span>
                    </div>

                    <div className="header-right">
                        {toolbar}
                        <div className="connection-indicator">
                            <div className={`connection-dot ${dotClass}`} />
                            <span>{connectionLabel}</span>
                        </div>
                        {sessionInfo !== undefined && <div className="session-info">{sessionInfo}</div>}
                    </div>
                </header>

                <main className="ide-main">
                    <MenuSidebar
                        menus={store.menus}
                        activeKey={store.activeKey}
                        onOpen={onOpen}
                        onCreate={onCreate}
                        onDelete={onDelete}
                    />

                    <section className="ide-editor">
                        <EditorTabs
                            tabs={store.tabs}
                            activeKey={store.activeKey}
                            onActivate={key => dispatch({ type: 'tab/activated', key })}
                            onClose={key => dispatch({ type: 'tab/closed', key })}
                            onCloseOthers={key => dispatch({ type: 'tabs/closedOthers', key })}
                            onCloseAll={() => dispatch({ type: 'tabs/closedAll' })}
                            onReload={onReloadTab}
                            onReorder={(from, to) => dispatch({ type: 'tab/moved', from, to })}
                            actions={
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={onToggleVisual}
                                        disabled={current === null}
                                        title={visualMode ? 'Switch to YAML mode' : 'Switch to Visual mode'}
                                    >
                                        {visualMode ? 'YAML' : 'Visual'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={onRefresh}
                                        title="Reload menu list"
                                    >
                                        🔄
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={onSave}
                                        disabled={!canSave || current === null || !isDirty(current) || busy}
                                        title="Save (Ctrl+S)"
                                    >
                                        💾
                                    </button>
                                </>
                            }
                        />

                        <div className="editor-content">
                            <div className="editor-body">
                                <Suspense fallback={<div className="item-editor-content">Loading the editor...</div>}>
                                {current === null ? (
                                    <div className="welcome-screen">
                                        <div className="welcome-icon">{notice ? '⚠️' : '📝'}</div>
                                        <div className="welcome-text">
                                            {notice ?? 'Select a menu from the sidebar to start editing'}
                                        </div>
                                        {notice !== null && notice !== undefined && onRetry !== undefined && (
                                            <button type="button" className="btn btn-secondary" onClick={onRetry} style={{ marginTop: '16px' }}>
                                                Try again
                                            </button>
                                        )}
                                    </div>
                                ) : visualMode && platform === 'JAVA' ? (
                                    <VisualEditor
                                        source={current.content}
                                        platform={current.menu.platform}
                                        serverVersion={serverVersion}
                                        onChange={content => dispatch({ type: 'tab/edited', key: current.key, content })}
                                    />
                                ) : visualMode && platform === 'CONFIG' ? (
                                    <ConfigEditor
                                        source={current.content}
                                        onChange={content => dispatch({ type: 'tab/edited', key: current.key, content })}
                                    />
                                ) : visualMode && platform === 'BEDROCK' ? (
                                    <FormBuilder
                                        source={current.content}
                                        serverVersion={serverVersion}
                                        onChange={content => dispatch({ type: 'tab/edited', key: current.key, content })}
                                    />
                                ) : (
                                    <YamlEditor
                                        value={current.content}
                                        onChange={content => dispatch({ type: 'tab/edited', key: current.key, content })}
                                    />
                                )}
                                </Suspense>
                            </div>

                            <OutputPanel diagnostics={diagnostics} onClose={onCloseDiagnostics} />
                            {footer}
                        </div>

                        <StatusBar left={statusLeft} right={statusRight} onToggleOutput={onToggleOutput} />
                    </section>
                </main>
            </div>
        </div>
    );
}
