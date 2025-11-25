"use client";

import { Question } from "@/lib/types";
import { SurveyResponse } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";

type Tab = "build" | "preview" | "json";

interface ResponsiveLayoutProps {
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
  isJsonDrawerOpen: boolean;
  onToggleJsonDrawer: () => void;
}

export default function ResponsiveLayout({
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
  isJsonDrawerOpen,
  onToggleJsonDrawer,
}: ResponsiveLayoutProps) {
  return (
    <div
      className={`flex-1 flex overflow-hidden relative ${
        isJsonDrawerOpen ? "pb-0" : ""
      }`}
    >
      <div className="md:hidden flex-1 flex flex-col">
        <MobileLayout
          activeTab={activeTab}
          onTabChange={onTabChange}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={onCloseSidebar}
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={onSelectQuestion}
          onAddQuestion={onAddQuestion}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          dispatch={dispatch}
          onDeleteQuestion={onDeleteQuestion}
          onTypeChange={onTypeChange}
          responses={responses}
          onResponseChange={onResponseChange}
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col">
        <DesktopLayout
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={onSelectQuestion}
          onAddQuestion={onAddQuestion}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          dispatch={dispatch}
          onDeleteQuestion={onDeleteQuestion}
          onTypeChange={onTypeChange}
          responses={responses}
          onResponseChange={onResponseChange}
          isJsonDrawerOpen={isJsonDrawerOpen}
          onToggleJsonDrawer={onToggleJsonDrawer}
        />
      </div>
    </div>
  );
}
