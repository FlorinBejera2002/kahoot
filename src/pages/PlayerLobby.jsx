import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useGame } from '../hooks/useGame';
import { useRealtimeGameSession, useRealtimePlayers } from '../hooks/useRealtime';
import Avatar from '../components/Avatar';

export default function PlayerLobby() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { gameSession, setGameSession, playerSession, players, addPlayer } = useGame();

  useRealtimeGameSession(gameSession?.id, (updated) => {
    setGameSession(updated);
    if (updated.status !== 'lobby') {
      navigate(`/play/game/${pin}`);
    }
  });

  useRealtimePlayers(gameSession?.id, (newPlayer) => addPlayer(newPlayer));

  useEffect(() => {
    if (!playerSession) navigate('/join');
  }, [playerSession, navigate]);

  if (!playerSession) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <Zap size={48} className="text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold font-display mb-2">You're in!</h1>

        <div className="flex flex-col items-center gap-3 my-6">
          <Avatar src={playerSession.avatar_url} name={playerSession.nickname} size="md" />
          <p className="text-xl font-semibold">{playerSession.nickname}</p>
        </div>

        <p className="text-white/50 mb-2">Game PIN: <span className="font-bold text-white">{pin}</span></p>

        <div className="flex items-center justify-center gap-2 mt-8">
          {[0, 200, 400].map((d) => (
            <div key={d} className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        <p className="text-white/40 mt-4">Waiting for host to start...</p>

        {players.length > 0 && (
          <div className="mt-8">
            <p className="text-white/40 text-sm mb-3">{players.length} player{players.length !== 1 ? 's' : ''} in lobby</p>
            <div className="flex flex-wrap justify-center gap-2">
              {players.filter((p) => p.is_active !== false).map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <Avatar src={p.avatar_url} name={p.nickname} size="xs" />
                  <span className="text-sm">{p.nickname}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
