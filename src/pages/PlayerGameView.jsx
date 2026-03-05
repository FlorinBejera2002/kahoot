import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../hooks/useGame';
import { useRealtimeGameSession } from '../hooks/useRealtime';
import { useTimer } from '../hooks/useTimer';
import AnswerGrid from '../components/AnswerGrid';
import Timer from '../components/Timer';
import StreakBadge from '../components/StreakBadge';
import ScorePopup from '../components/ScorePopup';
import DarkModeToggle from '../components/DarkModeToggle';
import SoundToggle from '../components/SoundToggle';
import {
  playCorrect,
  playWrong,
  playCountdownTick,
  playGo,
  playTimeUp,
  playStreak,
  playPointsEarned,
} from '../utils/sounds';
import {
  vibrateSuccess,
  vibrateError,
  vibrateTimeUp,
  vibrateCelebration,
} from '../utils/haptics';
import { formatScore } from '../utils/scoring';
import toast from 'react-hot-toast';

export default function PlayerGameView() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const {
    gameSession,
    setGameSession,
    playerSession,
    currentQuestion,
    setCurrentQuestion,
    answers,
    setAnswers,
    answerResult,
    setAnswerResult,
    setQuestionResults,
    resetGame,
  } = useGame();

  const [status, setStatus] = useState('waiting');
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [resultFlash, setResultFlash] = useState(null);
  const [showImagesToPlayers, setShowImagesToPlayers] = useState(true);

  const questionStartRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const countdownTimeoutRef = useRef(null);
  const resultFlashTimeoutRef = useRef(null);
  const lastQuestionKeyRef = useRef(null);
  const mismatchHandledRef = useRef(false);
  const isMountedRef = useRef(true);
  const statusRef = useRef(status);
  const currentQuestionRef = useRef(currentQuestion);
  const answersRef = useRef(answers);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const { timeLeft, start: startTimer, stop: stopTimer } = useTimer(20, () => {
    setStatus('time_up');
    playTimeUp();
    vibrateTimeUp();
  });

  const clearCountdownTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
  }, []);

  const clearResultFlashTimer = useCallback(() => {
    if (resultFlashTimeoutRef.current) {
      clearTimeout(resultFlashTimeoutRef.current);
      resultFlashTimeoutRef.current = null;
    }
  }, []);

  const handleSessionMismatch = useCallback(() => {
    if (mismatchHandledRef.current) return;
    mismatchHandledRef.current = true;

    clearCountdownTimers();
    clearResultFlashTimer();
    stopTimer();
    toast.error('Session mismatch detected. Please rejoin this game.');
    resetGame();
    navigate(`/join?pin=${pin}`, { replace: true });
  }, [clearCountdownTimers, clearResultFlashTimer, stopTimer, resetGame, navigate, pin]);

  const fetchQuestionData = useCallback(async (questionId) => {
    if (!questionId) return null;

    const [{ data: q, error: qError }, { data: ans, error: ansError }] = await Promise.all([
      supabase
        .from('questions')
        .select('id, text, image_url, time_limit_seconds, points')
        .eq('id', questionId)
        .single(),
      supabase
        .from('answers')
        .select('id, text, color, order_index')
        .eq('question_id', questionId)
        .order('order_index'),
    ]);

    if (qError) throw qError;
    if (ansError) throw ansError;

    return {
      question: q,
      answers: ans || [],
    };
  }, []);

  const resetPerQuestionState = useCallback((sessionId, questionId) => {
    const questionKey = `${sessionId}:${questionId}`;
    if (lastQuestionKeyRef.current === questionKey) return false;

    lastQuestionKeyRef.current = questionKey;
    questionStartRef.current = null;
    setHasAnswered(false);
    setSelectedAnswerId(null);
    setAnswerResult(null);
    setQuestionResults(null);
    setShowScorePopup(false);
    setResultFlash(null);
    clearResultFlashTimer();
    return true;
  }, [setAnswerResult, setQuestionResults, clearResultFlashTimer]);

  const startCountdown = useCallback((question) => {
    clearCountdownTimers();
    setStatus('countdown');

    let c = 3;
    setCountdown(c);
    playCountdownTick();

    countdownIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;

      c -= 1;
      setCountdown(c);

      if (c > 0) {
        playCountdownTick();
        return;
      }

      clearCountdownTimers();
      playGo();

      countdownTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setCountdown(null);
        setStatus('answering');
        questionStartRef.current = Date.now();
        startTimer(question.time_limit_seconds);
      }, 300);
    }, 1000);
  }, [clearCountdownTimers, startTimer]);

  const applyGameUpdate = useCallback(async (updated) => {
    if (!updated || !isMountedRef.current) return;

    setGameSession(updated);

    if (playerSession && playerSession.game_session_id !== updated.id) {
      handleSessionMismatch();
      return;
    }

    if (updated.status === 'showing_question') {
      if (!updated.current_question_id) {
        setStatus('waiting');
        return;
      }

      try {
        const questionData = await fetchQuestionData(updated.current_question_id);
        if (!questionData || !isMountedRef.current) return;

        setCurrentQuestion(questionData.question);
        setAnswers(questionData.answers);
        setQuestionIndex(updated.current_question_index ?? 0);
        resetPerQuestionState(updated.id, updated.current_question_id);
        startCountdown(questionData.question);
      } catch {
        toast.error('Failed to load question');
      }
      return;
    }

    if (updated.status === 'answering') {
      clearCountdownTimers();
      setCountdown(null);

      if (!updated.current_question_id) {
        setStatus('waiting');
        return;
      }

      const questionKey = `${updated.id}:${updated.current_question_id}`;
      const isNewQuestion = lastQuestionKeyRef.current !== questionKey;
      if (isNewQuestion) {
        resetPerQuestionState(updated.id, updated.current_question_id);
      } else if (
        statusRef.current === 'answering'
        || statusRef.current === 'answered'
        || statusRef.current === 'time_up'
      ) {
        return;
      }

      let q = currentQuestionRef.current;
      let ans = answersRef.current;
      const needsSync = !q || q.id !== updated.current_question_id || !ans || ans.length === 0;

      if (needsSync) {
        try {
          const questionData = await fetchQuestionData(updated.current_question_id);
          if (!questionData || !isMountedRef.current) return;
          q = questionData.question;
          ans = questionData.answers;
        } catch {
          toast.error('Failed to sync question');
          return;
        }
      }

      if (!q) {
        setStatus('waiting');
        return;
      }

      setCurrentQuestion(q);
      setAnswers(ans || []);
      setQuestionIndex(updated.current_question_index ?? 0);
      setStatus('answering');

      const startedAtMs = updated.question_started_at
        ? new Date(updated.question_started_at).getTime()
        : Date.now();
      questionStartRef.current = startedAtMs;

      const elapsedSeconds = updated.question_started_at
        ? Math.floor((Date.now() - startedAtMs) / 1000)
        : 0;
      const remaining = Math.max(0, q.time_limit_seconds - elapsedSeconds);

      if (remaining > 0) {
        startTimer(remaining);
      } else {
        stopTimer();
        setStatus('time_up');
      }
      return;
    }

    if (updated.status === 'showing_results') {
      clearCountdownTimers();
      setCountdown(null);
      stopTimer();
      setStatus('showing_results');
      return;
    }

    if (updated.status === 'finished') {
      clearCountdownTimers();
      setCountdown(null);
      stopTimer();
      navigate(`/play/podium/${pin}`);
      return;
    }

    clearCountdownTimers();
    setCountdown(null);
    stopTimer();
    setStatus('waiting');
  }, [
    clearCountdownTimers,
    fetchQuestionData,
    handleSessionMismatch,
    navigate,
    pin,
    playerSession,
    resetPerQuestionState,
    setAnswers,
    setCurrentQuestion,
    setGameSession,
    startCountdown,
    startTimer,
    stopTimer,
  ]);

  useEffect(() => {
    if (!playerSession) {
      navigate(`/join?pin=${pin}`, { replace: true });
    }
  }, [playerSession, navigate, pin]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearCountdownTimers();
      clearResultFlashTimer();
      stopTimer();
    };
  }, [clearCountdownTimers, clearResultFlashTimer, stopTimer]);

  useEffect(() => {
    if (!playerSession) return;

    let cancelled = false;

    const hydrate = async () => {
      const { data: gs, error } = await supabase
        .from('game_sessions')
        .select('id, quiz_id, status, current_question_index, current_question_id, question_started_at, answers_count')
        .eq('game_pin', pin)
        .single();

      if (cancelled || !isMountedRef.current) return;

      if (error || !gs) {
        toast.error('Game not found');
        navigate(`/join?pin=${pin}`, { replace: true });
        return;
      }

      if (playerSession.game_session_id !== gs.id) {
        handleSessionMismatch();
        return;
      }

      await applyGameUpdate(gs);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [pin, playerSession, navigate, applyGameUpdate, handleSessionMismatch]);

  useEffect(() => {
    if (!playerSession || !gameSession?.id) return;
    if (playerSession.game_session_id !== gameSession.id) {
      handleSessionMismatch();
    }
  }, [playerSession, gameSession?.id, handleSessionMismatch]);

  useEffect(() => {
    if (!gameSession?.quiz_id) return;
    supabase
      .from('quizzes')
      .select('show_images_to_players')
      .eq('id', gameSession.quiz_id)
      .single()
      .then(({ data }) => {
        if (data) setShowImagesToPlayers(data.show_images_to_players ?? true);
      });
  }, [gameSession?.quiz_id]);

  useRealtimeGameSession(gameSession?.id, (updated) => {
    void applyGameUpdate(updated);
  });

  const handleAnswer = async (answer) => {
    if (hasAnswered || !playerSession || !gameSession) return;

    if (playerSession.game_session_id !== gameSession.id) {
      handleSessionMismatch();
      return;
    }

    if (!currentQuestion || currentQuestion.id !== gameSession.current_question_id) {
      toast.error('Question is syncing. Please try again.');
      return;
    }

    if (!answers.some((a) => a.id === answer.id)) {
      toast.error('Invalid answer. Please try again.');
      return;
    }

    setSelectedAnswerId(answer.id);
    setHasAnswered(true);
    stopTimer();

    const responseTimeMs = Math.max(0, Date.now() - (questionStartRef.current || Date.now()));

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

      if (data.is_correct) {
        playCorrect();
        vibrateSuccess();
        setResultFlash('correct');

        if (data.points_earned > 0) {
          setShowScorePopup(true);
          playPointsEarned();
        }
        if (data.streak >= 3) {
          playStreak();
          vibrateCelebration();
        }
      } else {
        playWrong();
        vibrateError();
        setResultFlash('wrong');
      }

      clearResultFlashTimer();
      resultFlashTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) setResultFlash(null);
        resultFlashTimeoutRef.current = null;
      }, 800);
    } catch (err) {
      toast.error(err.message || 'Failed to submit answer');
      setHasAnswered(false);
      setSelectedAnswerId(null);

      if (
        /question mismatch|not accepting answers|invalid answer/i.test(err.message || '')
        && gameSession?.id
      ) {
        const { data: latest } = await supabase
          .from('game_sessions')
          .select('id, quiz_id, status, current_question_index, current_question_id, question_started_at, answers_count')
          .eq('id', gameSession.id)
          .single();
        if (latest) {
          await applyGameUpdate(latest);
        }
      }
    }
  };

  if (!playerSession) return null;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-8
      bg-gray-50 dark:bg-gray-900 transition-colors relative
      ${resultFlash === 'correct' ? 'animate-correct-flash' : ''}
      ${resultFlash === 'wrong' ? 'animate-wrong-flash' : ''}`}>

      <div className="absolute top-4 right-4 flex gap-1 z-10">
        <SoundToggle />
        <DarkModeToggle />
      </div>

      {status === 'waiting' && (
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300">Waiting for next question...</p>
        </div>
      )}

      {status === 'countdown' && countdown !== null && (
        <div className="text-center animate-bounce-in" key={`c-${countdown}`}>
          <div className="text-8xl font-bold font-display text-primary">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Get ready!</p>
        </div>
      )}

      {status === 'answering' && currentQuestion && (
        <div className="w-full max-w-lg animate-fade-in">
          <div className="flex justify-center mb-4">
            <Timer timeLeft={timeLeft} totalTime={currentQuestion.time_limit_seconds} />
          </div>
          {showImagesToPlayers && currentQuestion.image_url && (
            <div className="flex justify-center mb-3">
              <img src={currentQuestion.image_url} alt="Question illustration"
                className="max-h-48 rounded-lg shadow-sm object-contain" />
            </div>
          )}
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">
            Q{questionIndex + 1}: {currentQuestion.text}
          </p>
          <AnswerGrid
            answers={answers}
            onAnswer={handleAnswer}
            disabled={hasAnswered}
            selectedId={selectedAnswerId}
          />
        </div>
      )}

      {status === 'answered' && answerResult && (
        <div className="text-center animate-scale-in relative">
          <ScorePopup points={answerResult.points_earned} show={showScorePopup} />

          {answerResult.is_correct ? (
            <CheckCircle size={80} className="text-green-500 mx-auto mb-4 animate-bounce-in" />
          ) : (
            <XCircle size={80} className="text-red-500 mx-auto mb-4 animate-shake" />
          )}
          <h2 className="text-3xl font-bold font-display mb-2 text-gray-900 dark:text-white">
            {answerResult.is_correct ? 'Correct!' : 'Wrong!'}
          </h2>
          <p className="text-2xl font-bold text-primary animate-count-up">+{formatScore(answerResult.points_earned)} points</p>

          {answerResult.streak > 1 && (
            <div className="mt-3">
              <StreakBadge streak={answerResult.streak} />
            </div>
          )}

          <p className="text-gray-500 dark:text-gray-400 mt-4">Total: {formatScore(answerResult.total_score)}</p>
        </div>
      )}

      {status === 'showing_results' && (
        <div className="text-center w-full max-w-md animate-slide-up">
          <Trophy size={40} className="text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-display mb-4 text-gray-900 dark:text-white">Results</h2>
          {answerResult && (
            <p className="text-lg mb-4 text-gray-700 dark:text-gray-300">
              You scored <span className="font-bold text-primary">{formatScore(answerResult.points_earned)}</span> points
            </p>
          )}
          <p className="text-gray-400 dark:text-gray-500">Next question coming up...</p>
        </div>
      )}

      {status === 'time_up' && !hasAnswered && (
        <div className="text-center animate-scale-in">
          <XCircle size={80} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-display text-gray-900 dark:text-white">Time&apos;s up!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">You didn&apos;t answer in time</p>
        </div>
      )}
    </div>
  );
}
