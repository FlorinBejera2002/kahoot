import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SkipForward, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../hooks/useGame';
import { useRealtimeGameSession } from '../hooks/useRealtime';
import { useTimer } from '../hooks/useTimer';
import QuestionDisplay from '../components/QuestionDisplay';
import AnswerGrid from '../components/AnswerGrid';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import AnswerDistribution from '../components/AnswerDistribution';
import Podium from '../components/Podium';
import { playCountdownTick, playGo, playTimeUp } from '../utils/sounds';
import toast from 'react-hot-toast';

export default function HostGameView() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const {
    gameSession, setGameSession,
    currentQuestion, setCurrentQuestion,
    answers, setAnswers,
    questionResults, setQuestionResults,
    leaderboard, setLeaderboard,
    podiumData, setPodiumData,
    answeredCount, setAnsweredCount,
    players,
  } = useGame();

  const [status, setStatus] = useState('loading');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);

  const onTimeUp = useCallback(async () => {
    if (!gameSession) return;
    playTimeUp();
    await showResults();
  }, [gameSession]);

  const { timeLeft, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer(20, onTimeUp);

  useEffect(() => {
    loadGameState();
  }, [pin]);

  const loadGameState = async () => {
    const { data: gs } = await supabase
      .from('game_sessions')
      .select('*, quiz:quizzes(questions(count))')
      .eq('game_pin', pin)
      .single();

    if (!gs) { toast.error('Game not found'); navigate('/dashboard'); return; }
    setGameSession(gs);
    setTotalQuestions(gs.quiz?.questions?.[0]?.count || 0);

    if (gs.status === 'showing_question' || gs.status === 'answering') {
      await loadCurrentQuestion(gs);
    } else if (gs.status === 'finished') {
      await loadPodium(gs.id);
    }
  };

  const loadCurrentQuestion = async (gs) => {
    if (!gs.current_question_id) return;
    const { data: q } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('id', gs.current_question_id)
      .single();
    if (!q) return;

    setCurrentQuestion(q);
    setAnswers(q.answers.sort((a, b) => a.order_index - b.order_index));
    setQuestionIndex(gs.current_question_index);
    setAnsweredCount(gs.answers_count || 0);

    if (gs.status === 'showing_question') {
      setStatus('showing_question');
      runCountdown(() => startAnswering(gs, q));
    } else if (gs.status === 'answering') {
      setStatus('answering');
      const elapsed = gs.question_started_at
        ? Math.floor((Date.now() - new Date(gs.question_started_at).getTime()) / 1000)
        : 0;
      const remaining = Math.max(0, q.time_limit_seconds - elapsed);
      if (remaining > 0) startTimer(remaining);
      else await showResults();
    }
  };

  useRealtimeGameSession(gameSession?.id, (updated) => {
    setGameSession(updated);
    setAnsweredCount(updated.answers_count || 0);
  });

  const runCountdown = (onDone) => {
    let c = 3;
    setCountdown(c);
    setStatus('countdown');
    playCountdownTick();
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c > 0) {
        playCountdownTick();
      } else {
        clearInterval(iv);
        playGo();
        setTimeout(() => { setCountdown(null); onDone(); }, 300);
      }
    }, 1000);
  };

  const startAnswering = async (gs, questionData) => {
    const sessionId = gs?.id || gameSession?.id;
    await supabase.rpc('start_answering', { p_game_session_id: sessionId });
    setStatus('answering');
    const q = questionData || currentQuestion;
    if (q) startTimer(q.time_limit_seconds);
  };

  const showResults = async () => {
    stopTimer();
    const { data, error } = await supabase.rpc('show_question_results', {
      p_game_session_id: gameSession.id,
    });
    if (error) { toast.error(error.message); return; }
    setQuestionResults(data);
    setLeaderboard(data.leaderboard || []);
    setStatus('showing_results');
  };

  const handleNext = async () => {
    setQuestionResults(null);
    setAnsweredCount(0);

    const { data, error } = await supabase.rpc('advance_question', {
      p_game_session_id: gameSession.id,
    });
    if (error) { toast.error(error.message); return; }

    if (data.status === 'finished') {
      await loadPodium(gameSession.id);
      return;
    }

    const q = data.question;
    const { data: fullQ } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('id', q.id)
      .single();

    setCurrentQuestion(fullQ);
    setAnswers(fullQ.answers.sort((a, b) => a.order_index - b.order_index));
    setQuestionIndex(data.question_index);

    runCountdown(() => startAnswering(null, fullQ));
  };

  const loadPodium = async (sessionId) => {
    const { data } = await supabase.rpc('get_podium', { p_game_session_id: sessionId });
    setPodiumData(data || []);
    setStatus('finished');
  };

  const activePlayers = players.filter((p) => p.is_active !== false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-900 transition-colors">
      {status === 'loading' && (
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}

      {status === 'countdown' && countdown !== null && (
        <div className="text-center animate-bounce-in" key={countdown}>
          <div className="text-9xl font-bold font-display text-primary">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {status === 'answering' && currentQuestion && (
        <div className="w-full max-w-4xl animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <Timer timeLeft={timeLeft} totalTime={currentQuestion.time_limit_seconds} />
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users size={20} />
              <span className="font-medium">{answeredCount} / {activePlayers.length} answered</span>
            </div>
          </div>
          <QuestionDisplay question={currentQuestion} questionNumber={questionIndex + 1} totalQuestions={totalQuestions} />
          <div className="mt-8">
            <AnswerGrid answers={answers} disabled />
          </div>
        </div>
      )}

      {status === 'showing_results' && questionResults && (
        <div className="w-full max-w-4xl animate-slide-up">
          <h2 className="text-2xl font-bold text-center mb-6 font-display text-gray-900 dark:text-white">Results</h2>
          <AnswerDistribution distribution={questionResults.answer_distribution || []} />
          <Leaderboard players={questionResults.leaderboard || leaderboard} maxShow={5} />
          <div className="flex justify-center mt-8">
            <button onClick={handleNext} className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              <SkipForward size={20} /> Next Question
            </button>
          </div>
        </div>
      )}

      {status === 'finished' && podiumData && (
        <div className="w-full max-w-4xl animate-fade-in">
          <Podium players={podiumData.slice(0, 3)} />
          {podiumData.length > 3 && (
            <div className="mt-8">
              <Leaderboard players={podiumData.slice(3)} maxShow={podiumData.length} title="Other Players" />
            </div>
          )}
          <div className="flex justify-center mt-8">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
