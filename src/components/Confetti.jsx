import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playVictory } from '../utils/sounds';
import { vibrateCelebration } from '../utils/haptics';

export default function Confetti({ intensity = 'normal' }) {
  useEffect(() => {
    playVictory();
    vibrateCelebration();

    const duration = intensity === 'big' ? 5000 : 3000;
    const particleCount = intensity === 'big' ? 5 : 3;
    const end = Date.now() + duration;
    const colors = ['#EAC243', '#DC2626', '#2563eb', '#16a34a'];

    const frame = () => {
      confetti({ particleCount, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [intensity]);

  return null;
}
