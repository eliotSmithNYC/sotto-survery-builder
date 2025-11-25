"use client";

import { Question, MultipleChoiceResponse } from "@/lib/types";
import Input from "./ui/Input";
import Card from "./ui/Card";

interface PreviewQuestionProps {
  question: Question;
  isSelected: boolean;
  value: string | MultipleChoiceResponse | undefined;
  onChange: (value: string | MultipleChoiceResponse) => void;
  onFocus?: () => void;
}

export default function PreviewQuestion({
  question,
  isSelected,
  value,
  onChange,
  onFocus,
}: PreviewQuestionProps) {
  return (
    <Card
      variant={isSelected ? "highlighted" : "default"}
      className="p-4 transition-colors"
    >
      <label className="block text-sm font-medium text-zinc-900 mb-3">
        {question.label || "Untitled question"}
        {question.required && (
          <span className="ml-2 text-red-600 font-semibold">
            <span className="text-lg">*</span> Required
          </span>
        )}
      </label>

      {question.type === "text" ? (
        <Input
          type="textarea"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder="Type your answer here..."
          rows={4}
        />
      ) : (
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected =
              typeof value === "object" &&
              value !== null &&
              "optionId" in value &&
              value.optionId === option.id;
            return (
              <label
                key={option.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-2 rounded-md -ml-2"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() =>
                    onChange({
                      optionId: option.id,
                      optionText: option.text,
                    })
                  }
                  onFocus={onFocus}
                  className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-900">
                  {option.text || "Untitled option"}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </Card>
  );
}
