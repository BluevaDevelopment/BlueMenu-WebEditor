import { getMaterialImageUrl } from './materials';

const HEAD_RENDER_SERVICE = 'https://mc-heads.net/head';
const TEXTURE_HASH = /texture\/([a-f0-9]+)/i;
const PLAYER_NAME = /^[a-zA-Z0-9_]{3,16}$/;

/**
 * Picks the image for a player head.
 *
 * A head is configured either by player name, by a texture URL or by the base64
 * profile blob Mojang serves, and each has to be turned into something a browser
 * can render. Anything unrecognisable falls back to the plain head icon rather
 * than leaving a broken image in the canvas.
 */
export function getPlayerHeadImageUrl(value: string | null | undefined): string {
    const trimmed = value?.trim();

    if (!trimmed) {
        return getMaterialImageUrl('PLAYER_HEAD');
    }

    if (PLAYER_NAME.test(trimmed)) {
        return `${HEAD_RENDER_SERVICE}/${trimmed}/64`;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return renderFromTextureUrl(trimmed) ?? getMaterialImageUrl('PLAYER_HEAD');
    }

    if (trimmed.length > 50) {
        return renderFromProfile(trimmed) ?? getMaterialImageUrl('PLAYER_HEAD');
    }

    return getMaterialImageUrl('PLAYER_HEAD');
}

function renderFromTextureUrl(url: string): string | null {
    const match = TEXTURE_HASH.exec(url);

    return match === null ? null : `${HEAD_RENDER_SERVICE}/${match[1]}/64`;
}

function renderFromProfile(base64: string): string | null {
    try {
        const profile = JSON.parse(atob(base64)) as { textures?: { SKIN?: { url?: string } } };
        const skinUrl = profile.textures?.SKIN?.url;

        return skinUrl === undefined ? null : renderFromTextureUrl(skinUrl);
    } catch {
        // A malformed value is a config mistake, not a crash: show the plain head.
        return null;
    }
}
