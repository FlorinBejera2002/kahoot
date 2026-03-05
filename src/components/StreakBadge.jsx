import { Flame, Zap, Star } from 'lucide-react';

const STREAK_CONFIG = [
  { min: 2, label: 'On Fire', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
  { min: 5, label: 'Blazing', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { min: 10, label: 'Legendary', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
];

export default function StreakBadge({ streak }) {
  if (!streak || streak < 2) return null;

  const config = [...STREAK_CONFIG].reverse().find((c) => streak >= c.min) || STREAK_CONFIG[0];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold
      ${config.bg} ${streak >= 5 ? 'animate-streak-glow' : ''} transition-all`}>
      <Icon size={16} className={config.color} />
      <span className={config.color}>{streak} {config.label}!</span>
    </div>
  );
}
