
/** Decoration names active while rendering a run of characters. */
type Styles = string[];

/** A legacy ampersand code is either a colour or a formatting switch. */
interface LegacyColor {
    hex?: string;
    format?: string;
}

interface RgbColor {
    r: number;
    g: number;
    b: number;
}

export interface MiniMessageExample {
    label: string;
    format: string;
}

/**
 * Parse MiniMessage format to HTML
 * Supports:
 * - <color:#hex> or <#hex>
 * - <gradient:#hex:#hex> ... </gradient>
 * - <bold>, <italic>, <underlined>, <strikethrough>, <obfuscated>
 * - <reset>
 * - Legacy & codes (for backward compatibility)
 */
export function parseMiniMessage(text: string): string {
    if (!text) return '<span style="color: #AAAAAA;">Empty</span>';

    let html = '';
    let i = 0;
    let currentColor = '#AAAAAA';
    let currentStyles: Styles = [];
    let gradientStack: string[][] = [];
    let gradientTextBuffer = '';
    let gradientStartIndex = -1;

    while (i < text.length) {
        // Check for MiniMessage tags
        if (text[i] === '<') {
            const tagMatch = text.substring(i).match(/^<([^>]+)>/);
            if (tagMatch) {
                const tag = tagMatch[1];
                const fullTag = tagMatch[0];

                // Handle closing tags
                if (tag.startsWith('/')) {
                    const closingTag = tag.substring(1);
                    if (closingTag === 'gradient') {
                        // Apply gradient to buffered text
                        if (gradientStack.length > 0 && gradientTextBuffer) {
                            const colors = gradientStack[gradientStack.length - 1];
                            html += applyGradient(gradientTextBuffer, colors, currentStyles);
                            gradientTextBuffer = '';
                        }
                        gradientStack.pop();
                        gradientStartIndex = -1;
                    } else if (closingTag === 'bold') {
                        currentStyles = currentStyles.filter(s => s !== 'bold');
                    } else if (closingTag === 'italic' || closingTag === 'i') {
                        currentStyles = currentStyles.filter(s => s !== 'italic');
                    } else if (closingTag === 'underlined' || closingTag === 'u') {
                        currentStyles = currentStyles.filter(s => s !== 'underline');
                    } else if (closingTag === 'strikethrough' || closingTag === 'st') {
                        currentStyles = currentStyles.filter(s => s !== 'strikethrough');
                    } else if (closingTag === 'obfuscated' || closingTag === 'obf') {
                        currentStyles = currentStyles.filter(s => s !== 'obfuscated');
                    }
                    i += fullTag.length;
                    continue;
                }

                // Color tags
                if (tag.startsWith('#')) {
                    currentColor = tag;
                    i += fullTag.length;
                    continue;
                } else if (tag.startsWith('color:')) {
                    currentColor = tag.substring(6);
                    i += fullTag.length;
                    continue;
                }

                // Gradient tags
                if (tag.startsWith('gradient:')) {
                    const colors = tag.substring(9).split(':');
                    gradientStack.push(colors);
                    gradientStartIndex = i;
                    i += fullTag.length;
                    continue;
                }

                // Named colors
                const namedColor = getNamedColor(tag);
                if (namedColor) {
                    currentColor = namedColor;
                    i += fullTag.length;
                    continue;
                }

                // Decoration tags
                if (tag === 'bold' || tag === 'b') {
                    if (!currentStyles.includes('bold')) currentStyles.push('bold');
                    i += fullTag.length;
                    continue;
                } else if (tag === 'italic' || tag === 'i' || tag === 'em') {
                    if (!currentStyles.includes('italic')) currentStyles.push('italic');
                    i += fullTag.length;
                    continue;
                } else if (tag === 'underlined' || tag === 'u') {
                    if (!currentStyles.includes('underline')) currentStyles.push('underline');
                    i += fullTag.length;
                    continue;
                } else if (tag === 'strikethrough' || tag === 'st') {
                    if (!currentStyles.includes('strikethrough')) currentStyles.push('strikethrough');
                    i += fullTag.length;
                    continue;
                } else if (tag === 'obfuscated' || tag === 'obf') {
                    if (!currentStyles.includes('obfuscated')) currentStyles.push('obfuscated');
                    i += fullTag.length;
                    continue;
                } else if (tag === 'reset') {
                    currentColor = '#AAAAAA';
                    currentStyles = [];
                    gradientStack = [];
                    i += fullTag.length;
                    continue;
                }

                // Unknown tag, treat as text
                if (gradientStack.length > 0) {
                    gradientTextBuffer += '<';
                } else {
                    html += buildStyledChar('<', currentColor, currentStyles);
                }
                i++;
                continue;
            }
        }

        // Check for legacy color codes (backward compatibility)
        if (text[i] === '&' && i + 1 < text.length) {
            const code = '&' + text[i + 1].toLowerCase();
            const legacyColor = getLegacyColor(code);
            if (legacyColor) {
                if (legacyColor.hex) {
                    currentColor = legacyColor.hex;
                } else if (legacyColor.format === 'reset') {
                    currentColor = '#AAAAAA';
                    currentStyles = [];
                } else if (legacyColor.format) {
                    if (!currentStyles.includes(legacyColor.format)) {
                        currentStyles.push(legacyColor.format);
                    }
                }
                i += 2;
                continue;
            }
        }

        // Regular character
        if (gradientStack.length > 0) {
            // Buffer text for gradient
            gradientTextBuffer += text[i];
        } else {
            html += buildStyledChar(text[i], currentColor, currentStyles);
        }
        i++;
    }

    return html || '<span style="color: #AAAAAA;">Empty</span>';
}

