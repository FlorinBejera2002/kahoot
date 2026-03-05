import { useEffect, useRef } from 'react';
import { playTimerWarning } from '../utils/sounds';
import { vibrateWarning } from '../utils/haptics';

export default function Timer({ timeLeft, totalTime }) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const circ = 2 * Math.PI * 45;
  const offset = circ * (1 - progress);
  const color = progress <= 0.25 ? '#DC2626' : progress <= 0.5 ? '#d97706' : '#16a34a';
  const pulse = timeLeft <= 5 && timeLeft > 0;
  const lastTickRef = useRef(null);

  // Sound + haptic warning for last 5 seconds
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && timeLeft !== lastTickRef.current) {
      lastTickRef.current = timeLeft;
      playTimerWarning();
      vibrateWarning();
    }
  }, [timeLeft]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}
      role="timer"
      aria-label={`${timeLeft} seconds remaining`}
      aria-live="polite"
    >
      <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6"
          className="text-gray-200 dark:text-gray-700" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
      </svg>
      <span className="absolute text-3xl font-bold font-display" style={{ color }}>{timeLeft}</span>
    </div>
  );
}
