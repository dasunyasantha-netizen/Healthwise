import React, { useEffect, useRef, useState } from 'react';

const BUILT_SHA = import.meta.env.VITE_BUILD_SHA ?? '';
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const VERSION_URL = '/healthwise/version.json';

// Wait until a newly found service worker has taken over (or give up after a timeout)
function waitForActivation(worker: ServiceWorker, timeoutMs: number): Promise<boolean> {
    if (worker.state === 'activated') return Promise.resolve(true);
    return new Promise(resolve => {
        const timer = setTimeout(() => { worker.removeEventListener('statechange', onChange); resolve(false); }, timeoutMs);
        function onChange() {
            if (worker.state === 'activated' || worker.state === 'redundant') {
                clearTimeout(timer);
                worker.removeEventListener('statechange', onChange);
                resolve(worker.state === 'activated');
            }
        }
        worker.addEventListener('statechange', onChange);
    });
}

// A plain reload is answered by the PWA service worker's cached copy of the OLD build,
// so the banner came straight back. Pull in the new service worker first, then reload.
async function applyUpdateAndReload() {
    try {
        const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
        if (reg) {
            await reg.update().catch(() => {});
            const incoming = reg.installing || reg.waiting;
            const activated = incoming ? await waitForActivation(incoming, 10000) : false;
            if (!activated && 'caches' in window) {
                // No new worker took over: drop the stale precache so the reload goes to the network
                const keys = await caches.keys();
                await Promise.all(keys.filter(k => k.startsWith('workbox-precache')).map(k => caches.delete(k)));
            }
        }
    } catch { /* fall through to a normal reload */ }
    window.location.reload();
}

export const VersionBanner: React.FC = () => {
    const lastCheck = useRef(0);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updating, setUpdating] = useState(false);

    const check = async () => {
        const now = Date.now();
        if (now - lastCheck.current < CHECK_INTERVAL_MS) return;
        lastCheck.current = now;
        try {
            const res = await fetch(VERSION_URL + '?t=' + now, { cache: 'no-store' });
            if (!res.ok) return;
            const { sha } = await res.json();
            if (sha && BUILT_SHA && sha !== BUILT_SHA) setUpdateAvailable(true);
        } catch { /* silently ignore */ }
    };

    useEffect(() => {
        check();
        const onVisibility = () => { if (document.visibilityState === 'visible') check(); };
        const onFocus = () => check();
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onFocus);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    if (!updateAvailable) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px',
            background: '#fff', border: '1px solid #0073ea', borderRadius: '8px',
            padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,115,234,0.15)',
            whiteSpace: 'nowrap', fontFamily: 'Figtree, Inter, sans-serif',
        }}>
            <span style={{ color: '#323338', fontSize: '13px' }}>A new version is available</span>
            <button disabled={updating} onClick={() => { setUpdating(true); applyUpdateAndReload(); }} style={{
                background: '#0073ea', color: '#fff', border: 'none', borderRadius: '6px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: updating ? 'default' : 'pointer',
                opacity: updating ? 0.7 : 1,
            }}>{updating ? 'Updating…' : 'Refresh'}</button>
            <button onClick={() => setUpdateAvailable(false)} style={{
                background: 'none', border: 'none', color: '#676879', cursor: 'pointer',
                fontSize: '16px', lineHeight: 1, padding: '0 2px',
            }}>×</button>
        </div>
    );
};
