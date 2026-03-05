import { ANSWER_COLORS } from '../lib/constants';
import { playClick } from '../utils/sounds';
import { tapMedium } from '../utils/haptics';

export default function AnswerButton({ answer, color = 'red', onClick, disabled, selected, isCorrect, showResult }) {
  const c = ANSWER_COLORS[color] || ANSWER_COLORS.red;

  let state = '';
  if (showResult && isCorrect) state = 'ring-4 ring-green-400 scale-105';
  else if (showResult && selected && !isCorrect) state = 'opacity-50 animate-shake';
  else if (showResult && !isCorrect) state = 'opacity-30';
  else if (selected) state = 'ring-4 ring-gray-900 dark:ring-white scale-105';

  const handleClick = () => {
    if (disabled) return;
    playClick();
    tapMedium();
    onClick?.(answer);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Answer: ${answer?.text}`}
      aria-pressed={selected}
      className={`${c.bg} ${!disabled ? c.hover : ''} ${state}
        w-full py-6 px-4 rounded-lg text-white font-bold text-lg transition-all duration-200
        flex items-center gap-3 min-h-[72px] disabled:cursor-not-allowed shadow-md hover:shadow-lg
        active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900`}
    >
      <span className="text-2xl opacity-80" aria-hidden="true">{c.shape}</span>
      <span className="flex-1 text-left">{answer?.text}</span>
    </button>
  );
}
