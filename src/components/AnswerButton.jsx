import { ANSWER_COLORS } from '../lib/constants';

export default function AnswerButton({ answer, color = 'red', onClick, disabled, selected, isCorrect, showResult }) {
  const c = ANSWER_COLORS[color] || ANSWER_COLORS.red;

  let state = '';
  if (showResult && isCorrect) state = 'ring-4 ring-green-400 scale-105';
  else if (showResult && selected && !isCorrect) state = 'opacity-50 animate-shake';
  else if (showResult && !isCorrect) state = 'opacity-30';
  else if (selected) state = 'ring-4 ring-gray-900 scale-105';

  return (
    <button
      onClick={() => !disabled && onClick?.(answer)}
      disabled={disabled}
      className={`${c.bg} ${!disabled ? c.hover : ''} ${state}
        w-full py-6 px-4 rounded-lg text-white font-bold text-lg transition-all duration-200
        flex items-center gap-3 min-h-[72px] disabled:cursor-not-allowed shadow-md hover:shadow-lg
        active:scale-95`}
    >
      <span className="text-2xl opacity-80">{c.shape}</span>
      <span className="flex-1 text-left">{answer?.text}</span>
    </button>
  );
}
