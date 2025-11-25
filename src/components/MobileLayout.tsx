"use client";

import { Question } from "@/lib/types";
import { SurveyResponse } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import Tabs from "./Tabs";
import QuestionSidebar from "./QuestionSidebar";
import BuilderArea from "./BuilderArea";
import PreviewArea from "./PreviewArea";
import JsonTab from "./JsonTab";

type Tab = "build" | "preview" | "json";

interface MobileLayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
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
}

export default function MobileLayout({
  activeTab,
  onTabChange,
  isSidebarOpen,
  onCloseSidebar,
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
}: MobileLayoutProps) {
  return (
    <>
      <Tabs activeTab={activeTab} onTabChange={onTabChange} />

      <div className="flex-1 flex overflow-hidden relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onCloseSidebar}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onCloseSidebar();
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close sidebar"
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <QuestionSidebar
            questions={questions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={onSelectQuestion}
            onAddQuestion={onAddQuestion}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onClose={onCloseSidebar}
          />
        </div>

        <div
          className={`flex-1 bg-white ${
            activeTab === "json" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {activeTab === "build" && (
            <BuilderArea
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              dispatch={dispatch}
              onSelectQuestion={onSelectQuestion}
              onDeleteQuestion={onDeleteQuestion}
              onAddQuestion={onAddQuestion}
              onTypeChange={onTypeChange}
            />
          )}
          {activeTab === "preview" && (
            <PreviewArea
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              responses={responses}
              onResponseChange={onResponseChange}
              onSelectQuestion={onSelectQuestion}
            />
          )}
          {activeTab === "json" && (
            <JsonTab questions={questions} responses={responses} />
          )}
        </div>
      </div>
    </>
  );
}

