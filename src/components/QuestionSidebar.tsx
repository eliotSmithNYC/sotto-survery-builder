"use client";

import { Question } from "@/lib/types";

interface QuestionSidebarProps {
  questions: Question[];
  selectedQuestionId?: string;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onClose?: () => void;
}

export default function QuestionSidebar({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onAddQuestion,
  onClose,
}: QuestionSidebarProps) {
  const handleQuestionClick = (questionId: string) => {
    onSelectQuestion(questionId);
    onClose?.();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            Questions
          </h2>
          {questions.length === 0 ? (
            <p className="text-sm text-zinc-500">No questions yet</p>
          ) : (
            <ul className="space-y-1">
              {questions.map((question, index) => (
                <li key={question.id}>
                  <button
                    onClick={() => handleQuestionClick(question.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedQuestionId === question.id
                        ? "bg-zinc-100 text-zinc-900 font-medium"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 font-mono text-xs">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate">
                        {question.label || "Untitled question"}
                      </span>
                      {question.required && (
                        <span className="text-zinc-400 text-xs">*</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-zinc-200">
        <button
          onClick={onAddQuestion}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
        >
          Add question
        </button>
      </div>
    </div>
  );
}
