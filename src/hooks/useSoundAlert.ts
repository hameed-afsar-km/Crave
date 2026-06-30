'use client';

import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'crave-sound-enabled';

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not available
  }
}

export function useSoundAlert() {
  const enabled = useRef(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    enabled.current = stored !== 'false';
  }, []);

  const notify = useCallback(() => {
    if (enabled.current) {
      playChime();
    }
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    enabled.current = val;
    localStorage.setItem(STORAGE_KEY, String(val));
  }, []);

  return { notify, setEnabled, isEnabled: () => enabled.current };
}
