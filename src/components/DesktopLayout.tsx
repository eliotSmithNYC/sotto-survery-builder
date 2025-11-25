"use client";

import { Question } from "@/lib/types";
import { SurveyResponse } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import QuestionSidebar from "./QuestionSidebar";
import BuilderArea from "./BuilderArea";
import PreviewArea from "./PreviewArea";
import JsonDrawer from "./JsonDrawer";

interface DesktopLayoutProps {
  questions: Question[];
  selectedQuestionId?: string;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onMoveUp: (questionId: string) => void;
  onMoveDown: (questionId: string) => void;
  dispatch: React.Dispatch<QuestionAction>;
  onDeleteQuestion: (questionId: string) => void;
  onTypeChange?: (questionId: string) => void;
  responses: SurveyResponse;
  onResponseChange: (questionId: string, value: string) => void;
  isJsonDrawerOpen: boolean;
  onToggleJsonDrawer: () => void;
}

export default function DesktopLayout({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onAddQuestion,
  onMoveUp,
  onMoveDown,
  dispatch,
  onDeleteQuestion,
  onTypeChange,
  responses,
  onResponseChange,
  isJsonDrawerOpen,
  onToggleJsonDrawer,
}: DesktopLayoutProps) {
  return (
    <>
      <div className="flex-1 flex overflow-hidden relative">
        <div className="inset-y-0 left-0 w-64 border-r border-zinc-200 bg-white">
          <QuestionSidebar
            questions={questions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={onSelectQuestion}
            onAddQuestion={onAddQuestion}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <h2 className="text-sm font-semibold text-zinc-900">Builder</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <BuilderArea
                questions={questions}
                selectedQuestionId={selectedQuestionId}
                dispatch={dispatch}
                onSelectQuestion={onSelectQuestion}
                onDeleteQuestion={onDeleteQuestion}
                onAddQuestion={onAddQuestion}
                onTypeChange={onTypeChange}
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <h2 className="text-sm font-semibold text-zinc-900">Preview</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PreviewArea
                questions={questions}
                selectedQuestionId={selectedQuestionId}
                responses={responses}
                onResponseChange={onResponseChange}
                onSelectQuestion={onSelectQuestion}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <JsonDrawer
          questions={questions}
          responses={responses}
          isOpen={isJsonDrawerOpen}
          onToggle={onToggleJsonDrawer}
        />
      </div>
    </>
  );
}
