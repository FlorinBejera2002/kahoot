import Avatar from './Avatar';
import { X } from 'lucide-react';

export default function PlayerList({ players = [], onKick, showKick = false }) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4 gap-2">
          {[0, 150, 300].map((d) => (
            <div key={d} className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        <p className="text-white/40">Waiting for players to join...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {players.filter((p) => p.is_active !== false).map((player) => (
        <div
          key={player.id}
          className="card flex items-center gap-3 p-3 group animate-scale-in"
        >
          <Avatar src={player.avatar_url} name={player.nickname} size="sm" />
          <span className="font-medium flex-1 truncate text-sm">{player.nickname}</span>
          {showKick && onKick && (
            <button
              onClick={() => onKick(player.id)}
              className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
