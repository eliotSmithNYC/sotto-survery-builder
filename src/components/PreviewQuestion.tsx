"use client";

import { Question } from "@/lib/types";

interface PreviewQuestionProps {
  question: Question;
  isSelected: boolean;
  value: string;
  onChange: (value: string) => void;
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
    <div
      className={`border rounded-lg p-4 transition-colors ${
        isSelected
          ? "border-blue-400 bg-blue-50/50"
          : "border-zinc-200 bg-white"
      }`}
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
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder="Type your answer here..."
          rows={4}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-y"
        />
      ) : (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-2 rounded-md -ml-2"
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={value === option.id}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
              />
              <span className="text-sm text-zinc-900">
                {option.text || "Untitled option"}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
