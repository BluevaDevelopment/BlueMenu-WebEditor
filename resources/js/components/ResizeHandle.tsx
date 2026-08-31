import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizeHandleProps {
    /** Which edge of the panel the handle sits on. */
    edge: 'left' | 'right';
    width: number;
    min: number;
    max: number;
    onResize: (width: number) => void;
}

/**
 * Drags a panel wider or narrower.
 *
 * The pointer is captured for the duration, so the drag survives moving over
 * the editor, an iframe or outside the window.
 */
export function ResizeHandle({ edge, width, min, max, onResize }: ResizeHandleProps) {
    const [dragging, setDragging] = useState(false);
    const start = useRef({ x: 0, width: 0 });

    const move = useCallback(
        (event: PointerEvent): void => {
            const delta = event.clientX - start.current.x;
            const next = start.current.width + (edge === 'right' ? delta : -delta);

            onResize(Math.max(min, Math.min(max, next)));
        },
        [edge, max, min, onResize],
    );

    useEffect(() => {
        if (!dragging) {
            return;
        }

        const stop = (): void => setDragging(false);

        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', stop);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', stop);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [dragging, move]);

    return (
        <div
            className={`panel-resize-handle panel-resize-${edge}`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            onPointerDown={event => {
                start.current = { x: event.clientX, width };
                setDragging(true);
                event.preventDefault();
            }}
        />
    );
}
