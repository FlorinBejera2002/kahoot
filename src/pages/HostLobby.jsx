import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Users, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const [showQR, setShowQR] = useState(true);

  const joinUrl = `${window.location.origin}/join?pin=${pin}`;

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <img src="/logo.png" alt="QuizBlitz" className="h-10 w-auto" />
        <h1 className="text-2xl font-bold font-display text-gray-900">QuizBlitz</h1>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="text-center">
          <GamePin pin={pin} />
          <p className="text-gray-500 mt-4">Share this PIN or scan the QR code!</p>
          <button onClick={() => setShowQR(!showQR)} className="text-primary text-sm mt-2 hover:underline flex items-center gap-1 mx-auto font-medium">
            <QrCode size={14} /> {showQR ? 'Hide' : 'Show'} QR Code
          </button>
        </div>

        {showQR && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 animate-scale-in">
            <QRCodeSVG value={joinUrl} size={200} level="H" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-gray-500 mb-4">
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
