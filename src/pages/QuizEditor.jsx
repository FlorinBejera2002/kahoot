import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Check, Image, Clock, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadQuizImage } from '../utils/avatars';
import { COLOR_ORDER, TIME_OPTIONS } from '../lib/constants';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const COLOR_STYLES = {
  red: 'border-kahoot-red/30 bg-red-50 dark:bg-red-900/20',
  blue: 'border-kahoot-blue/30 bg-blue-50 dark:bg-blue-900/20',
  green: 'border-kahoot-green/30 bg-green-50 dark:bg-green-900/20',
  yellow: 'border-kahoot-yellow/30 bg-amber-50 dark:bg-amber-900/20',
};

const newQuestion = () => ({
  text: '', image_url: '', time_limit_seconds: 20, points: 1000, _isNew: true,
  answers: [
    { text: '', is_correct: true, color: 'red' },
    { text: '', is_correct: false, color: 'blue' },
    { text: '', is_correct: false, color: 'green' },
    { text: '', is_correct: false, color: 'yellow' },
  ],
});

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showImagesToPlayers, setShowImagesToPlayers] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [sel, setSel] = useState(0);
  const [saving, setSaving] = useState(false);
  const [quizId, setQuizId] = useState(isNew ? null : id);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!isNew) loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    const { data, error } = await supabase
      .from('quizzes').select('*, questions(*, answers(*))').eq('id', id).single();
    if (error) { toast.error('Failed to load quiz'); navigate('/dashboard'); return; }
    setTitle(data.title);
    setDescription(data.description || '');
    setIsPublic(data.is_public);
    setShowImagesToPlayers(data.show_images_to_players ?? true);
    setQuestions(data.questions.sort((a, b) => a.order_index - b.order_index).map((q) => ({
      ...q, answers: q.answers.sort((a, b) => a.order_index - b.order_index),
    })));
  };

  const saveQuiz = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      let cid = quizId;
      if (!cid) {
        const { data, error } = await supabase.from('quizzes')
          .insert({ title, description, is_public: isPublic, show_images_to_players: showImagesToPlayers }).select().single();
        if (error) throw error;
        cid = data.id; setQuizId(cid);
      } else {
        await supabase.from('quizzes').update({ title, description, is_public: isPublic, show_images_to_players: showImagesToPlayers }).eq('id', cid);
      }

      await supabase.from('questions').delete().eq('quiz_id', cid);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const validAnswers = q.answers.filter((a) => a.text.trim());
        if (validAnswers.length < 2) { toast.error(`Q${i + 1} needs at least 2 answers`); setSaving(false); return; }
        if (!validAnswers.some((a) => a.is_correct)) { toast.error(`Q${i + 1} needs a correct answer`); setSaving(false); return; }

        const { data: qData, error: qErr } = await supabase.from('questions').insert({
          quiz_id: cid, text: q.text, image_url: q.image_url || null,
          time_limit_seconds: q.time_limit_seconds, points: q.points, order_index: i,
        }).select().single();
        if (qErr) throw qErr;

        const { error: aErr } = await supabase.from('answers').insert(
          validAnswers.map((a, ai) => ({
            question_id: qData.id, text: a.text, is_correct: a.is_correct, color: a.color, order_index: ai,
          }))
        );
        if (aErr) throw aErr;

        questions[i].id = qData.id;
        questions[i]._isNew = false;
      }

      setQuestions([...questions]);
      toast.success('Quiz saved!');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => { setQuestions((p) => [...p, newQuestion()]); setSel(questions.length); };

  const deleteQuestion = (index) => {
    setQuestions((p) => p.filter((_, i) => i !== index));
    if (sel >= questions.length - 1) setSel(Math.max(0, questions.length - 2));
  };

  const updateQ = (field, value) => {
    setQuestions((p) => { const u = [...p]; u[sel] = { ...u[sel], [field]: value }; return u; });
  };

  const updateA = (ai, field, value) => {
    setQuestions((p) => {
      const u = [...p]; const q = { ...u[sel] }; q.answers = [...q.answers];
      q.answers[ai] = { ...q.answers[ai], [field]: value };
      if (field === 'is_correct' && value) q.answers = q.answers.map((a, i) => ({ ...a, is_correct: i === ai }));
      u[sel] = q; return u;
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...questions];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setQuestions(items); setSel(result.destination.index);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadQuizImage('admin', file);
      updateQ('image_url', url);
    } catch { toast.error('Upload failed'); }
  };

  const cur = questions[sel];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-4 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft size={20} /> Back
          </button>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-xl font-bold font-display text-center text-gray-900 dark:text-white focus:outline-none border-b-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-primary px-4 py-1"
            placeholder="Quiz Title" />
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="btn-secondary text-sm flex items-center gap-2 py-2">
              <Settings size={16} /> Settings
            </button>
            <button onClick={saveQuiz} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Save
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto transition-colors">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {questions.map((q, i) => (
                    <Draggable key={i} draggableId={`q-${i}`} index={i}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} onClick={() => setSel(i)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-all
                            ${sel === i ? 'bg-red-50 dark:bg-red-900/20 border border-primary/30 text-primary' : 'bg-gray-50 dark:bg-gray-700 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}
                            ${snap.isDragging ? 'shadow-lg' : ''}`}>
                          <span {...prov.dragHandleProps}><GripVertical size={14} className="text-gray-400 dark:text-gray-500" /></span>
                          <span className="flex-1 truncate">{q.text || `Question ${i + 1}`}</span>
                          <button onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <button onClick={addQuestion} className="w-full mt-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary flex items-center justify-center gap-2 text-sm transition-colors">
            <Plus size={16} /> Add Question
          </button>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors">
          {cur ? (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" key={sel}>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Question Text</label>
                <textarea value={cur.text} onChange={(e) => updateQ('text', e.target.value)}
                  className="input-field text-lg font-semibold resize-none h-24" placeholder="Type your question..." />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Image (optional)</label>
                {cur.image_url ? (
                  <div className="relative inline-block">
                    <img src={cur.image_url} alt="" className="max-h-40 rounded-lg" />
                    <button onClick={() => updateQ('image_url', '')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 size={12} /></button>
                  </div>
                ) : (
                  <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-2 py-2">
                    <Image size={16} /> Upload Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium"><Clock size={14} className="inline mr-1" />Time Limit</label>
                  <select value={cur.time_limit_seconds} onChange={(e) => updateQ('time_limit_seconds', Number(e.target.value))} className="input-field">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}s</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Points</label>
                  <input type="number" value={cur.points} onChange={(e) => updateQ('points', Number(e.target.value))}
                    className="input-field" min={100} max={5000} step={100} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Answers</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cur.answers.map((a, ai) => (
                    <div key={ai} className={`border-2 rounded-lg p-3 ${COLOR_STYLES[COLOR_ORDER[ai]]}`}>
                      <div className="flex items-center gap-2">
                        <input type="text" value={a.text} onChange={(e) => updateA(ai, 'text', e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder={`Answer ${ai + 1}`} />
                        <button onClick={() => updateA(ai, 'is_correct', true)}
                          className={`p-1 rounded-full transition-all ${a.is_correct ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <p className="text-xl mb-4">No questions yet</p>
              <button onClick={addQuestion} className="btn-primary">Add Your First Question</button>
            </div>
          )}
        </main>
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Quiz Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)" className="input-field text-sm resize-none h-20" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded accent-primary w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Public quiz</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Visible to everyone</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={showImagesToPlayers} onChange={(e) => setShowImagesToPlayers(e.target.checked)} className="rounded accent-primary w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Show images to players</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Question images appear on player screens</p>
            </div>
          </label>

          <div className="flex justify-end pt-2">
            <button onClick={() => setShowSettings(false)} className="btn-primary text-sm">Done</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
