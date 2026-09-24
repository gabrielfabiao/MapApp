'use client';

import { useEffect, useState } from 'react';

// Shown once per browser, so it doesn't nag on every visit once someone has
// already read it. Same localStorage-flag pattern as the dashboard tutorial.
const SEEN_KEY = 'bloomap.testNoticeSeen';

// Delayed so it never competes with SplashScreen's intro animation (which
// holds the screen for up to ~2s) for attention.
const SHOW_DELAY_MS = 1800;
const AUTO_DISMISS_MS = 8000;

function hasSeenNotice() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // No storage - don't show something we can't remember dismissing.
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* nothing to persist to - the notice just shows again next visit */
  }
}

export default function TestNoticeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasSeenNotice()) return;
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      markSeen();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(dismissTimer);
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    markSeen();
  };

  if (!visible) return null;

  return (
    <div className="test-notice-banner fade-in" role="status">
      <span>
        <strong>Test version</strong> — your garden only lives in this browser and won't carry
        over to another device.
      </span>
      <button type="button" className="test-notice-close" aria-label="Dismiss" onClick={handleDismiss}>
        &times;
      </button>
    </div>
  );
}
