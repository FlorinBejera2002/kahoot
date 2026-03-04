export default function QuestionDisplay({ question, questionNumber, totalQuestions }) {
  return (
    <div className="text-center w-full animate-fade-in">
      {questionNumber != null && totalQuestions != null && (
        <p className="text-white/50 text-sm mb-2">Question {questionNumber} of {totalQuestions}</p>
      )}
      <h2 className="text-2xl md:text-3xl font-bold font-display mb-4 leading-tight">
        {question?.text}
      </h2>
      {question?.image_url && (
        <div className="flex justify-center mb-4">
          <img src={question.image_url} alt="Question" className="max-h-64 rounded-lg shadow-lg object-contain" />
        </div>
      )}
    </div>
  );
}
