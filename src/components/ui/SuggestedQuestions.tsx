interface SuggestedQuestionsProps {
  questions: string[];
  onPick: (question: string) => void;
  disabled?: boolean;
}

/** Three starter-question buttons shown before a conversation begins. */
export function SuggestedQuestions({ questions, onPick, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onPick(question)}
          className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[13px] text-white/75 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="text-white/30 transition group-hover:text-white/60">✦</span>
          <span>{question}</span>
        </button>
      ))}
    </div>
  );
}
