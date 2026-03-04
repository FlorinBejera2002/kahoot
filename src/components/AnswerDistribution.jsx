import { ANSWER_COLORS } from '../lib/constants';

export default function AnswerDistribution({ distribution = [] }) {
  const maxCount = Math.max(...distribution.map((a) => a.count || 0), 1);

  return (
    <div className="flex items-end justify-center gap-4 h-48 mb-8">
      {distribution.map((answer) => {
        const height = ((answer.count || 0) / maxCount) * 100;
        const bgClass = ANSWER_COLORS[answer.color]?.bg || 'bg-white/20';

        return (
          <div key={answer.answer_id || answer.id} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
            <span className="font-bold text-sm">{answer.count || 0}</span>
            <div
              className={`w-full rounded-t-lg transition-all duration-700 ${bgClass} ${answer.is_correct ? 'ring-4 ring-white/50' : ''}`}
              style={{ height: `${Math.max(height, 5)}%`, minHeight: '20px' }}
            />
            <span className="text-xs text-white/60 text-center truncate w-full">{answer.text}</span>
            {answer.is_correct && <span className="text-xs text-green-400 font-medium">Correct</span>}
          </div>
        );
      })}
    </div>
  );
}
