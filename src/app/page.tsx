"use client";

import { useReducer, useState, useMemo } from "react";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";
import QuestionSidebar from "@/components/QuestionSidebar";
import BuilderArea from "@/components/BuilderArea";
import PreviewArea from "@/components/PreviewArea";
import JsonDrawer from "@/components/JsonDrawer";
import JsonTab from "@/components/JsonTab";
import {
  questionsReducer,
  createInitialQuestions,
} from "@/lib/questionsReducer";
import { SurveyResponse } from "@/lib/types";

type Tab = "build" | "preview" | "json";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("build");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState(false);
  const [questions, dispatch] = useReducer(
    questionsReducer,
    createInitialQuestions()
  );
  const [responses, setResponses] = useState<SurveyResponse>({});
  const [selectedQuestionId, setSelectedQuestionId] = useState<
    string | undefined
  >(questions.length > 0 ? questions[0].id : undefined);

  const validSelectedQuestionId = useMemo(() => {
    if (questions.length === 0) {
      return undefined;
    }
    const selectedExists = questions.some((q) => q.id === selectedQuestionId);
    if (selectedExists) {
      return selectedQuestionId;
    }
    return questions[0]?.id;
  }, [questions, selectedQuestionId]);

  const handleAddQuestion = () => {
    const newQuestions = questionsReducer(questions, { type: "addQuestion" });
    dispatch({ type: "addQuestion" });
    if (newQuestions.length > 0) {
      const lastQuestion = newQuestions[newQuestions.length - 1];
      if (lastQuestion) {
        setSelectedQuestionId(lastQuestion.id);
      }
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    const wasSelected = validSelectedQuestionId === questionId;
    dispatch({ type: "removeQuestion", id: questionId });
    if (wasSelected) {
      const remainingQuestions = questions.filter((q) => q.id !== questionId);
      if (remainingQuestions.length > 0) {
        setSelectedQuestionId(remainingQuestions[0].id);
      } else {
        setSelectedQuestionId(undefined);
      }
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <Header
        onAddQuestion={handleAddQuestion}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="md:hidden">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={handleCloseSidebar}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <QuestionSidebar
            questions={questions}
            selectedQuestionId={validSelectedQuestionId}
            onSelectQuestion={handleSelectQuestion}
            onAddQuestion={handleAddQuestion}
            onClose={handleCloseSidebar}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Mobile: Tab-based content */}
          <div
            className={`flex-1 bg-white md:hidden ${
              activeTab === "json" ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            {activeTab === "build" && (
              <BuilderArea
                questions={questions}
                selectedQuestionId={validSelectedQuestionId}
                dispatch={dispatch}
                onSelectQuestion={setSelectedQuestionId}
                onDeleteQuestion={handleDeleteQuestion}
              />
            )}
            {activeTab === "preview" && (
              <PreviewArea
                questions={questions}
                selectedQuestionId={validSelectedQuestionId}
                responses={responses}
                onResponseChange={handleResponseChange}
                onSelectQuestion={setSelectedQuestionId}
              />
            )}
            {activeTab === "json" && (
              <JsonTab questions={questions} responses={responses} />
            )}
          </div>

          {/* Desktop: Side-by-side Builder and Preview */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-white border-r border-zinc-200">
              <BuilderArea
                questions={questions}
                selectedQuestionId={validSelectedQuestionId}
                dispatch={dispatch}
                onSelectQuestion={setSelectedQuestionId}
                onDeleteQuestion={handleDeleteQuestion}
              />
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <PreviewArea
                questions={questions}
                selectedQuestionId={validSelectedQuestionId}
                responses={responses}
                onResponseChange={handleResponseChange}
                onSelectQuestion={setSelectedQuestionId}
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
          onToggle={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)}
        />
      </div>
    </div>
  );
}
