import { useRef, useState } from 'react';
import { parseMiniMessage } from '../../editor/miniMessage';
import { GradientBuilder } from './GradientBuilder';
import { HexColourPicker } from './HexColourPicker';

interface FormattedInputProps {
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    ariaLabel: string;
}

interface FormatTag {
    name: string;
    open: string;
    close: string;
    swatch?: string;
}

const COLORS: FormatTag[] = [
    { name: 'White', open: '<white>', close: '</white>', swatch: '#FFFFFF' },
    { name: 'Yellow', open: '<yellow>', close: '</yellow>', swatch: '#FFFF55' },
    { name: 'Light Purple', open: '<light_purple>', close: '</light_purple>', swatch: '#FF55FF' },
    { name: 'Red', open: '<red>', close: '</red>', swatch: '#FF5555' },
    { name: 'Aqua', open: '<aqua>', close: '</aqua>', swatch: '#55FFFF' },
    { name: 'Green', open: '<green>', close: '</green>', swatch: '#55FF55' },
    { name: 'Blue', open: '<blue>', close: '</blue>', swatch: '#5555FF' },
    { name: 'Gray', open: '<gray>', close: '</gray>', swatch: '#AAAAAA' },
    { name: 'Black', open: '<black>', close: '</black>', swatch: '#000000' },
    { name: 'Gold', open: '<gold>', close: '</gold>', swatch: '#FFAA00' },
    { name: 'Dark Purple', open: '<dark_purple>', close: '</dark_purple>', swatch: '#AA00AA' },
    { name: 'Dark Red', open: '<dark_red>', close: '</dark_red>', swatch: '#AA0000' },
    { name: 'Dark Aqua', open: '<dark_aqua>', close: '</dark_aqua>', swatch: '#00AAAA' },
    { name: 'Dark Green', open: '<dark_green>', close: '</dark_green>', swatch: '#00AA00' },
    { name: 'Dark Blue', open: '<dark_blue>', close: '</dark_blue>', swatch: '#0000AA' },
    { name: 'Dark Gray', open: '<dark_gray>', close: '</dark_gray>', swatch: '#555555' },
];

const DECORATIONS: FormatTag[] = [
    { name: 'Bold', open: '<bold>', close: '</bold>' },
    { name: 'Italic', open: '<italic>', close: '</italic>' },
    { name: 'Underlined', open: '<underlined>', close: '</underlined>' },
    { name: 'Strikethrough', open: '<strikethrough>', close: '</strikethrough>' },
    { name: 'Reset', open: '<reset>', close: '' },
];

/**
 * A text field with MiniMessage shortcuts and a live preview.
 *
 * Applying a tag wraps the selection, or inserts the pair at the caret when
 * nothing is selected, so the closing tag is never forgotten.
 */
export function FormattedInput({ value, onChange, multiline, rows = 3, placeholder, ariaLabel }: FormattedInputProps) {
    const field = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const [showColors, setShowColors] = useState(false);
    const [dialog, setDialog] = useState<'hex' | 'gradient' | null>(null);

    const insert = (text: string): void => {
        const element = field.current;
        const start = element?.selectionStart ?? value.length;
        const end = element?.selectionEnd ?? value.length;

        onChange(`${value.slice(0, start)}${text}${value.slice(end)}`);

        queueMicrotask(() => {
            const caret = start + text.length;
            element?.focus();
            element?.setSelectionRange(caret, caret);
        });
    };

    const selectedText = (): string => {
        const element = field.current;

        return value.slice(element?.selectionStart ?? 0, element?.selectionEnd ?? 0);
    };

    const apply = (tag: FormatTag): void => {
        const element = field.current;
        const start = element?.selectionStart ?? value.length;
        const end = element?.selectionEnd ?? value.length;
        const selected = value.slice(start, end);

        onChange(`${value.slice(0, start)}${tag.open}${selected}${tag.close}${value.slice(end)}`);

        // Put the caret between the tags so typing continues inside them.
        queueMicrotask(() => {
            const caret = start + tag.open.length + selected.length;
            element?.focus();
            element?.setSelectionRange(caret, caret);
        });
    };

    return (
        <div>
            {dialog === 'hex' && (
                <HexColourPicker
                    onApply={tag => {
                        insert(tag);
                        setDialog(null);
                    }}
                    onClose={() => setDialog(null)}
                />
            )}

            {dialog === 'gradient' && (
                <GradientBuilder
                    initialText={selectedText()}
                    onApply={tagged => {
                        insert(tagged);
                        setDialog(null);
                    }}
                    onClose={() => setDialog(null)}
                />
            )}

            <div className="minimessage-toolbar">
                <button
                    type="button"
                    onClick={() => setShowColors(open => !open)}
                    className="btn btn-secondary btn-sm"
                >
                    Colour
                </button>
                <button
                    type="button"
                    onClick={() => setDialog('hex')}
                    title="Pick any colour"
                    className="btn btn-secondary btn-sm"
                >
                    #
                </button>
                <button
                    type="button"
                    onClick={() => setDialog('gradient')}
                    title="Build a gradient"
                    className="btn btn-secondary btn-sm"
                >
                    ▤
                </button>
                {DECORATIONS.map(tag => (
                    <button
                        key={tag.name}
                        type="button"
                        onClick={() => apply(tag)}
                        title={tag.name}
                        className="btn btn-secondary btn-sm"
                    >
                        {tag.name.slice(0, 1)}
                    </button>
                ))}
            </div>

            {showColors && (
                <div className="color-codes">
                    {COLORS.map(tag => (
                        <button
                            key={tag.name}
                            type="button"
                            onClick={() => apply(tag)}
                            title={tag.name}
                            aria-label={tag.name}
                            style={{ backgroundColor: tag.swatch }}
                            className="color-code-btn"
                        />
                    ))}
                </div>
            )}

            {multiline ? (
                <textarea
                    ref={field as React.RefObject<HTMLTextAreaElement>}
                    rows={rows}
                    value={value}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    onChange={event => onChange(event.target.value)}
                    className={fieldClass}
                />
            ) : (
                <input
                    ref={field as React.RefObject<HTMLInputElement>}
                    value={value}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    onChange={event => onChange(event.target.value)}
                    className={fieldClass}
                />
            )}

            {value !== '' && (
                <div>
                    {value.split('\n').map((line, index) => (
                        <span
                            key={`${index}-${line}`}
                            className="preview-line"
                            dangerouslySetInnerHTML={{ __html: parseMiniMessage(line) }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const fieldClass =
    'inline-input';
