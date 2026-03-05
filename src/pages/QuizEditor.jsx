import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Check, Image, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadQuizImage } from '../utils/avatars';
import { COLOR_ORDER, TIME_OPTIONS } from '../lib/constants';
import toast from 'react-hot-toast';

const COLOR_STYLES = {
  red: 'border-kahoot-red/50 bg-kahoot-red/10',
  blue: 'border-kahoot-blue/50 bg-kahoot-blue/10',
  green: 'border-kahoot-green/50 bg-kahoot-green/10',
  yellow: 'border-kahoot-yellow/50 bg-kahoot-yellow/10',
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
  const [questions, setQuestions] = useState([]);
  const [sel, setSel] = useState(0);
  const [saving, setSaving] = useState(false);
  const [quizId, setQuizId] = useState(isNew ? null : id);

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
          .insert({ title, description, is_public: isPublic }).select().single();
        if (error) throw error;
        cid = data.id; setQuizId(cid);
      } else {
        await supabase.from('quizzes').update({ title, description, is_public: isPublic }).eq('id', cid);
      }

      // Delete old questions and re-insert all
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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft size={20} /> Back
          </button>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-xl font-bold font-display text-center focus:outline-none border-b border-transparent hover:border-white/20 focus:border-primary px-4 py-1"
            placeholder="Quiz Title" />
          <button onClick={saveQuiz} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Save
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <aside className="w-64 border-r border-white/10 p-4 overflow-y-auto">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)" className="input-field text-sm resize-none h-16 mb-2" />
          <label className="flex items-center gap-2 mb-4 text-sm text-white/60 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded" /> Public quiz
          </label>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {questions.map((q, i) => (
                    <Draggable key={i} draggableId={`q-${i}`} index={i}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} onClick={() => setSel(i)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-all
                            ${sel === i ? 'bg-primary/30 border border-primary/50' : 'bg-white/5 border border-transparent hover:bg-white/10'}
                            ${snap.isDragging ? 'shadow-lg' : ''}`}>
                          <span {...prov.dragHandleProps}><GripVertical size={14} className="text-white/30" /></span>
                          <span className="flex-1 truncate">{q.text || `Question ${i + 1}`}</span>
                          <button onClick={(e) => { e.stopPropagation(); deleteQuestion(i); }} className="text-white/30 hover:text-red-400">
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

          <button onClick={addQuestion} className="w-full mt-3 py-2 border border-dashed border-white/20 rounded-lg text-white/50 hover:text-white hover:border-white/40 flex items-center justify-center gap-2 text-sm">
            <Plus size={16} /> Add Question
          </button>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {cur ? (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" key={sel}>
              <div>
                <label className="block text-sm text-white/60 mb-1">Question Text</label>
                <textarea value={cur.text} onChange={(e) => updateQ('text', e.target.value)}
                  className="input-field text-lg font-semibold resize-none h-24" placeholder="Type your question..." />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">Image (optional)</label>
                {cur.image_url ? (
                  <div className="relative inline-block">
                    <img src={cur.image_url} alt="" className="max-h-40 rounded-lg" />
                    <button onClick={() => updateQ('image_url', '')} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><Trash2 size={12} /></button>
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
                  <label className="block text-sm text-white/60 mb-1"><Clock size={14} className="inline mr-1" />Time Limit</label>
                  <select value={cur.time_limit_seconds} onChange={(e) => updateQ('time_limit_seconds', Number(e.target.value))} className="input-field">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t} className="bg-gray-900">{t}s</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-white/60 mb-1">Points</label>
                  <input type="number" value={cur.points} onChange={(e) => updateQ('points', Number(e.target.value))}
                    className="input-field" min={100} max={5000} step={100} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Answers</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cur.answers.map((a, ai) => (
                    <div key={ai} className={`border rounded-lg p-3 ${COLOR_STYLES[COLOR_ORDER[ai]]}`}>
                      <div className="flex items-center gap-2">
                        <input type="text" value={a.text} onChange={(e) => updateA(ai, 'text', e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-white/30"
                          placeholder={`Answer ${ai + 1}`} />
                        <button onClick={() => updateA(ai, 'is_correct', true)}
                          className={`p-1 rounded-full transition-all ${a.is_correct ? 'bg-green-500 text-white' : 'bg-white/10 text-white/30 hover:bg-white/20'}`}>
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <p className="text-xl mb-4">No questions yet</p>
              <button onClick={addQuestion} className="btn-primary">Add Your First Question</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
