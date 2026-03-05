import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap, LogIn } from 'lucide-react';
import { useAdmin } from '../hooks/useAuth';
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <Zap size={40} className="text-yellow-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-display">Admin Access</h1>
          <p className="text-white/50 mt-1">Enter admin password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10"
              placeholder="Password"
              autoFocus
              required
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
