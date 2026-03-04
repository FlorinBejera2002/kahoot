import PlayerCard from './PlayerCard';

export default function Leaderboard({ players = [], maxShow = 5, title = 'Leaderboard' }) {
  const sorted = [...players].sort((a, b) => (b.total_score || 0) - (a.total_score || 0)).slice(0, maxShow);

  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-4 text-center font-display">{title}</h3>
      <div className="space-y-2">
        {sorted.map((player, i) => (
          <PlayerCard
            key={player.player_session_id || player.id || i}
            player={{ ...player, rank: i + 1 }}
            showScore showRank index={i}
          />
        ))}
      </div>
      {players.length === 0 && <p className="text-center text-white/40 py-8">No players yet</p>}
    </div>
  );
}
