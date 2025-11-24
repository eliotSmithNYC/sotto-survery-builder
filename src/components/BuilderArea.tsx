"use client";

import { Question } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import QuestionCard from "./QuestionCard";
import { useState } from "react";

interface BuilderAreaProps {
  questions: Question[];
  selectedQuestionId?: string;
  dispatch: React.Dispatch<QuestionAction>;
  onSelectQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
}

export default function BuilderArea({
  questions,
  selectedQuestionId,
  dispatch,
  onSelectQuestion,
  onDeleteQuestion,
}: BuilderAreaProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<
    string | undefined
  >(selectedQuestionId);

  const handleExpand = (questionId: string) => {
    setExpandedQuestionId(questionId);
    onSelectQuestion(questionId);
  };

  const handleCollapse = () => {
    setExpandedQuestionId(undefined);
  };

  const handleDelete = (questionId: string) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(undefined);
    }
    onDeleteQuestion(questionId);
  };

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
            isExpanded={expandedQuestionId === question.id}
            isSelected={selectedQuestionId === question.id}
            onExpand={() => handleExpand(question.id)}
            onCollapse={handleCollapse}
            dispatch={dispatch}
            onDelete={() => handleDelete(question.id)}
          />
        ))}
      </div>
    </div>
  );
}
