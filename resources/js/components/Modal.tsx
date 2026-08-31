import { useEffect, type ReactNode } from 'react';

interface ModalProps {
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    /** Extra class the original gave each dialog, which carries its width. */
    variant?: string;
    onClose: () => void;
}

/**
 * The editor's dialog shell. Escape and a click on the backdrop close it, the
 * way every dialog in the legacy editor behaved.
 */
export function Modal({ title, children, footer, variant, onClose }: ModalProps) {
    useEffect(() => {
        const escape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', escape);

        return () => document.removeEventListener('keydown', escape);
    }, [onClose]);

    return (
        <div
            className="modal-overlay"
            role="presentation"
            onClick={event => event.target === event.currentTarget && onClose()}
        >
            <div className={`modal${variant === undefined ? '' : ` ${variant}`}`} role="dialog" aria-modal="true" aria-label={title}>
                <div className="modal-header">{title}</div>
                <div className="modal-body">{children}</div>
                {footer !== undefined && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
