import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../hooks/useGame';
import AvatarPicker from '../components/AvatarPicker';
import toast from 'react-hot-toast';

export default function JoinGame() {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [joining, setJoining] = useState(false);
  const { user } = useAuth();
  const { setPlayerSession, setGameSession } = useGame();
  const navigate = useNavigate();

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) { toast.error('PIN must be 6 digits'); return; }

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('game_pin', pin)
      .eq('status', 'lobby')
      .single();

    if (error || !data) { toast.error('Game not found or already started'); return; }
    setGameSession(data);
    setStep(2);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) { toast.error('Enter a nickname'); return; }
    setJoining(true);

    try {
      const { data, error } = await supabase.rpc('join_game', {
        p_game_pin: pin,
        p_nickname: nickname.trim(),
        p_avatar_url: avatarUrl || null,
      });

      if (error) throw error;

      setPlayerSession({
        id: data.player_session_id,
        game_session_id: data.game_session_id,
        nickname: data.nickname,
        avatar_url: data.avatar_url,
      });

      navigate(`/play/lobby/${pin}`);
    } catch (err) {
      toast.error(err.message || 'Failed to join');
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md animate-scale-in">
        <div className="text-center mb-6">
          <Zap size={32} className="text-yellow-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold font-display">Join a Game</h1>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePinSubmit} className="space-y-4 animate-fade-in" key="s1">
            <div>
              <label className="block text-sm text-white/60 mb-2 text-center">Enter the Game PIN</label>
              <input type="text" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-field text-center text-4xl font-bold tracking-[0.5em] py-4"
                placeholder="------" maxLength={6} autoFocus inputMode="numeric" />
            </div>
            <button type="submit" disabled={pin.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
              Next <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4 animate-fade-in" key="s2">
            <button type="button" onClick={() => setStep(1)} className="text-white/50 hover:text-white flex items-center gap-1 text-sm">
              <ArrowLeft size={14} /> Change PIN
            </button>

            <div>
              <label className="block text-sm text-white/60 mb-2">Choose your avatar</label>
              <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} name={nickname || 'You'} />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">Nickname</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                className="input-field text-lg" placeholder="Enter your nickname" maxLength={20} autoFocus />
            </div>

            <button type="submit" disabled={joining || !nickname.trim()} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
              {joining ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Join Game'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
