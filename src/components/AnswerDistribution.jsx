import { ANSWER_COLORS } from '../lib/constants';

export default function AnswerDistribution({ distribution = [] }) {
  const maxCount = Math.max(...distribution.map((a) => a.count || 0), 1);

  return (
    <div className="flex items-end justify-center gap-4 h-48 mb-8" role="img" aria-label="Answer distribution chart">
      {distribution.map((answer) => {
        const height = ((answer.count || 0) / maxCount) * 100;
        const bgClass = ANSWER_COLORS[answer.color]?.bg || 'bg-gray-300 dark:bg-gray-600';

        return (
          <div key={answer.answer_id || answer.id} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
            <span className="font-bold text-sm text-gray-900 dark:text-white">{answer.count || 0}</span>
            <div
              className={`w-full rounded-t-lg transition-all duration-700 ${bgClass} ${answer.is_correct ? 'ring-4 ring-green-300 dark:ring-green-500' : ''}`}
              style={{ height: `${Math.max(height, 5)}%`, minHeight: '20px' }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center truncate w-full">{answer.text}</span>
            {answer.is_correct && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Correct</span>}
          </div>
        );
      })}
    </div>
  );
}
