"use client";

import { Question, QuestionType } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import ChevronDown from "./icons/ChevronDown";
import ChevronUp from "./icons/ChevronUp";
import XIcon from "./icons/XIcon";

interface QuestionCardProps {
  question: Question;
  isExpanded: boolean;
  isSelected: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  dispatch: React.Dispatch<QuestionAction>;
  onDelete: () => void;
}

export default function QuestionCard({
  question,
  isExpanded,
  isSelected,
  onExpand,
  onCollapse,
  dispatch,
  onDelete,
}: QuestionCardProps) {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "updateQuestion",
      id: question.id,
      patch: { label: e.target.value },
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: "changeType",
      id: question.id,
      newType: e.target.value as QuestionType,
    });
  };

  const handleRequiredToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "updateQuestion",
      id: question.id,
      patch: { required: e.target.checked },
    });
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    dispatch({
      type: "updateOption",
      questionId: question.id,
      optionId,
      text,
    });
  };

  const handleAddOption = () => {
    dispatch({
      type: "addOption",
      questionId: question.id,
    });
  };

  const handleRemoveOption = (optionId: string) => {
    dispatch({
      type: "removeOption",
      questionId: question.id,
      optionId,
    });
  };

  if (!isExpanded) {
    return (
      <div
        className={`border border-zinc-200 rounded-lg bg-white ${
          isSelected ? "ring-2 ring-zinc-900" : ""
        }`}
      >
        <button
          onClick={onExpand}
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm text-zinc-500 font-mono">
              {question.type === "text" ? "T" : "MC"}
            </span>
            <span className="text-sm text-zinc-900 truncate flex-1">
              {question.label || "Untitled question"}
            </span>
            {question.required && (
              <span className="text-zinc-500 text-xs">*</span>
            )}
          </div>
          <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border border-zinc-200 rounded-lg bg-white ${
        isSelected ? "ring-2 ring-zinc-900" : ""
      }`}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onCollapse}
            className="text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-1">
            Question Label
          </label>
          <input
            type="text"
            value={question.label}
            onChange={handleLabelChange}
            placeholder="Enter question text..."
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-1">
            Question Type
          </label>
          <select
            value={question.type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          >
            <option value="text">Freeform Text</option>
            <option value="multipleChoice">Multiple Choice</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${question.id}`}
            checked={question.required}
            onChange={handleRequiredToggle}
            className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900"
          />
          <label
            htmlFor={`required-${question.id}`}
            className="text-sm text-zinc-900"
          >
            Required
          </label>
        </div>

        {question.type === "multipleChoice" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-900">
                Options
              </label>
              <button
                onClick={handleAddOption}
                className="text-sm text-zinc-900 hover:text-green-600 transition-colors"
                aria-label="Add option"
                type="button"
              >
                + Add option
              </button>
            </div>
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      handleOptionTextChange(option.id, e.target.value)
                    }
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    className="p-2 text-zinc-600 hover:text-red-600 transition-colors"
                    aria-label="Remove option"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
