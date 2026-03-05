import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Flame, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../hooks/useGame';
import { useRealtimeGameSession } from '../hooks/useRealtime';
import { useTimer } from '../hooks/useTimer';
import AnswerGrid from '../components/AnswerGrid';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import { formatScore } from '../utils/scoring';
import toast from 'react-hot-toast';

export default function PlayerGameView() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const {
    gameSession, setGameSession, playerSession,
    currentQuestion, setCurrentQuestion,
    answers, setAnswers,
    answerResult, setAnswerResult,
    leaderboard, setLeaderboard,
    questionResults, setQuestionResults,
  } = useGame();

  const [status, setStatus] = useState('waiting');
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const questionStartRef = useRef(null);

  const { timeLeft, start: startTimer, stop: stopTimer } = useTimer(20, () => setStatus('time_up'));

  useEffect(() => {
    if (!playerSession) { navigate('/join'); return; }
  }, [playerSession, navigate]);

  useRealtimeGameSession(gameSession?.id, async (updated) => {
    setGameSession(updated);

    if (updated.status === 'showing_question') {
      setHasAnswered(false);
      setSelectedAnswerId(null);
      setAnswerResult(null);
      setQuestionResults(null);

      const { data: q } = await supabase
        .from('questions')
        .select('id, text, image_url, time_limit_seconds, points')
        .eq('id', updated.current_question_id)
        .single();

      if (q) {
        setCurrentQuestion(q);
        setQuestionIndex(updated.current_question_index);
        setStatus('countdown');

        let c = 3;
        setCountdown(c);
        const iv = setInterval(() => {
          c--;
          setCountdown(c);
          if (c <= 0) {
            clearInterval(iv);
            setCountdown(null);
          }
        }, 1000);
      }
    }

    if (updated.status === 'answering') {
      if (updated.current_question_id) {
        const { data: ans } = await supabase
          .from('answers')
          .select('id, text, color, order_index')
          .eq('question_id', updated.current_question_id)
          .order('order_index');
        if (ans) setAnswers(ans);
      }
      questionStartRef.current = Date.now();
      setStatus('answering');
      const q = currentQuestion;
      if (q) startTimer(q.time_limit_seconds);
    }

    if (updated.status === 'showing_results') {
      stopTimer();
      setStatus('showing_results');
    }

    if (updated.status === 'finished') {
      navigate(`/play/podium/${pin}`);
    }
  });

  const handleAnswer = async (answer) => {
    if (hasAnswered || !playerSession) return;
    setSelectedAnswerId(answer.id);
    setHasAnswered(true);
    stopTimer();

    const responseTimeMs = Date.now() - (questionStartRef.current || Date.now());

    try {
      const { data, error } = await supabase.rpc('submit_answer', {
        p_player_session_id: playerSession.id,
        p_question_id: currentQuestion.id,
        p_answer_id: answer.id,
        p_response_time_ms: responseTimeMs,
      });
      if (error) throw error;
      setAnswerResult(data);
      setStatus('answered');
    } catch (err) {
      toast.error(err.message || 'Failed to submit answer');
      setHasAnswered(false);
      setSelectedAnswerId(null);
    }
  };

  if (!playerSession) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50">

      {status === 'waiting' && (
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700">Waiting for next question...</p>
        </div>
      )}

      {status === 'countdown' && countdown !== null && (
        <div className="text-center animate-bounce-in" key={`c-${countdown}`}>
          <div className="text-8xl font-bold font-display text-primary">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <p className="text-gray-500 mt-4">Get ready!</p>
        </div>
      )}

      {status === 'answering' && currentQuestion && (
        <div className="w-full max-w-lg animate-fade-in">
          <div className="flex justify-center mb-4">
            <Timer timeLeft={timeLeft} totalTime={currentQuestion.time_limit_seconds} />
          </div>
          <p className="text-center text-gray-600 text-sm mb-4">
            Q{questionIndex + 1}: {currentQuestion.text}
          </p>
          <AnswerGrid answers={answers} onAnswer={handleAnswer} disabled={hasAnswered} selectedId={selectedAnswerId} />
        </div>
      )}

      {status === 'answered' && answerResult && (
        <div className="text-center animate-scale-in">
          {answerResult.is_correct ? (
            <CheckCircle size={80} className="text-green-500 mx-auto mb-4 animate-bounce-in" />
          ) : (
            <XCircle size={80} className="text-red-500 mx-auto mb-4 animate-shake" />
          )}
          <h2 className="text-3xl font-bold font-display mb-2 text-gray-900">
            {answerResult.is_correct ? 'Correct!' : 'Wrong!'}
          </h2>
          <p className="text-2xl font-bold text-primary">+{formatScore(answerResult.points_earned)} points</p>
          {answerResult.streak > 1 && (
            <div className="flex items-center justify-center gap-2 text-amber-500 mt-3">
              <Flame size={20} /> <span className="font-bold">{answerResult.streak} streak!</span>
            </div>
          )}
          <p className="text-gray-500 mt-4">Total: {formatScore(answerResult.total_score)}</p>
        </div>
      )}

      {status === 'showing_results' && (
        <div className="text-center w-full max-w-md animate-slide-up">
          <Trophy size={40} className="text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-display mb-4 text-gray-900">Results</h2>
          {answerResult && (
            <p className="text-lg mb-4 text-gray-700">
              You scored <span className="font-bold text-primary">{formatScore(answerResult.points_earned)}</span> points
            </p>
          )}
          <p className="text-gray-400">Next question coming up...</p>
        </div>
      )}

      {status === 'time_up' && !hasAnswered && (
        <div className="text-center animate-scale-in">
          <XCircle size={80} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-display text-gray-900">Time's up!</h2>
          <p className="text-gray-500 mt-2">You didn't answer in time</p>
        </div>
      )}
    </div>
  );
}
