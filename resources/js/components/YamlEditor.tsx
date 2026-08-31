import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';

interface YamlEditorProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * The plugin reads two space indentation and rejects tabs, so the editor is
 * configured to make the correct thing the easy thing.
 */
export function YamlEditor({ value, onChange }: YamlEditorProps) {
    const extensions = useMemo(() => [yaml()], []);

    return (
        <CodeMirror
            value={value}
            height="100%"
            theme={oneDark}
            extensions={extensions}
            onChange={onChange}
            indentWithTab={false}
            basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: false, highlightActiveLine: true }}
            className="yaml-editor"
        />
    );
}
