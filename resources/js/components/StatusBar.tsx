interface StatusBarProps {
    left: string;
    right: string;
    onToggleOutput: () => void;
}

export function StatusBar({ left, right, onToggleOutput }: StatusBarProps) {
    return (
        <footer className="ide-statusbar">
            <div className="statusbar-left">
                <span>BlueMenu Editor</span>
                <span>{left}</span>
                <button type="button" className="statusbar-btn" onClick={onToggleOutput} title="Toggle Output Panel">
                    <span className="statusbar-btn-icon">📋</span>
                    <span className="statusbar-btn-text">Output</span>
                </button>
            </div>
            <div className="statusbar-right">
                <span>{right}</span>
            </div>
        </footer>
    );
}
