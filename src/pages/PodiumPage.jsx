import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../hooks/useGame';
import Podium from '../components/Podium';
import Leaderboard from '../components/Leaderboard';
import Loading from '../components/ui/Loading';

export default function PodiumPage() {
  const { pin } = useParams();
  const { podiumData, setPodiumData, gameSession } = useGame();
  const [loading, setLoading] = useState(!podiumData || podiumData.length === 0);

  useEffect(() => {
    if (podiumData && podiumData.length > 0) return;

    const fetchResults = async () => {
      let sessionId = gameSession?.id;
      if (!sessionId) {
        const { data: gs } = await supabase
          .from('game_sessions')
          .select('id')
          .eq('game_pin', pin)
          .single();
        sessionId = gs?.id;
      }
      if (!sessionId) { setLoading(false); return; }

      const { data } = await supabase.rpc('get_podium', { p_game_session_id: sessionId });
      setPodiumData(data || []);
      setLoading(false);
    };
    fetchResults();
  }, [pin, podiumData, gameSession]);

  const displayData = podiumData || [];

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl animate-fade-in">
        {loading ? (
          <div className="flex justify-center py-20"><Loading text="Loading results..." /></div>
        ) : displayData.length > 0 ? (
          <>
            <Podium players={displayData.slice(0, 3)} />
            {displayData.length > 3 && (
              <div className="mt-8">
                <Leaderboard players={displayData.slice(3)} maxShow={displayData.length} title="Other Players" />
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-white/40 py-20">No results available</p>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <Link to="/join" className="btn-secondary flex items-center gap-2">
            <RotateCcw size={18} /> Play Again
          </Link>
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home size={18} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
