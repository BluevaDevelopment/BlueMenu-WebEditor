/**
 * The shape of settings.yml, as the plugin reads it.
 *
 * Field paths point into the YAML document, so an edit lands on the exact key
 * and the comments around it survive.
 */

export type ConfigFieldType = 'toggle' | 'select' | 'number' | 'list' | 'text';

export interface ConfigField {
    type: ConfigFieldType;
    label: string;
    description: string;
    path: string[];
    min?: number;
    max?: number;
    options?: { value: string; label: string }[];
    placeholder?: string;
}

export interface ConfigSection {
    id: string;
    title: string;
    description: string;
    fields: ConfigField[];
}

export const CONFIG_SECTIONS: ConfigSection[] = [
    {
        id: 'core',
        title: 'Core Settings',
        description: 'Base configuration for the plugin.',
        fields: [
            {
                type: 'number',
                label: 'File version',
                description: 'Schema version used by the settings file.',
                path: ['file_version'],
                min: 1
            }
        ]
    },
    {
        id: 'metrics',
        title: 'Metrics',
        description: 'Control bStats telemetry reporting.',
        fields: [
            {
                type: 'toggle',
                label: 'Enable metrics',
                description: 'Send anonymous usage statistics to bStats.',
                path: ['metrics']
            }
        ]
    },
    {
        id: 'webeditor',
        title: 'Web Editor',
        description: 'Configure the live web editor connection.',
        fields: [
            {
                type: 'toggle',
                label: 'Enable web editor',
                description: 'Connect to the official BlueMenu web editor.',
                path: ['webeditor', 'enabled']
            },
            {
                type: 'toggle',
                label: 'Require confirmation',
                description: 'Require an in-game confirmation before editing.',
                path: ['webeditor', 'require-confirmation']
            },
            {
                type: 'toggle',
                label: 'Auto-save changes',
                description: 'Save edits made in the web editor automatically.',
                path: ['webeditor', 'auto-save']
            },
            {
                type: 'toggle',
                label: 'Auto-reload menus',
                description: 'Reload menus after saving changes.',
                path: ['webeditor', 'auto-reload']
            },
            {
                type: 'select',
                label: 'Environment',
                description: 'Choose which official editor environment to use.',
                path: ['webeditor', 'environment'],
                options: [
                    { value: 'PRODUCTION', label: 'Production' },
                    { value: 'DEVELOPMENT', label: 'Development' }
                ]
            }
        ]
    },
    {
        id: 'java-menus',
        title: 'Java Menus',
        description: 'Define Java menu keys and file paths.',
        fields: [
            {
                type: 'list',
                label: 'Java menu entries',
                description: 'Each entry uses the format menuKey;file.yml.',
                path: ['java_menus'],
                placeholder: 'menuKey;menu_file.yml'
            }
        ]
    },
    {
        id: 'bedrock-menus',
        title: 'Bedrock Menus',
        description: 'Define Bedrock menu keys and file paths.',
        fields: [
            {
                type: 'list',
                label: 'Bedrock menu entries',
                description: 'Each entry uses the format menuKey;file.yml.',
                path: ['bedrock_menus'],
                placeholder: 'menuKey;menu_file.yml'
            }
        ]
    },
    {
        id: 'sync-menus',
        title: 'Multi-server Sync',
        description: 'Configure menu synchronization across your network.',
        fields: [
            {
                type: 'toggle',
                label: 'Enable synchronization',
                description: 'Turn menu sync on or off.',
                path: ['sync-menus', 'enabled']
            },
            {
                type: 'number',
                label: 'Poll interval (seconds)',
                description: 'How frequently receivers check for updates.',
                path: ['sync-menus', 'poll-interval-seconds'],
                min: 1
            },
            {
                type: 'select',
                label: 'Send conflict policy',
                description: 'Choose what happens when a newer DB version exists.',
                path: ['sync-menus', 'send-conflict-policy'],
                options: [
                    { value: 'SKIP', label: 'Skip (recommended)' },
                    { value: 'OVERWRITE', label: 'Overwrite' }
                ]
            }
        ]
    },
    {
        id: 'sync-send',
        title: 'Sync Send Lists',
        description: 'Menus this server sends to the database.',
        fields: [
            {
                type: 'list',
                label: 'Java menus to send',
                description: 'Entries must match java_menus keys.',
                path: ['sync-menus', 'send', 'java'],
                placeholder: 'menuKey;menu_file.yml'
            },
            {
                type: 'list',
                label: 'Bedrock menus to send',
                description: 'Entries must match bedrock_menus keys.',
                path: ['sync-menus', 'send', 'bedrock'],
                placeholder: 'menuKey;menu_file.yml'
            }
        ]
    },
    {
        id: 'sync-receive',
        title: 'Sync Receive Lists',
        description: 'Menus this server pulls from the database.',
        fields: [
            {
                type: 'list',
                label: 'Java menus to receive',
                description: 'Entries must match java_menus keys.',
                path: ['sync-menus', 'receive', 'java'],
                placeholder: 'menuKey;menu_file.yml'
            },
            {
                type: 'list',
                label: 'Bedrock menus to receive',
                description: 'Entries must match bedrock_menus keys.',
                path: ['sync-menus', 'receive', 'bedrock'],
                placeholder: 'menuKey;menu_file.yml'
            }
        ]
    },
    {
        id: 'mysql',
        title: 'MySQL Connection',
        description: 'Database settings used for menu synchronization.',
        fields: [
            {
                type: 'text',
                label: 'Host',
                description: 'Database host name.',
                path: ['sync-menus', 'mysql', 'host']
            },
            {
                type: 'number',
                label: 'Port',
                description: 'Database port number.',
                path: ['sync-menus', 'mysql', 'port'],
                min: 1
            },
            {
                type: 'text',
                label: 'Database',
                description: 'Database name.',
                path: ['sync-menus', 'mysql', 'database']
            },
            {
                type: 'text',
                label: 'Username',
                description: 'Database user name.',
                path: ['sync-menus', 'mysql', 'username']
            },
            {
                type: 'text',
                label: 'Password',
                description: 'Database password.',
                path: ['sync-menus', 'mysql', 'password']
            },
            {
                type: 'toggle',
                label: 'Use SSL',
                description: 'Enable SSL when connecting to the database.',
                path: ['sync-menus', 'mysql', 'use-ssl']
            },
            {
                type: 'number',
                label: 'Pool size',
                description: 'Maximum number of connections in the pool.',
                path: ['sync-menus', 'mysql', 'pool-size'],
                min: 1
            },
            {
                type: 'number',
                label: 'Connection timeout (ms)',
                description: 'How long to wait before timing out.',
                path: ['sync-menus', 'mysql', 'connection-timeout-ms'],
                min: 1000
            },
            {
                type: 'number',
                label: 'Max lifetime (ms)',
                description: 'Maximum lifetime of a connection in the pool.',
                path: ['sync-menus', 'mysql', 'max-lifetime-ms'],
                min: 1000
            }
        ]
    }
];
