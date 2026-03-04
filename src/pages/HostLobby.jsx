import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Users, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../hooks/useGame';
import { useRealtimePlayers, useRealtimeGameSession } from '../hooks/useRealtime';
import GamePin from '../components/GamePin';
import PlayerList from '../components/PlayerList';
import toast from 'react-hot-toast';

export default function HostLobby() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { gameSession, setGameSession, players, addPlayer, removePlayer, setPlayers } = useGame();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      const { data: gs } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('game_pin', pin)
        .single();
      if (!gs) { toast.error('Game not found'); navigate('/dashboard'); return; }
      setGameSession(gs);

      const { data: ps } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('game_session_id', gs.id)
        .eq('is_active', true)
        .order('joined_at');
      setPlayers(ps || []);
      setLoading(false);
    };
    fetchGame();
  }, [pin]);

  useRealtimePlayers(
    gameSession?.id,
    (newPlayer) => addPlayer(newPlayer),
    (updated) => {
      if (!updated.is_active) removePlayer(updated.id);
    }
  );

  useRealtimeGameSession(gameSession?.id, (updated) => {
    setGameSession(updated);
    if (updated.status === 'showing_question') {
      navigate(`/host/game/${pin}`);
    }
  });

  const handleStart = async () => {
    if (players.length === 0) { toast.error('Wait for players to join'); return; }

    const { data, error } = await supabase.rpc('advance_question', {
      p_game_session_id: gameSession.id,
    });
    if (error) { toast.error(error.message); return; }

    navigate(`/host/game/${pin}`);
  };

  const handleKick = async (playerSessionId) => {
    const { error } = await supabase.rpc('kick_player', {
      p_game_session_id: gameSession.id,
      p_player_session_id: playerSessionId,
    });
    if (error) toast.error(error.message);
    else removePlayer(playerSessionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Zap size={28} className="text-yellow-400" />
        <h1 className="text-2xl font-bold font-display">QuizBlitz</h1>
      </div>

      <GamePin pin={pin} />
      <p className="text-white/50 mt-4 mb-8">Share this PIN with players!</p>

      <div className="flex items-center gap-2 text-white/60 mb-4">
        <Users size={20} />
        <span className="font-medium">{players.filter((p) => p.is_active !== false).length} players</span>
      </div>

      <div className="w-full max-w-2xl mb-8">
        <PlayerList players={players} onKick={handleKick} showKick />
      </div>

      <button onClick={handleStart} disabled={players.length === 0}
        className="btn-primary text-xl px-12 py-4 flex items-center gap-3">
        <Play size={24} /> Start Game
      </button>
    </div>
  );
}
