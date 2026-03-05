import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function Confetti() {
  useEffect(() => {
    const end = Date.now() + 3000;
    const colors = ['#EAC243', '#DC2626', '#2563eb', '#16a34a'];

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return null;
}
