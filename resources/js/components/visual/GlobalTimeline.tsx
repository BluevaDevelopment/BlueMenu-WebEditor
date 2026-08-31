import { useEffect, useState } from 'react';
import { ItemIcon } from './ItemIcon';
import type { VisualJavaMenu } from '../../editor/model';

interface GlobalTimelineProps {
    menu: VisualJavaMenu;
    serverVersion: string | null;
}

/** A Minecraft tick. */
const TICK_MS = 50;

/**
 * Every animation of the menu on one grid, played together.
 *
 * Animations that share a slot or run at different intervals only reveal how
 * they look side by side, which a single slot timeline cannot show.
 */
export function GlobalTimeline({ menu, serverVersion }: GlobalTimelineProps) {
    const [playing, setPlaying] = useState(false);
    const [tick, setTick] = useState(0);

    const rows = Object.entries(menu.animations);

    useEffect(() => {
        if (!playing) {
            return;
        }

        const timer = setInterval(() => setTick(current => current + 1), TICK_MS);

        return () => clearInterval(timer);
    }, [playing]);

    if (rows.length === 0) {
        return null;
    }

    return (
        <div className="global-animation-timeline-container">
            <div className="global-timeline-header">
                <div className="global-timeline-header-left">
                    <span className="global-timeline-title">🎬 Global Animation Timeline</span>
                    <span className="global-timeline-status">{playing ? 'Playing' : 'Stopped'}</span>
                </div>

                <div className="global-timeline-controls">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPlaying(true)} title="Play">
                        ▶️ Play
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPlaying(false)} title="Stop">
                        ⏹️ Stop
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setTick(0)}
                        title="Back to the first frame"
                    >
                        🔄 Reset
                    </button>
                </div>
            </div>

            <div className="global-timeline-rows">
                {rows.map(([name, animation]) => {
                    const frames = Object.entries(animation.frames);
                    const interval = Math.max(1, animation.interval);
                    const current = frames.length === 0 ? -1 : Math.floor(tick / interval) % frames.length;

                    return (
                        <div key={name} className="global-timeline-row">
                            <div className="global-timeline-row-header">
                                <span className="global-timeline-slot-label">{name}</span>
                                <span className="global-timeline-info">
                                    {frames.length} frames · every {interval} ticks
                                </span>
                            </div>

                            <div className="global-timeline-frames-container">
                                {frames.map(([key, frame], index) => (
                                    <div
                                        key={key}
                                        className={`global-timeline-frame${playing && index === current ? ' active' : ''}`}
                                        title={`${frame.material} (frame ${index + 1})`}
                                    >
                                        <ItemIcon item={frame} serverVersion={serverVersion} variant="canvas" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
