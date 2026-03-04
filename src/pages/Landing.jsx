import { Link } from 'react-router-dom';
import { Zap, Users, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-primary/10 animate-pulse"
            style={{
              width: 80 + Math.random() * 150, height: 80 + Math.random() * 150,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`, animationDuration: `${3 + Math.random() * 4}s`,
            }} />
        ))}
      </div>

      <div className="text-center z-10 max-w-2xl animate-fade-in">
        <Zap size={64} className="text-yellow-400 mx-auto mb-4" />
        <h1 className="text-5xl md:text-7xl font-bold font-display mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 text-transparent bg-clip-text">
          QuizBlitz
        </h1>
        <p className="text-xl md:text-2xl text-white/70 mb-12 font-medium">
          Create and play quizzes in real-time!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={user ? '/dashboard' : '/login'} className="btn-primary text-xl flex items-center justify-center gap-2 px-8 py-4">
            <Trophy size={24} /> Host a Game
          </Link>
          <Link to="/join" className="btn-secondary text-xl flex items-center justify-center gap-2 px-8 py-4">
            <Users size={24} /> Join a Game
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-16 text-center">
          {[
            { icon: '\uD83C\uDFAF', title: 'Create', desc: 'Build quizzes with ease' },
            { icon: '\u26A1', title: 'Play', desc: 'Real-time multiplayer' },
            { icon: '\uD83C\uDFC6', title: 'Win', desc: 'Compete for the top spot' },
          ].map((item) => (
            <div key={item.title} className="card animate-slide-up">
              <div className="text-4xl mb-2">{item.icon}</div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
