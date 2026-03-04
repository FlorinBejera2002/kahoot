import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import AvatarPicker from '../components/AvatarPicker';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, name, avatarUrl);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md animate-scale-in">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Zap size={32} className="text-yellow-400" />
            <span className="text-2xl font-bold font-display">QuizBlitz</span>
          </Link>
          <h2 className="text-xl text-white/70">Create your account</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-white/60 mb-2">Choose your avatar</label>
          <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} name={name || 'You'} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Name</label>
            <Input icon={User} value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your display name" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <Input icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Password</label>
            <Input icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p className="text-center text-white/50 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-light hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
