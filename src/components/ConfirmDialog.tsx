import { useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

// In-app replacement for the browser's confirm()/alert() popups, styled like the rest of HealthWise.
// Usage:  if (await confirmDialog({ title: 'Delete this?', tone: 'danger', confirmLabel: 'Delete' })) { ... }
//         await notifyDialog({ title: 'Something went wrong', message: 'Please try again.' });

export interface DialogOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'primary' | 'danger';
    icon?: ReactNode;
}

function Dialog({ title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', tone = 'primary', icon, showCancel, onDone }:
    DialogOptions & { showCancel: boolean; onDone: (ok: boolean) => void }) {

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onDone]);

    const danger = tone === 'danger';

    return (
        <div className="modal-overlay center" style={{ zIndex: 1000 }} onClick={() => onDone(false)}>
            <div className="modal-center" role="alertdialog" aria-modal="true" aria-labelledby="hw-dialog-title"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 360, padding: 22, textAlign: 'center' }}>
                {icon && (
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%', margin: '0 auto 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: danger ? '#fef2f2' : 'var(--color-primary-bg)',
                        color: danger ? 'var(--color-danger)' : 'var(--color-primary)',
                    }}>
                        {icon}
                    </div>
                )}
                <h3 id="hw-dialog-title" style={{ fontSize: '1.0625rem', fontWeight: 700, margin: 0, marginBottom: message ? 6 : 20 }}>
                    {title}
                </h3>
                {message && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-2)', lineHeight: 1.5, margin: '0 0 20px' }}>
                        {message}
                    </p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                    {showCancel && (
                        <button className="btn" onClick={() => onDone(false)}
                            style={{ flex: 1, justifyContent: 'center', background: 'var(--color-surface-2)', color: 'var(--color-text-2)' }}>
                            {cancelLabel}
                        </button>
                    )}
                    <button className="btn" autoFocus onClick={() => onDone(true)}
                        style={{ flex: 1, justifyContent: 'center', color: '#fff', background: danger ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function open(opts: DialogOptions, showCancel: boolean): Promise<boolean> {
    return new Promise(resolve => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        let settled = false;
        const onDone = (ok: boolean) => {
            if (settled) return;
            settled = true;
            resolve(ok);
            setTimeout(() => { root.unmount(); host.remove(); }, 0);
        };
        root.render(<Dialog {...opts} showCancel={showCancel} onDone={onDone} />);
    });
}

/** Ask a yes/no question. Resolves true when the user confirms. */
export function confirmDialog(opts: DialogOptions): Promise<boolean> {
    return open(opts, true);
}

/** Show a message with a single OK button. */
export function notifyDialog(opts: DialogOptions): Promise<void> {
    return open({ confirmLabel: 'OK', ...opts }, false).then(() => undefined);
}
