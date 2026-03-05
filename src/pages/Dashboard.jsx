import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Edit2, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, questions(count)')
      .order('created_at', { ascending: false });

    if (!error) setQuizzes(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this quiz?')) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    toast.success('Quiz deleted');
  };

  const handleStartGame = async (quizId) => {
    const { data, error } = await supabase.rpc('create_game_session', { p_quiz_id: quizId });
    if (error) { toast.error(error.message); return; }
    navigate(`/host/lobby/${data.game_pin}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-display">My Quizzes</h1>
          <button onClick={() => navigate('/quiz/new')} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> Create Quiz
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loading text="Loading quizzes..." /></div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <FileText size={64} className="mx-auto text-white/20 mb-4" />
            <h2 className="text-xl font-semibold text-white/40 mb-2">No quizzes yet</h2>
            <p className="text-white/30 mb-6">Create your first quiz to get started!</p>
            <button onClick={() => navigate('/quiz/new')} className="btn-primary">Create Your First Quiz</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="card hover:border-white/20 transition-all animate-slide-up">
                {quiz.cover_image_url && (
                  <img src={quiz.cover_image_url} alt={quiz.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                )}
                <h3 className="font-bold text-lg mb-1 truncate">{quiz.title}</h3>
                {quiz.description && <p className="text-white/50 text-sm mb-3 line-clamp-2">{quiz.description}</p>}
                <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
                  <span>{quiz.questions?.[0]?.count ?? 0} questions</span>
                  <span>&middot;</span>
                  <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleStartGame(quiz.id)} className="btn-primary text-sm py-2 px-3 flex items-center gap-1 flex-1">
                    <Play size={16} /> Play
                  </button>
                  <button onClick={() => navigate(`/quiz/${quiz.id}/edit`)} className="btn-secondary text-sm py-2 px-3">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(quiz.id)} className="btn-secondary text-sm py-2 px-3 hover:bg-red-500/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
