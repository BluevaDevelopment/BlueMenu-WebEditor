import type { YamlRecord } from '../../editor/model';

interface AttributeEditorProps {
    attributes: YamlRecord | undefined;
    onChange: (attributes: YamlRecord) => void;
}

/** Item flags the plugin can hide, written as [BOOLEAN] NAME;true. */
const ITEM_FLAGS: readonly string[] = [
    'HIDE_ATTRIBUTES',
    'HIDE_DESTROYS',
    'HIDE_DYE',
    'HIDE_ENCHANTS',
    'HIDE_PLACED_ON',
    'HIDE_POTION_EFFECTS',
    'HIDE_UNBREAKABLE',
];

/** Common enchantments, offered as suggestions rather than as a closed list. */
const SUGGESTED_ENCHANTMENTS: readonly string[] = [
    'EFFICIENCY',
    'FIRE_ASPECT',
    'FLAME',
    'FORTUNE',
    'INFINITY',
    'KNOCKBACK',
    'LOOTING',
    'MENDING',
    'POWER',
    'PROTECTION',
    'PUNCH',
    'SHARPNESS',
    'SILK_TOUCH',
    'UNBREAKING',
];

export function AttributeEditor({ attributes, onChange }: AttributeEditorProps) {
    const flags = (attributes?.flags ?? {}) as Record<string, boolean>;
    const enchantments = (attributes?.enchantments ?? {}) as Record<string, number>;

    const update = (patch: YamlRecord): void => onChange({ flags, enchantments, ...patch });

    return (
        <section>
            <div className="editor-field">
                <span className="section-heading">Item flags</span>
                <div className="attributes-list">
                    {ITEM_FLAGS.map(flag => (
                        <label key={flag} className="attribute-item">
                            <input
                                type="checkbox"
                                checked={flags[flag] === true}
                                onChange={event => update({ flags: { ...flags, [flag]: event.target.checked } })}
                            />
                            <span className="attribute-type-badge">FLAG</span>
                            <span className="attribute-value">{flag}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="editor-field">
                <span className="section-heading">Enchantments</span>

                <div className="attributes-list">
                    {Object.entries(enchantments).map(([name, level]) => (
                        <div key={name} className="attribute-item">
                            <span className="attribute-type-badge">ENCH</span>
                            <span className="attribute-value">{name}</span>
                            <input
                                type="number"
                                min={1}
                                value={level}
                                onChange={event =>
                                    update({ enchantments: { ...enchantments, [name]: Number(event.target.value) } })
                                }
                                aria-label={`${name} level`}
                                className="inline-input"
                                style={{ width: '70px' }}
                            />
                            <div className="attribute-actions">
                                <button
                                    type="button"
                                    className="attribute-btn-delete"
                                    title="Delete"
                                    onClick={() => {
                                        const next = { ...enchantments };
                                        delete next[name];
                                        update({ enchantments: next });
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <select
                    value=""
                    onChange={event => {
                        if (event.target.value !== '') {
                            update({ enchantments: { ...enchantments, [event.target.value]: 1 } });
                        }
                    }}
                    aria-label="Add enchantment"
                    className="inline-input"
                >
                    <option value="">Add enchantment...</option>
                    {SUGGESTED_ENCHANTMENTS.filter(name => enchantments[name] === undefined).map(name => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>
        </section>
    );
}
