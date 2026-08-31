import { api } from '../api/client';
import type { MenuContent, MenuDescriptor, RpcEnvelope } from '../types/editor';

/**
 * Menu operations. Every one of these reaches the plugin, so a failure here
 * usually means the Minecraft server is down rather than the editor.
 */

function unwrap<T>(envelope: RpcEnvelope<T>): T {
    if (!envelope.ok) {
        throw new Error(envelope.error ?? 'The server refused the operation');
    }

    return envelope.payload;
}

export async function fetchMenus(): Promise<MenuDescriptor[]> {
    const payload = await api.get<RpcEnvelope<{ menus?: MenuDescriptor[] }>>('/api/menus');

    return unwrap(payload).menus ?? [];
}

export async function fetchMenu(platform: string, fileName: string): Promise<MenuContent> {
    const query = new URLSearchParams({ platform: platform.toLowerCase(), fileName });
    const payload = await api.get<RpcEnvelope<MenuContent>>(`/api/menu?${query.toString()}`);

    return unwrap(payload);
}

export async function saveMenu(platform: string, fileName: string, content: string): Promise<void> {
    unwrap(
        await api.post<RpcEnvelope<unknown>>('/api/menu', {
            platform: platform.toLowerCase(),
            fileName,
            content,
        }),
    );
}

export async function deleteMenu(platform: string, fileName: string): Promise<void> {
    unwrap(
        await api.delete<RpcEnvelope<unknown>>('/api/menu', {
            platform: platform.toLowerCase(),
            fileName,
        }),
    );
}

/**
 * settings.yml never appears in the plugin's menu scan, but the editor can open
 * it through the same endpoints under the config platform.
 */
export const SETTINGS_DESCRIPTOR: MenuDescriptor = {
    fileName: 'settings.yml',
    menuName: 'Plugin settings',
    platform: 'CONFIG',
    type: 'CONFIG',
    openCommand: '',
    itemCount: 0,
    registered: true,
    source: 'disk',
};

/** Stable identity of an open tab. */
export function menuKey(menu: Pick<MenuDescriptor, 'platform' | 'fileName'>): string {
    return `${menu.platform.toLowerCase()}-${menu.fileName}`;
}
