import { Link, useNavigate } from 'react-router-dom';
import { Zap, LogOut } from 'lucide-react';
import { useAdmin } from '../hooks/useAuth';

export default function Navbar() {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap size={24} className="text-yellow-400" />
          <span className="text-xl font-bold font-display">QuizBlitz</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm font-medium">Admin</span>
          <button onClick={handleLogout} className="text-white/60 hover:text-white transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
