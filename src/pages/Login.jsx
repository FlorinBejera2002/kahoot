import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { useAdmin } from '../hooks/useAuth';
import DarkModeToggle from '../components/DarkModeToggle';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(password)) {
      toast.success('Welcome, Admin!');
      navigate('/dashboard');
    } else {
      toast.error('Wrong password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4"><DarkModeToggle /></div>
      <div className="card w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="QuizBlitz" className="h-16 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Admin Access</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Enter admin password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10"
              placeholder="Password"
              autoFocus
              required
              aria-label="Admin password"
            />
          </div>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <LogIn size={18} /> Enter
          </button>
        </form>
      </div>
    </div>
  );
}
