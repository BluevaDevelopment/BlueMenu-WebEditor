import { useState } from 'react';
import { ItemIcon } from './ItemIcon';
import { MaterialSelector } from './MaterialSelector';
import type { Playback } from './VisualEditor';
import type { VisualAnimation, VisualItem, VisualJavaMenu } from '../../editor/model';

interface AnimationEditorProps {
    menu: VisualJavaMenu;
    serverVersion: string | null;
    onChange: (menu: VisualJavaMenu) => void;
    playback: Playback;
}

/** Ticks per frame, as the plugin counts them. */
const DEFAULT_INTERVAL = 2;

/**
 * The animation strip: one card per frame, played back at the configured rate
 * so the sequence can be judged without opening the game.
 */
export function AnimationEditor({ menu, serverVersion, onChange, playback }: AnimationEditorProps) {
    const names = Object.keys(menu.animations);
    const [selected, setSelected] = useState<string | null>(names[0] ?? null);
    const [picked, setPicked] = useState(0);

    const active = selected === null ? undefined : menu.animations[selected];
    const frames = active === undefined ? [] : Object.entries(active.frames);

    // While it plays, the strip follows the shared clock; otherwise it shows
    // whichever frame is being edited.
    const frameIndex =
        playback.playing && frames.length > 0
            ? Math.floor(playback.tick / Math.max(1, active?.interval ?? DEFAULT_INTERVAL)) % frames.length
            : Math.min(picked, Math.max(0, frames.length - 1));

    if (names.length === 0) {
        return (
            <div className="animation-timeline-container">
                <div className="timeline-header">
                    <span className="timeline-title">⚡ Animation Timeline (Individual Slot)</span>
                    <div className="timeline-controls">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addAnimation(menu, onChange)}>
                            + Animation
                        </button>
                    </div>
                </div>
                <div className="timeline-frames">
                    <span className="empty-note">This menu has no animated items.</span>
                </div>
            </div>
        );
    }

    const update = (animation: VisualAnimation): void => {
        if (selected !== null) {
            onChange({ ...menu, animations: { ...menu.animations, [selected]: animation } });
        }
    };

    return (
        <div className="animation-timeline-container">
            <div className="timeline-header">
                <span className="timeline-title">⚡ Animation Timeline (Individual Slot)</span>

                <div className="timeline-controls">
                    <select
                        className="inline-input"
                        style={{ width: 'auto' }}
                        value={selected ?? ''}
                        onChange={event => {
                            setSelected(event.target.value);
                            setPicked(0);
                        }}
                        aria-label="Animation"
                    >
                        {names.map(name => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>

                    <button type="button" className="btn btn-secondary btn-sm" onClick={playback.play} title="Play">
                        ▶️
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={playback.stop} title="Stop">
                        ⏹️
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        title="Add Frame"
                        onClick={() =>
                            active !== undefined &&
                            update({
                                ...active,
                                frames: {
                                    ...active.frames,
                                    [`frame${frames.length + 1}`]: lastFrame(frames) ?? { material: 'STONE', amount: 1 },
                                },
                            })
                        }
                    >
                        + Frame
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => addAnimation(menu, onChange)} title="Add animation">
                        + Animation
                    </button>

                    <span className="timeline-interval">
                        Interval:{' '}
                        <input
                            type="number"
                            min={1}
                            max={100}
                            style={{ width: '60px' }}
                            value={active?.interval ?? DEFAULT_INTERVAL}
                            onChange={event => active !== undefined && update({ ...active, interval: Number(event.target.value) })}
                            aria-label="Interval in ticks"
                        />{' '}
                        ticks
                    </span>
                </div>
            </div>

            <div className="timeline-frames">
                {frames.map(([key, frame], index) => (
                    <div
                        key={key}
                        className={`timeline-frame${index === frameIndex ? ' active' : ''}`}
                        title={`Frame ${index + 1}: ${frame.material}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setPicked(index)}
                        onKeyDown={event => event.key === 'Enter' && setPicked(index)}
                    >
                        <div className="timeline-frame-number">{index + 1}</div>
                        <div className="timeline-frame-preview">
                            <ItemIcon item={frame} serverVersion={serverVersion} variant="canvas" />
                        </div>
                    </div>
                ))}
            </div>

            {frames[frameIndex] !== undefined && active !== undefined && (
                <FrameFields
                    frame={frames[frameIndex][1]}
                    serverVersion={serverVersion}
                    onChange={frame =>
                        update({ ...active, frames: { ...active.frames, [frames[frameIndex][0]]: frame } })
                    }
                    onRemove={() => {
                        const next = { ...active.frames };
                        delete next[frames[frameIndex][0]];
                        update({ ...active, frames: next });
                        setPicked(0);
                    }}
                />
            )}
        </div>
    );
}

function FrameFields({
    frame,
    serverVersion,
    onChange,
    onRemove,
}: {
    frame: VisualItem;
    serverVersion: string | null;
    onChange: (frame: VisualItem) => void;
    onRemove: () => void;
}) {
    return (
        <div className="editor-row">
            <MaterialSelector
                material={frame.material}
                serverVersion={serverVersion}
                onChange={material => onChange({ ...frame, material })}
            />
            <input
                className="inline-input"
                value={typeof frame.name === 'string' ? frame.name : ''}
                onChange={event => onChange({ ...frame, name: event.target.value })}
                placeholder="name"
                aria-label="Frame name"
            />
            <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
                Remove frame
            </button>
        </div>
    );
}

function lastFrame(frames: [string, VisualItem][]): VisualItem | undefined {
    const entry = frames[frames.length - 1];

    return entry === undefined ? undefined : { ...entry[1] };
}

function addAnimation(menu: VisualJavaMenu, onChange: (menu: VisualJavaMenu) => void): void {
    let index = Object.keys(menu.animations).length + 1;

    while (menu.animations[`animation${index}`] !== undefined) {
        index++;
    }

    onChange({
        ...menu,
        animations: { ...menu.animations, [`animation${index}`]: { interval: DEFAULT_INTERVAL, frames: {} } },
    });
}
