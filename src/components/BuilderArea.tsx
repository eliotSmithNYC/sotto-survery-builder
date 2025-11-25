"use client";

import { Question } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import QuestionCard from "./QuestionCard";

interface BuilderAreaProps {
  questions: Question[];
  selectedQuestionId?: string;
  dispatch: React.Dispatch<QuestionAction>;
  onDeleteQuestion: (questionId: string) => void;
}

export default function BuilderArea({
  questions,
  selectedQuestionId,
  dispatch,
  onDeleteQuestion,
}: BuilderAreaProps) {
  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-zinc-600 mb-4">No questions yet</p>
          <p className="text-sm text-zinc-500">
            Click &quot;Add question&quot; to get started
          </p>
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
            onDelete={() => onDeleteQuestion(question.id)}
          />
        ))}
      </div>
    </div>
  );
}
