import type { MenuDescriptor } from '../types/editor';

/**
 * The sample menus the plugin ships, served by the editor so the interface can
 * be tried without a Minecraft server attached.
 */
export const DEMO_MENUS: MenuDescriptor[] = [
    demo('JAVA', 'chest_example.yml', 'CHEST', 4),
    demo('JAVA', 'conditions_example.yml', 'CHEST', 10),
    demo('JAVA', 'slots_helper.yml', 'CHEST', 54),
    demo('BEDROCK', 'conditions_custom_example.yml', 'CUSTOM', 9),
    demo('BEDROCK', 'conditions_simple_example.yml', 'SIMPLE', 6),
    demo('BEDROCK', 'custom_example.yml', 'CUSTOM', 10),
    demo('BEDROCK', 'modal_example.yml', 'MODAL', 2),
    demo('BEDROCK', 'simple_example.yml', 'SIMPLE', 4),
    demo('CONFIG', 'settings.yml', 'CONFIG', 0),
];

export async function fetchDemoMenu(menu: MenuDescriptor): Promise<string> {
    const url =
        menu.platform === 'CONFIG'
            ? '/api/demo/settings'
            : `/api/demo/menus/${menu.platform.toLowerCase()}/${menu.fileName}`;

    const response = await fetch(url, { headers: { Accept: 'text/yaml' } });

    if (!response.ok) {
        throw new Error(`Could not load the ${menu.fileName} sample`);
    }

    return response.text();
}

function demo(platform: string, fileName: string, type: string, itemCount: number): MenuDescriptor {
    return {
        fileName,
        menuName: fileName.replace('.yml', ''),
        platform,
        type,
        openCommand: '',
        itemCount,
        registered: true,
        source: 'disk',
    };
}
