import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useRealtimeGameSession, useRealtimePlayers } from '../hooks/useRealtime';
import Avatar from '../components/Avatar';
import EmojiReactions from '../components/EmojiReactions';
import DarkModeToggle from '../components/DarkModeToggle';
import SoundToggle from '../components/SoundToggle';
import { playPlayerJoin, playGameStart } from '../utils/sounds';

export default function PlayerLobby() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { gameSession, setGameSession, playerSession, players, addPlayer, resetGame } = useGame();

  useRealtimeGameSession(gameSession?.id, (updated) => {
    setGameSession(updated);
    if (updated.status !== 'lobby') {
      playGameStart();
      navigate(`/play/game/${pin}`);
    }
  });

  useRealtimePlayers(gameSession?.id, (newPlayer) => {
    addPlayer(newPlayer);
    playPlayerJoin();
  });

  useEffect(() => {
    if (!playerSession) navigate(`/join?pin=${pin}`, { replace: true });
  }, [playerSession, navigate, pin]);

  useEffect(() => {
    if (!playerSession || !gameSession?.id) return;
    if (playerSession.game_session_id !== gameSession.id) {
      resetGame();
      navigate(`/join?pin=${pin}`, { replace: true });
    }
  }, [playerSession, gameSession?.id, resetGame, navigate, pin]);

  if (!playerSession) return null;

  const activePlayers = players.filter((p) => p.is_active !== false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4 flex gap-1">
        <SoundToggle />
        <DarkModeToggle />
      </div>

      <div className="text-center animate-fade-in">
        <img src="/logo.png" alt="QuizBlitz" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-3xl font-bold font-display mb-2 text-gray-900 dark:text-white">You're in!</h1>

        <div className="flex flex-col items-center gap-3 my-6">
          <Avatar src={playerSession.avatar_url} name={playerSession.nickname} size="md" />
          <p className="text-xl font-semibold text-gray-900 dark:text-white">{playerSession.nickname}</p>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-2">Game PIN: <span className="font-bold text-gray-900 dark:text-white">{pin}</span></p>

        {/* Emoji reactions while waiting */}
        <div className="my-6">
          <EmojiReactions />
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          {[0, 200, 400].map((d) => (
            <div key={d} className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        <p className="text-gray-400 dark:text-gray-500 mt-4">Waiting for host to start...</p>

        {activePlayers.length > 0 && (
          <div className="mt-8">
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">
              {activePlayers.length} player{activePlayers.length !== 1 ? 's' : ''} in lobby
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {activePlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 shadow-sm animate-scale-in">
                  <Avatar src={p.avatar_url} name={p.nickname} size="xs" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{p.nickname}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
