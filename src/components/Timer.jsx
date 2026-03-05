export default function Timer({ timeLeft, totalTime }) {
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const circ = 2 * Math.PI * 45;
  const offset = circ * (1 - progress);
  const color = progress <= 0.25 ? '#DC2626' : progress <= 0.5 ? '#d97706' : '#16a34a';
  const pulse = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className={`relative inline-flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
      </svg>
      <span className="absolute text-3xl font-bold font-display" style={{ color }}>{timeLeft}</span>
    </div>
  );
}
