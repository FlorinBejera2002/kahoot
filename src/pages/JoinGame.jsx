import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../hooks/useGame';
import AvatarPicker from '../components/AvatarPicker';
import DarkModeToggle from '../components/DarkModeToggle';
import SoundToggle from '../components/SoundToggle';
import { playClick, initAudio } from '../utils/sounds';
import { tapLight } from '../utils/haptics';
import toast from 'react-hot-toast';

export default function JoinGame() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [joining, setJoining] = useState(false);
  const { setPlayerSession, setGameSession, resetGame } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    const pinParam = searchParams.get('pin');
    if (pinParam && /^\d{6}$/.test(pinParam)) {
      setPin(pinParam);
      (async () => {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('game_pin', pinParam)
          .eq('status', 'lobby')
          .single();

        if (!error && data) {
          setGameSession(data);
          setStep(2);
        }
      })();
    }
  }, [searchParams]);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) { toast.error('PIN must be 6 digits'); return; }
    playClick();
    tapLight();

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
    initAudio();

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4 flex gap-1">
        <SoundToggle />
        <DarkModeToggle />
      </div>
      <div className="card w-full max-w-md animate-scale-in">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="QuizBlitz" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Join a Game</h1>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePinSubmit} className="space-y-4 animate-fade-in" key="s1">
            <div>
              <label htmlFor="pin-input" className="block text-sm text-gray-600 dark:text-gray-400 mb-2 text-center font-medium">Enter the Game PIN</label>
              <input id="pin-input" type="text" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-field text-center text-4xl font-bold tracking-[0.5em] py-4"
                placeholder="------" maxLength={6} autoFocus inputMode="numeric"
                aria-label="6-digit game PIN" />
            </div>
            <button type="submit" disabled={pin.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
              Next <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4 animate-fade-in" key="s2">
            <button type="button" onClick={() => { setStep(1); playClick(); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 text-sm">
              <ArrowLeft size={14} /> Change PIN
            </button>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Choose your avatar</label>
              <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} name={nickname || 'You'} />
            </div>

            <div>
              <label htmlFor="nickname-input" className="block text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Nickname</label>
              <input id="nickname-input" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
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
