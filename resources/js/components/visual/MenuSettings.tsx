import { ActionEditor } from './ActionEditor';
import { FormattedInput } from './FormattedInput';
import { ConditionEditor } from './ConditionEditor';
import type { VisualJavaMenu, YamlRecord } from '../../editor/model';

interface MenuSettingsProps {
    menu: VisualJavaMenu;
    onChange: (menu: VisualJavaMenu) => void;
}

/** The menu level fields: what it is called, how it opens and who may open it. */
export function MenuSettings({ menu, onChange }: MenuSettingsProps) {
    const update = (patch: Partial<VisualJavaMenu>): void => onChange({ ...menu, ...patch });

    return (
        <section className="menu-settings-container">
            

            <div className="menu-setting-section">
                <span className="menu-setting-label">Title</span>
                <FormattedInput ariaLabel="Menu title" value={menu.title} onChange={title => update({ title })} />
            </div>

            <label className="menu-setting-section">
                <span className="menu-setting-label">Open command</span>
                <input
                    value={menu.openCommand}
                    onChange={event => update({ openCommand: event.target.value })}
                    placeholder="/menu"
                    className="menu-setting-input"
                />
            </label>

            <label className="menu-setting-section">
                <span className="menu-setting-label">Open permission</span>
                <input
                    value={menu.openPermission}
                    onChange={event => update({ openPermission: event.target.value })}
                    placeholder="bluemenu.menu.example"
                    className="menu-setting-input"
                />
            </label>

            <ActionEditor
                actions={menu.open_actions.map(String)}
                onChange={actions => update({ open_actions: actions as unknown as YamlRecord[] })}
            />

            <ConditionEditor
                label="Open conditions"
                conditions={menu.open_conditions}
                onChange={next => update({ open_conditions: next as YamlRecord | null })}
            />
        </section>
    );
}

const inputClass =
    'inline-input';
