import type { Diagnostic, MenuDiagnostics } from '../editor/validator';

interface OutputPanelProps {
    diagnostics: MenuDiagnostics | null;
    onClose: () => void;
}

export function OutputPanel({ diagnostics, onClose }: OutputPanelProps) {
    if (diagnostics === null) {
        return null;
    }

    const { errors, warnings } = diagnostics;
    const clean = errors.length === 0 && warnings.length === 0;

    return (
        <div className="output-panel">
            <div className="output-header">
                <div className="output-header-left">
                    <span className="output-title">Problems</span>
                    <span className="output-command">
                        {errors.length} errors, {warnings.length} warnings
                    </span>
                </div>
                <div className="output-header-right">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                        ✕
                    </button>
                </div>
            </div>

            <div className="output-content">
                {clean && (
                    <div className="output-line success">
                        <span className="output-line-icon">✓</span>
                        <span className="output-line-content">No problems found.</span>
                    </div>
                )}
                {errors.map(diagnostic => (
                    <Row key={rowKey('error', diagnostic)} diagnostic={diagnostic} tone="error" icon="✕" />
                ))}
                {warnings.map(diagnostic => (
                    <Row key={rowKey('warning', diagnostic)} diagnostic={diagnostic} tone="warning" icon="⚠" />
                ))}
            </div>
        </div>
    );
}

function Row({ diagnostic, tone, icon }: { diagnostic: Diagnostic; tone: string; icon: string }) {
    return (
        <div className={`output-line ${tone}`}>
            <span className="output-line-icon">{icon}</span>
            <span className="output-line-content">{diagnostic.message}</span>
            {diagnostic.line !== null && <span className="output-line-location">line {diagnostic.line}</span>}
        </div>
    );
}

function rowKey(kind: string, diagnostic: Diagnostic): string {
    return `${kind}-${diagnostic.line}-${diagnostic.message}`;
}
