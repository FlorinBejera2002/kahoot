import { createContext, useState, useCallback } from 'react';

export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [gameSession, setGameSession] = useState(null);
  const [playerSession, setPlayerSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [questionResults, setQuestionResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [podiumData, setPodiumData] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const resetGame = useCallback(() => {
    setGameSession(null);
    setPlayerSession(null);
    setPlayers([]);
    setCurrentQuestion(null);
    setAnswers([]);
    setQuestionResults(null);
    setLeaderboard([]);
    setPodiumData(null);
    setAnswerResult(null);
    setAnsweredCount(0);
  }, []);

  const addPlayer = useCallback((player) => {
    setPlayers((prev) => {
      if (prev.find((p) => p.id === player.id)) return prev;
      return [...prev, player];
    });
  }, []);

  const removePlayer = useCallback((playerId) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }, []);

  return (
    <GameContext.Provider value={{
      gameSession, setGameSession,
      playerSession, setPlayerSession,
      players, setPlayers, addPlayer, removePlayer,
      currentQuestion, setCurrentQuestion,
      answers, setAnswers,
      questionResults, setQuestionResults,
      leaderboard, setLeaderboard,
      podiumData, setPodiumData,
      answerResult, setAnswerResult,
      answeredCount, setAnsweredCount,
      resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}
