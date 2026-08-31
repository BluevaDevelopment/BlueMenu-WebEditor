import { describe, expect, it } from 'vitest';
import { parseMiniMessage } from '../miniMessage';

describe('parseMiniMessage', () => {
    it('renders a named colour as an inline style', () => {
        expect(parseMiniMessage('<red>Danger</red>')).toContain('#FF5555');
    });

    it('renders a hex colour', () => {
        expect(parseMiniMessage('<#55FFFF>Cyan')).toContain('#55FFFF');
    });

    it('renders legacy ampersand codes', () => {
        expect(parseMiniMessage('&aGreen')).toContain('#55FF55');
    });

    it('gives a gradient a different colour at each end', () => {
        const html = parseMiniMessage('<gradient:#000000:#FFFFFF>abcdef</gradient>');

        expect(html).toContain('#000000');
        expect(html).toContain('#ffffff');
    });

    it('escapes markup so a menu name cannot inject html', () => {
        // Every character is rendered in its own span, so the guarantee to check
        // is that no raw tag survives, not that the escaped text stays contiguous.
        const html = parseMiniMessage('<red>' + '<img src=x onerror=alert(1)>' + '</red>');

        expect(html).not.toContain('<img');
        expect(html).not.toContain('onerror=alert');
        expect(html).toContain('&lt;');
        expect(html).toContain('&gt;');
    });

    it('keeps the space between two words', () => {
        const html = parseMiniMessage('two words');

        expect(html.match(/>[ ]</g)).toHaveLength(1);
    });

    it('labels empty text instead of rendering nothing', () => {
        expect(parseMiniMessage('')).toContain('Empty');
    });
});
