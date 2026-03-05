import { Target, Clock, Flame, TrendingUp, Award } from 'lucide-react';
import { formatScore } from '../utils/scoring';

export default function PostGameStats({ stats }) {
  if (!stats) return null;

  const {
    totalScore = 0,
    correctCount = 0,
    totalQuestions = 0,
    bestStreak = 0,
    avgResponseTime = 0,
    rank = 0,
    totalPlayers = 0,
  } = stats;

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const items = [
    { icon: Target, label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-green-600 dark:text-green-400' : accuracy >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400' },
    { icon: Award, label: 'Total Score', value: formatScore(totalScore), color: 'text-primary' },
    { icon: Flame, label: 'Best Streak', value: `${bestStreak}x`, color: 'text-orange-500' },
    { icon: Clock, label: 'Avg. Speed', value: avgResponseTime > 0 ? `${(avgResponseTime / 1000).toFixed(1)}s` : '-', color: 'text-blue-600 dark:text-blue-400' },
    { icon: TrendingUp, label: 'Rank', value: rank > 0 ? `#${rank} / ${totalPlayers}` : '-', color: rank <= 3 ? 'text-amber-500' : 'text-gray-600 dark:text-gray-400' },
  ];

  return (
    <div className="card mt-6 animate-slide-up">
      <h3 className="text-lg font-bold font-display text-center mb-4 text-gray-900 dark:text-gray-100">Your Stats</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <Icon size={20} className={`mx-auto mb-1 ${color}`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
