import { frameAt, slotAnimations } from '../../editor/animation';
import { ItemIcon } from './ItemIcon';
import type { Playback } from './VisualEditor';
import type { VisualJavaMenu } from '../../editor/model';

interface GlobalTimelineProps {
    menu: VisualJavaMenu;
    serverVersion: string | null;
    playback: Playback;
}

/**
 * Every animation of the menu on one grid, played together.
 *
 * Animations that share a slot or run at different intervals only reveal how
 * they look side by side, which a single slot timeline cannot show.
 */
export function GlobalTimeline({ menu, serverVersion, playback }: GlobalTimelineProps) {
    const rows = slotAnimations(menu);

    if (rows.length === 0) {
        return null;
    }

    return (
        <div className="global-animation-timeline-container">
            <div className="global-timeline-header">
                <div className="global-timeline-header-left">
                    <span className="global-timeline-title">🎬 Global Animation Timeline</span>
                    <span className="global-timeline-status">{playback.playing ? 'Playing' : 'Stopped'}</span>
                </div>

                <div className="global-timeline-controls">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={playback.play} title="Play">
                        ▶️ Play
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={playback.stop} title="Stop">
                        ⏹️ Stop
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={playback.reset}
                        title="Back to the first frame"
                    >
                        🔄 Reset
                    </button>
                </div>
            </div>

            <div className="global-timeline-rows">
                {rows.map(animation => {
                    const current = frameAt(animation, playback.tick);

                    return (
                        <div key={animation.key} className="global-timeline-row">
                            <div className="global-timeline-row-header">
                                <span className="global-timeline-slot-label">
                                    {animation.key} · slot {animation.slot}
                                </span>
                                <span className="global-timeline-info">
                                    {animation.frames.length} frames · every {animation.interval} ticks
                                </span>
                            </div>

                            <div className="global-timeline-frames-container">
                                {animation.frames.map((frame, index) => (
                                    <div
                                        key={`${animation.key}-${index}`}
                                        className={`global-timeline-frame${playback.playing && frame === current ? ' active' : ''}`}
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