/**
 * Apply gradient to text
 */
function applyGradient(text: string, colors: string[], styles: Styles): string {
    if (!text || colors.length < 2) return '';

    const startColor = parseColor(colors[0]);
    const endColor = parseColor(colors[1]);
    const length = text.length;

    let html = '';
    for (let i = 0; i < length; i++) {
        const ratio = length === 1 ? 0 : i / (length - 1);
        const interpolatedColor = interpolateColor(startColor, endColor, ratio);
        html += buildStyledChar(text[i], interpolatedColor, styles);
    }

    return html;
}

/**
 * Parse hex color to RGB
 */
function parseColor(color: string): RgbColor {
    // Remove # if present
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
}

/**
 * Interpolate between two colors
 */
function interpolateColor(color1: RgbColor, color2: RgbColor, ratio: number): string {
    const r = Math.round(color1.r + (color2.r - color1.r) * ratio);
    const g = Math.round(color1.g + (color2.g - color1.g) * ratio);
    const b = Math.round(color1.b + (color2.b - color1.b) * ratio);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Build styled character HTML
 */
function buildStyledChar(char: string, color: string | null, styles: Styles): string {
    let styleStr = `color: ${color};`;

    if (styles.includes('bold')) styleStr += 'font-weight: bold;';
    if (styles.includes('italic')) styleStr += 'font-style: italic;';
    if (styles.includes('underline')) styleStr += 'text-decoration: underline;';
    if (styles.includes('strikethrough')) styleStr += 'text-decoration: line-through;';
    if (styles.includes('obfuscated')) {
        // Random character effect (simplified)
        styleStr += 'animation: obfuscate 0.1s infinite;';
    }

    const escapedChar = escapeHtml(char);

    // Add special class for bold to trigger Mojang-Bold font
    const classes = [];
    if (styles.includes('bold')) classes.push('mm-bold');
    if (styles.includes('italic')) classes.push('mm-italic');
    if (styles.includes('underline')) classes.push('mm-underlined');
    if (styles.includes('strikethrough')) classes.push('mm-strikethrough');

    const classStr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    return `<span${classStr} style="${styleStr}">${escapedChar}</span>`;
}

/**
 * Get named color from Adventure API
 */
function getNamedColor(name: string): string | null {
    const colors: Record<string, string> = {
        'black': '#000000',
        'dark_blue': '#0000AA',
        'dark_green': '#00AA00',
        'dark_aqua': '#00AAAA',
        'dark_red': '#AA0000',
        'dark_purple': '#AA00AA',
        'gold': '#FFAA00',
        'gray': '#AAAAAA',
        'dark_gray': '#555555',
        'blue': '#5555FF',
        'green': '#55FF55',
        'aqua': '#55FFFF',
        'red': '#FF5555',
        'light_purple': '#FF55FF',
        'yellow': '#FFFF55',
        'white': '#FFFFFF'
    };
    return colors[name] || null;
}

/**
 * Get legacy color (for backward compatibility)
 */
function getLegacyColor(code: string): LegacyColor | null {
    const legacyColors: Record<string, LegacyColor> = {
        '&0': { hex: '#000000' },
        '&1': { hex: '#0000AA' },
        '&2': { hex: '#00AA00' },
        '&3': { hex: '#00AAAA' },
        '&4': { hex: '#AA0000' },
        '&5': { hex: '#AA00AA' },
        '&6': { hex: '#FFAA00' },
        '&7': { hex: '#AAAAAA' },
        '&8': { hex: '#555555' },
        '&9': { hex: '#5555FF' },
        '&a': { hex: '#55FF55' },
        '&b': { hex: '#55FFFF' },
        '&c': { hex: '#FF5555' },
        '&d': { hex: '#FF55FF' },
        '&e': { hex: '#FFFF55' },
        '&f': { hex: '#FFFFFF' },
        '&l': { format: 'bold' },
        '&o': { format: 'italic' },
        '&n': { format: 'underline' },
        '&m': { format: 'strikethrough' },
        '&k': { format: 'obfuscated' },
        '&r': { format: 'reset' }
    };
    return legacyColors[code] || null;
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m: string) => map[m]);
}

/**
 * Get common MiniMessage format examples
 */
export function getMiniMessageExamples(): MiniMessageExample[] {
    return [
        { label: 'Red', format: '<red>Text</red>' },
        { label: 'Blue', format: '<blue>Text</blue>' },
        { label: 'Green', format: '<green>Text</green>' },
        { label: 'Yellow', format: '<yellow>Text</yellow>' },
        { label: 'Hex', format: '<#FF5555>Text</#FF5555>' },
        { label: 'Bold', format: '<bold>Text</bold>' },
        { label: 'Italic', format: '<italic>Text</italic>' },
        { label: 'Underlined', format: '<underlined>Text</underlined>' },
        { label: 'Gradient', format: '<gradient:#FF0000:#0000FF>Gradient text</gradient>' }
    ];
}
