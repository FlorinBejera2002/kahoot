import Avatar from './Avatar';
import { formatScore } from '../utils/scoring';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

const RANK_COLORS = { 1: 'text-amber-500', 2: 'text-gray-400', 3: 'text-amber-700' };

export default function PlayerCard({ player, showScore = false, showRank = false, index = 0 }) {
  const { nickname, avatar_url, total_score = 0, rank, streak = 0, rankChange = 0 } = player;

  return (
    <div
      className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:shadow-sm transition-all animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
      role="listitem"
    >
      {showRank && rank && (
        <span className={`font-bold text-lg w-8 text-center ${RANK_COLORS[rank] || 'text-gray-500 dark:text-gray-400'}`}>
          #{rank}
        </span>
      )}
      <Avatar src={avatar_url} name={nickname} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-gray-900 dark:text-white">{nickname}</p>
        {streak > 1 && (
          <span className="flex items-center gap-1 text-amber-500 text-xs">
            <Flame size={12} /> {streak} streak
          </span>
        )}
      </div>
      {showScore && (
        <div className="text-right flex items-center gap-2">
          <span className="font-bold text-lg text-gray-900 dark:text-white">{formatScore(total_score)}</span>
          {rankChange > 0 && <TrendingUp size={14} className="text-green-500" />}
          {rankChange < 0 && <TrendingDown size={14} className="text-red-500" />}
        </div>
      )}
    </div>
  );
}
