import { Link } from 'react-router-dom';
import { Users, Trophy, Settings } from 'lucide-react';
import { useAdmin } from '../hooks/useAuth';
import DarkModeToggle from '../components/DarkModeToggle';
import SoundToggle from '../components/SoundToggle';
import { initAudio } from '../utils/sounds';

export default function Landing() {
  const { isAdmin } = useAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors" onClick={initAudio}>
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="QuizBlitz" className="h-10 w-auto" />
            <span className="text-xl font-bold font-display text-gray-900 dark:text-white">QuizBlitz</span>
          </div>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <DarkModeToggle />
            <Link to={isAdmin ? '/dashboard' : '/admin'}
              className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors ml-2">
              {isAdmin ? 'Dashboard' : 'Admin'}
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 dark:bg-primary/10" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 dark:bg-accent/5" />
        </div>

        <div className="text-center z-10 max-w-2xl animate-fade-in">
          <img src="/logo.png" alt="QuizBlitz" className="h-24 w-auto mx-auto mb-6" />
          <h1 className="text-5xl md:text-7xl font-bold font-display mb-4 text-gray-900 dark:text-white">
            Quiz<span className="text-primary">Blitz</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-12 font-medium">
            Create and play quizzes in real-time!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/join" className="btn-primary text-xl flex items-center justify-center gap-2 px-8 py-4">
              <Users size={24} /> Join a Game
            </Link>
            <Link to={isAdmin ? '/dashboard' : '/admin'} className="btn-secondary text-xl flex items-center justify-center gap-2 px-8 py-4">
              {isAdmin ? <><Trophy size={24} /> Dashboard</> : <><Settings size={24} /> Admin</>}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-16 text-center">
            {[
              { icon: '\uD83C\uDFAF', title: 'Create', desc: 'Build quizzes with ease' },
              { icon: '\u26A1', title: 'Play', desc: 'Real-time multiplayer' },
              { icon: '\uD83C\uDFC6', title: 'Win', desc: 'Compete for the top spot' },
            ].map((item) => (
              <div key={item.title} className="card animate-slide-up hover:shadow-md transition-shadow">
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
