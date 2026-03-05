export default function QuestionDisplay({ question, questionNumber, totalQuestions }) {
  return (
    <div className="text-center w-full animate-fade-in" role="region" aria-label="Current question">
      {questionNumber != null && totalQuestions != null && (
        <div className="mb-3">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Question {questionNumber} of {totalQuestions}</p>
          <div className="w-full max-w-xs mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className="bg-primary rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} />
          </div>
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold font-display mb-4 leading-tight text-gray-900 dark:text-white">
        {question?.text}
      </h2>
      {question?.image_url && (
        <div className="flex justify-center mb-4">
          <img src={question.image_url} alt="Question illustration" className="max-h-64 rounded-lg shadow-sm object-contain" />
        </div>
      )}
    </div>
  );
}
