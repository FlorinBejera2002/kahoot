import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { useAuth } from './hooks/useAuth';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuizEditor from './pages/QuizEditor';
import JoinGame from './pages/JoinGame';
import HostLobby from './pages/HostLobby';
import HostGameView from './pages/HostGameView';
import PlayerLobby from './pages/PlayerLobby';
import PlayerGameView from './pages/PlayerGameView';
import PodiumPage from './pages/PodiumPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/play/lobby/:pin" element={<PlayerLobby />} />
      <Route path="/play/game/:pin" element={<PlayerGameView />} />
      <Route path="/play/podium/:pin" element={<PodiumPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/quiz/new" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
      <Route path="/quiz/:id/edit" element={<ProtectedRoute><QuizEditor /></ProtectedRoute>} />
      <Route path="/host/lobby/:pin" element={<ProtectedRoute><HostLobby /></ProtectedRoute>} />
      <Route path="/host/game/:pin" element={<ProtectedRoute><HostGameView /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1a0533', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#26890C', secondary: '#fff' } },
            error: { iconTheme: { primary: '#E21B3C', secondary: '#fff' } },
          }}
        />
      </GameProvider>
    </AuthProvider>
  );
}
