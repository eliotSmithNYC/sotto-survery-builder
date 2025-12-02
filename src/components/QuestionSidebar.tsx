"use client";

import { Question } from "@/lib/types";
import { getQuestionTypeTag } from "@/lib/questionUtils";
import ChevronUp from "./icons/ChevronUp";
import ChevronDown from "./icons/ChevronDown";
import Button from "./ui/Button";

interface QuestionSidebarProps {
  questions: Question[];
  selectedQuestionId?: string;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onMoveUp?: (questionId: string) => void;
  onMoveDown?: (questionId: string) => void;
  // close sidebar only on mobile
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
    // the entire question pill is a button - clicking focuses the question card and preview.
    // clicking move up or down should not focus the question card and preview.
    // so we need to stop propagation of the click event.
    e.stopPropagation();
    onMoveUp?.(questionId);
  };

  const handleMoveDown = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation();
    onMoveDown?.(questionId);
  };

  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
                const typeTag = getQuestionTypeTag(question.type);
                const canMoveUp = index > 0;
                const canMoveDown = index < questions.length - 1;
                return (
                  <li key={question.id}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuestionClick(question.id)}
                        className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors relative min-w-0 ${
                          isSelected
                            ? "bg-zinc-100 text-zinc-900 border-l-2 border-zinc-900"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-zinc-400 font-mono text-xs flex-shrink-0">
                            {index + 1}
                          </span>
                          <span
                            className={`flex-1 truncate min-w-0 ${
                              isSelected ? "font-semibold" : ""
                            }`}
                          >
                            {question.label || "Untitled question"}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded font-mono flex-shrink-0">
                            {typeTag}
                          </span>
                          {question.required && (
                            <span className="text-red-600 text-xs font-semibold flex-shrink-0">
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
        <Button variant="primary" onClick={onAddQuestion} className="w-full">
          Add question
        </Button>
      </div>
    </div>
  );
}
