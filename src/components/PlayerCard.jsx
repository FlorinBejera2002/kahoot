import Avatar from './Avatar';
import { formatScore } from '../utils/scoring';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

const RANK_COLORS = { 1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-amber-600' };

export default function PlayerCard({ player, showScore = false, showRank = false, index = 0 }) {
  const { nickname, avatar_url, total_score = 0, rank, streak = 0, rankChange = 0 } = player;

  return (
    <div
      className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3 hover:bg-white/15 transition-colors animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {showRank && rank && (
        <span className={`font-bold text-lg w-8 text-center ${RANK_COLORS[rank] || 'text-white/60'}`}>
          #{rank}
        </span>
      )}
      <Avatar src={avatar_url} name={nickname} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{nickname}</p>
        {streak > 1 && (
          <span className="flex items-center gap-1 text-orange-400 text-xs">
            <Flame size={12} /> {streak} streak
          </span>
        )}
      </div>
      {showScore && (
        <div className="text-right flex items-center gap-2">
          <span className="font-bold text-lg">{formatScore(total_score)}</span>
          {rankChange > 0 && <TrendingUp size={14} className="text-green-400" />}
          {rankChange < 0 && <TrendingDown size={14} className="text-red-400" />}
        </div>
      )}
    </div>
  );
}
