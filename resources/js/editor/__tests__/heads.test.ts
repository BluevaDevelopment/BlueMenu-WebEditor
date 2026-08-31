import { describe, expect, it } from 'vitest';
import { getPlayerHeadImageUrl } from '../heads';

function profileFor(textureUrl: string): string {
    return btoa(JSON.stringify({ textures: { SKIN: { url: textureUrl } } }));
}

describe('getPlayerHeadImageUrl', () => {
    it('renders a head from a player name', () => {
        expect(getPlayerHeadImageUrl('Notch')).toBe('https://mc-heads.net/head/Notch/64');
    });

    it('renders a head from a mojang texture url', () => {
        const url = 'https://textures.minecraft.net/texture/abc123def456';

        expect(getPlayerHeadImageUrl(url)).toBe('https://mc-heads.net/head/abc123def456/64');
    });

    it('renders a head from a base64 profile', () => {
        const value = profileFor('https://textures.minecraft.net/texture/deadbeef00'.padEnd(60, '0'));

        expect(getPlayerHeadImageUrl(value)).toContain('https://mc-heads.net/head/');
    });

    it('falls back to the plain head icon for an empty value', () => {
        expect(getPlayerHeadImageUrl('')).toContain('minecraft_player_head.png');
        expect(getPlayerHeadImageUrl(null)).toContain('minecraft_player_head.png');
    });

    it('falls back to the plain head icon for a malformed profile', () => {
        expect(getPlayerHeadImageUrl('x'.repeat(60))).toContain('minecraft_player_head.png');
    });

    it('falls back when a url carries no texture hash', () => {
        expect(getPlayerHeadImageUrl('https://example.com/skin.png')).toContain('minecraft_player_head.png');
    });
});
