'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Logo from './Logo';

const HOLD_MS = 2050;
const HOLD_MS_REDUCED = 500;
const FADE_MS = 500;

export default function SplashScreen({ onFinish }) {
    const [visible, setVisible] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const finished = useRef(false);

    const finish = useCallback(() => {
        if (finished.current) return;
        finished.current = true;
        setVisible(false);
        onFinish?.();
    }, [onFinish]);

    useEffect(() => {
        if (!visible || finished.current) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = reduced ? HOLD_MS_REDUCED : HOLD_MS;

        const fadeTimer = setTimeout(() => setLeaving(true), hold);
        const endTimer = setTimeout(finish, hold + (reduced ? 0 : FADE_MS));

        const skip = () => finish();
        window.addEventListener('keydown', skip);
        window.addEventListener('pointerdown', skip);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(endTimer);
            window.removeEventListener('keydown', skip);
            window.removeEventListener('pointerdown', skip);
        };
    }, [visible, finish]);

    if (!visible) return null;

    return (
        <div className={`splash${leaving ? ' splash-leaving' : ''}`} role="status" aria-label="BlooMap">
            <div className="splash-inner">
                <div className="splash-mark">
                    <Logo size={112} showWordmark={false} />
                </div>
                <div className="splash-wordmark">BlooMap</div>
                <div className="splash-tagline">Map your garden. Follow the sun.</div>
            </div>
            <button type="button" className="splash-skip" onClick={finish}>Skip</button>
        </div>
    );
}
