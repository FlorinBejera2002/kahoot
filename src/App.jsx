import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { useAdmin } from './hooks/useAuth';

import Landing from './pages/Landing';
import AdminLogin from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuizEditor from './pages/QuizEditor';
import JoinGame from './pages/JoinGame';
import HostLobby from './pages/HostLobby';
import HostGameView from './pages/HostGameView';
import PlayerLobby from './pages/PlayerLobby';
import PlayerGameView from './pages/PlayerGameView';
import PodiumPage from './pages/PodiumPage';

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAdmin();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/play/lobby/:pin" element={<PlayerLobby />} />
      <Route path="/play/game/:pin" element={<PlayerGameView />} />
      <Route path="/play/podium/:pin" element={<PodiumPage />} />
      <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/quiz/new" element={<AdminRoute><QuizEditor /></AdminRoute>} />
      <Route path="/quiz/:id/edit" element={<AdminRoute><QuizEditor /></AdminRoute>} />
      <Route path="/host/lobby/:pin" element={<AdminRoute><HostLobby /></AdminRoute>} />
      <Route path="/host/game/:pin" element={<AdminRoute><HostGameView /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <GameProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
      </GameProvider>
    </AdminProvider>
  );
}
