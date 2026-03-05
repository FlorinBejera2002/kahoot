import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../hooks/useGame';
import Podium from '../components/Podium';
import Leaderboard from '../components/Leaderboard';
import PostGameStats from '../components/PostGameStats';
import Loading from '../components/ui/Loading';
import DarkModeToggle from '../components/DarkModeToggle';
import SoundToggle from '../components/SoundToggle';

export default function PodiumPage() {
  const { pin } = useParams();
  const { podiumData, setPodiumData, gameSession, playerSession } = useGame();
  const [loading, setLoading] = useState(!podiumData || podiumData.length === 0);
  const [playerStats, setPlayerStats] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (podiumData && podiumData.length > 0) {
        buildPlayerStats(podiumData);
        setLoading(false);
        return;
      }

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
      buildPlayerStats(data || []);
      setLoading(false);
    };

    fetchResults();
  }, [pin]);

  const buildPlayerStats = (data) => {
    if (!playerSession || !data?.length) return;
    const me = data.find((p) => p.player_session_id === playerSession.id || p.nickname === playerSession.nickname);
    if (me) {
      setPlayerStats({
        totalScore: me.total_score || 0,
        correctCount: me.correct_count || 0,
        totalQuestions: me.total_questions || 0,
        bestStreak: me.best_streak || 0,
        avgResponseTime: me.avg_response_time || 0,
        rank: data.indexOf(me) + 1,
        totalPlayers: data.length,
      });
    }
  };

  const displayData = podiumData || [];

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4 flex gap-1">
        <SoundToggle />
        <DarkModeToggle />
      </div>

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
            <PostGameStats stats={playerStats} />
          </>
        ) : (
          <p className="text-center text-gray-400 dark:text-gray-500 py-20">No results available</p>
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
