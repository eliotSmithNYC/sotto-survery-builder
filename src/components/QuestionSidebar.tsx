"use client";

import { Question } from "@/lib/types";
import ChevronUp from "./icons/ChevronUp";
import ChevronDown from "./icons/ChevronDown";

interface QuestionSidebarProps {
  questions: Question[];
  selectedQuestionId?: string;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onMoveUp?: (questionId: string) => void;
  onMoveDown?: (questionId: string) => void;
  onClose?: () => void;
}

export default function QuestionSidebar({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onAddQuestion,
  onMoveUp,
  onMoveDown,
  onClose,
}: QuestionSidebarProps) {
  const handleQuestionClick = (questionId: string) => {
    onSelectQuestion(questionId);
    onClose?.();
  };

  const handleMoveUp = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    onMoveUp?.(questionId);
  };

  const handleMoveDown = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    onMoveDown?.(questionId);
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
              {questions.map((question, index) => {
                const isSelected = selectedQuestionId === question.id;
                const typeTag =
                  question.type === "multipleChoice" ? "MC" : "Text";
                const canMoveUp = index > 0;
                const canMoveDown = index < questions.length - 1;
                return (
                  <li key={question.id}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuestionClick(question.id)}
                        className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors relative ${
                          isSelected
                            ? "bg-zinc-100 text-zinc-900 border-l-2 border-zinc-900"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 font-mono text-xs">
                            {index + 1}
                          </span>
                          <span
                            className={`flex-1 truncate ${
                              isSelected ? "font-semibold" : ""
                            }`}
                          >
                            {question.label || "Untitled question"}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded font-mono">
                            {typeTag}
                          </span>
                          {question.required && (
                            <span className="text-red-600 text-xs font-semibold">
                              *
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="flex flex-col">
                        <button
                          onClick={(e) => handleMoveUp(e, question.id)}
                          disabled={!canMoveUp}
                          className={`p-1 text-zinc-400 hover:text-zinc-900 transition-colors ${
                            !canMoveUp ? "opacity-30 cursor-not-allowed" : ""
                          }`}
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleMoveDown(e, question.id)}
                          disabled={!canMoveDown}
                          className={`p-1 text-zinc-400 hover:text-zinc-900 transition-colors ${
                            !canMoveDown ? "opacity-30 cursor-not-allowed" : ""
                          }`}
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
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
