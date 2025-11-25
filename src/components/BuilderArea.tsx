"use client";

import { Question } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import QuestionCard from "./QuestionCard";

interface BuilderAreaProps {
  questions: Question[];
  selectedQuestionId?: string;
  dispatch: React.Dispatch<QuestionAction>;
  onSelectQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
}

export default function BuilderArea({
  questions,
  selectedQuestionId,
  dispatch,
  onSelectQuestion,
  onDeleteQuestion,
  onAddQuestion,
}: BuilderAreaProps) {
  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-zinc-600 mb-4">No questions yet</p>
          <button
            onClick={onAddQuestion}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
          >
            Add question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-4 max-w-3xl">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            isSelected={selectedQuestionId === question.id}
            dispatch={dispatch}
            onSelect={() => onSelectQuestion(question.id)}
            onDelete={() => onDeleteQuestion(question.id)}
          />
        ))}
        <button
          onClick={onAddQuestion}
          className="w-full px-4 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
        >
          + Add question
        </button>
      </div>
    </div>
  );
}
