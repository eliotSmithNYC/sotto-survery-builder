"use client";

import { useReducer, useState, useMemo } from "react";
import Header from "@/components/Header";
import ValidationBanner from "@/components/ValidationBanner";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import {
  questionsReducer,
  createInitialQuestions,
} from "@/lib/questionsReducer";
import { SurveyResponse, MultipleChoiceResponse } from "@/lib/types";
import { isQuestionValid } from "@/lib/validation";

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
  const [validationError, setValidationError] = useState<string | null>(null);

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
    if (questions.length > 0) {
      const invalidQuestion = questions.find((q) => !isQuestionValid(q));
      if (invalidQuestion) {
        setValidationError(
          "Please fill in all fields for all questions before adding a new one."
        );
        setTimeout(() => setValidationError(null), 3000);
        return;
      }
    }
    setValidationError(null);
    const newQuestionId = crypto.randomUUID();
    dispatch({ type: "addQuestion", questionId: newQuestionId });
    setSelectedQuestionId(newQuestionId);
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

  const handleMoveUp = (questionId: string) => {
    dispatch({ type: "moveUp", id: questionId });
  };

  const handleMoveDown = (questionId: string) => {
    dispatch({ type: "moveDown", id: questionId });
  };

  const handleResponseChange = (
    questionId: string,
    value: string | MultipleChoiceResponse
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleTypeChange = (questionId: string) => {
    setResponses((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      <Header onToggleSidebar={handleToggleSidebar} />
      {validationError && (
        <ValidationBanner
          message={validationError}
          onDismiss={() => setValidationError(null)}
        />
      )}

      <ResponsiveLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={handleCloseSidebar}
        questions={questions}
        selectedQuestionId={validSelectedQuestionId}
        onSelectQuestion={handleSelectQuestion}
        onAddQuestion={handleAddQuestion}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        dispatch={dispatch}
        onDeleteQuestion={handleDeleteQuestion}
        onTypeChange={handleTypeChange}
        responses={responses}
        onResponseChange={handleResponseChange}
        isJsonDrawerOpen={isJsonDrawerOpen}
        onToggleJsonDrawer={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)}
      />
    </div>
  );
}
