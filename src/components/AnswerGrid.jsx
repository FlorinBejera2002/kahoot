import AnswerButton from './AnswerButton';
import { COLOR_ORDER } from '../lib/constants';

export default function AnswerGrid({ answers = [], onAnswer, disabled, selectedId, correctId, showResult }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {answers.map((answer, i) => (
        <AnswerButton
          key={answer.id}
          answer={answer}
          color={COLOR_ORDER[i]}
          onClick={onAnswer}
          disabled={disabled}
          selected={selectedId === answer.id}
          isCorrect={showResult ? answer.id === correctId || answer.is_correct : null}
          showResult={showResult}
        />
      ))}
    </div>
  );
}
