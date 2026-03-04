import { Link } from 'react-router-dom';
import { Zap, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';

export default function Navbar() {
  const { profile, signOut } = useAuth();

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap size={24} className="text-yellow-400" />
          <span className="text-xl font-bold font-display">QuizBlitz</span>
        </Link>
        {profile && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar src={profile.avatar_url} name={profile.name} size="sm" />
              <span className="font-medium hidden sm:block">{profile.name}</span>
            </div>
            <button onClick={signOut} className="text-white/60 hover:text-white transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
