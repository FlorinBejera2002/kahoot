import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAdmin } from '../hooks/useAuth';
import DarkModeToggle from './DarkModeToggle';
import SoundToggle from './SoundToggle';

export default function Navbar() {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm fixed top-0 left-0 right-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="QuizBlitz" className="h-10 w-auto" />
          <span className="text-xl font-bold font-display text-gray-900 dark:text-white">QuizBlitz</span>
        </Link>
        <div className="flex items-center gap-2">
          <SoundToggle />
          <DarkModeToggle />
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium ml-2">Admin</span>
          <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors p-2" title="Logout" aria-label="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
