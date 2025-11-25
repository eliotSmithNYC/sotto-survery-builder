"use client";

import { useEffect, useRef } from "react";
import { Question } from "@/lib/types";
import { SurveyResponse } from "@/lib/types";
import PreviewQuestion from "./PreviewQuestion";

interface PreviewAreaProps {
  questions: Question[];
  selectedQuestionId?: string;
  responses: SurveyResponse;
  onResponseChange: (questionId: string, value: string) => void;
  onSelectQuestion?: (questionId: string) => void;
}

export default function PreviewArea({
  questions,
  selectedQuestionId,
  responses,
  onResponseChange,
  onSelectQuestion,
}: PreviewAreaProps) {
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedQuestionId && questionRefs.current[selectedQuestionId]) {
      questionRefs.current[selectedQuestionId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedQuestionId]);

  const setQuestionRef = (questionId: string, element: HTMLDivElement | null) => {
    questionRefs.current[questionId] = element;
  };

  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-zinc-600 mb-4">No questions yet</p>
          <p className="text-sm text-zinc-500">
            Add questions in the builder to see the preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6 max-w-[560px] mx-auto">
        {questions.map((question) => (
          <div
            key={question.id}
            ref={(el) => setQuestionRef(question.id, el)}
          >
            <PreviewQuestion
              question={question}
              isSelected={selectedQuestionId === question.id}
              value={responses[question.id] || ""}
              onChange={(value) => onResponseChange(question.id, value)}
              onFocus={() => onSelectQuestion?.(question.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

