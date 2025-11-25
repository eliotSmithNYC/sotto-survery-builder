"use client";

import { Question } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import QuestionCard from "./QuestionCard";
import Button from "./ui/Button";

interface BuilderAreaProps {
  questions: Question[];
  selectedQuestionId?: string;
  dispatch: React.Dispatch<QuestionAction>;
  onSelectQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onTypeChange?: (questionId: string) => void;
}

export default function BuilderArea({
  questions,
  selectedQuestionId,
  dispatch,
  onSelectQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onTypeChange,
}: BuilderAreaProps) {
  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-zinc-600 mb-4">No questions yet</p>
          <Button variant="primary" onClick={onAddQuestion}>
            Add question
          </Button>
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
            onTypeChange={onTypeChange}
          />
        ))}
        <Button variant="secondary" onClick={onAddQuestion} className="w-full">
          + Add question
        </Button>
      </div>
    </div>
  );
}
