import { useEffect, useState } from 'react';

export default function ScorePopup({ points, show }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && points > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [show, points]);

  if (!visible) return null;

  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-20">
      <span className="animate-score-pop text-2xl font-bold text-accent drop-shadow-lg">
        +{points}
      </span>
    </div>
  );
}
