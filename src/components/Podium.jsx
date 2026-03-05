import Avatar from './Avatar';
import Confetti from './Confetti';
import { formatScore } from '../utils/scoring';
import { Trophy } from 'lucide-react';

const CONFIG = [
  { place: 2, h: 'h-28', label: '2nd', grad: 'from-gray-300 to-gray-400', medal: '\uD83E\uDD48' },
  { place: 1, h: 'h-40', label: '1st', grad: 'from-amber-400 to-amber-500', medal: '\uD83E\uDD47' },
  { place: 3, h: 'h-20', label: '3rd', grad: 'from-amber-600 to-amber-700', medal: '\uD83E\uDD49' },
];

const EMPTY_PLAYERS = [];

export default function Podium({ players }) {
  const safePlayers = players || EMPTY_PLAYERS;
  const podiumPlayers = safePlayers.slice(0, 3);
  const slots = { 1: null, 2: null, 3: null };

  podiumPlayers.forEach((player, index) => {
    const parsedRank = Number(player?.rank);
    const preferredPlace = Number.isInteger(parsedRank) && parsedRank >= 1 && parsedRank <= 3
      ? parsedRank
      : null;

    if (preferredPlace && !slots[preferredPlace]) {
      slots[preferredPlace] = player;
      return;
    }

    const fallbackPlace = index + 1;
    if (!slots[fallbackPlace]) {
      slots[fallbackPlace] = player;
      return;
    }

    const firstEmptyPlace = [1, 2, 3].find((place) => !slots[place]);
    if (firstEmptyPlace) slots[firstEmptyPlace] = player;
  });

  const ordered = [slots[2], slots[1], slots[3]];

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <Confetti intensity="big" />
      <div className="flex items-center gap-2 mb-8 animate-bounce-in">
        <Trophy className="text-amber-500" size={32} />
        <h2 className="text-3xl font-bold font-display text-gray-900 dark:text-white">Final Results</h2>
        <Trophy className="text-amber-500" size={32} />
      </div>

      <div className="flex items-end justify-center gap-4 w-full mb-8">
        {CONFIG.map((cfg, idx) => {
          const p = ordered[idx];
          if (!p) return <div key={cfg.place} className="flex-1" />;
          return (
            <div key={cfg.place} className="flex flex-col items-center flex-1 animate-slide-up"
              style={{ animationDelay: `${idx * 200}ms` }}>
              <div className="animate-bounce-in relative" style={{ animationDelay: `${idx * 200 + 300}ms` }}>
                <Avatar src={p.avatar_url} name={p.nickname} size={cfg.place === 1 ? 'lg' : 'md'} />
                <span className="absolute -top-2 -right-2 text-2xl" aria-label={cfg.label}>{cfg.medal}</span>
              </div>
              <p className="font-bold mt-2 text-sm truncate max-w-full text-gray-900 dark:text-white">{p.nickname}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{formatScore(p.total_score)} pts</p>
              <div className={`w-full ${cfg.h} bg-gradient-to-t ${cfg.grad} rounded-t-lg flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
