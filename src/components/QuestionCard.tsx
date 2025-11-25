"use client";

import { Question, QuestionType } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import {
  getQuestionTypeLabel,
  getRequiredLabel,
} from "@/lib/questionUtils";
import XIcon from "./icons/XIcon";
import ChevronDown from "./icons/ChevronDown";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  dispatch: React.Dispatch<QuestionAction>;
  onSelect: () => void;
  onDelete: () => void;
  onTypeChange?: (questionId: string) => void;
}

export default function QuestionCard({
  question,
  isSelected,
  dispatch,
  onSelect,
  onDelete,
  onTypeChange,
}: QuestionCardProps) {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "updateQuestion",
      id: question.id,
      patch: { label: e.target.value },
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as QuestionType;
    if (newType !== question.type) {
      onTypeChange?.(question.id);
    }
    dispatch({
      type: "changeType",
      id: question.id,
      newType,
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

  const typeLabel = getQuestionTypeLabel(question.type);
  const requiredLabel = getRequiredLabel(question.required);

  if (!isSelected) {
    return (
      <Card variant="hover" onClick={onSelect}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm text-zinc-900 truncate">
              {question.label || "Untitled question"}
            </span>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {typeLabel}
            </span>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {requiredLabel}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="selected" onClick={onSelect}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-end">
          <Button
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>

        <div>
          <label
            htmlFor={`label-${question.id}`}
            className="block text-sm font-medium text-zinc-900 mb-2"
          >
            Question Label
          </label>
          <Input
            type="text"
            id={`label-${question.id}`}
            value={question.label}
            onChange={handleLabelChange}
            onFocus={onSelect}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter question text..."
            aria-describedby={`label-${question.id}-description`}
          />
          <span id={`label-${question.id}-description`} className="sr-only">
            Enter the text that will be displayed for this question
          </span>
        </div>

        <div>
          <label
            htmlFor={`type-${question.id}`}
            className="block text-sm font-medium text-zinc-900 mb-2"
          >
            Question Type
          </label>
          <Input
            type="select"
            id={`type-${question.id}`}
            value={question.type}
            onChange={handleTypeChange}
            onFocus={onSelect}
            onClick={(e) => e.stopPropagation()}
            aria-describedby={`type-${question.id}-description`}
          >
            <option value="text">Freeform Text</option>
            <option value="multipleChoice">Multiple Choice</option>
          </Input>
          <span id={`type-${question.id}-description`} className="sr-only">
            Choose whether this question accepts freeform text or multiple choice
            options
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${question.id}`}
            checked={question.required}
            onChange={handleRequiredToggle}
            onFocus={onSelect}
            onClick={(e) => e.stopPropagation()}
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
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <label htmlFor={`option-${option.id}`} className="sr-only">
                    Option {index + 1}
                  </label>
                  <Input
                    type="text"
                    id={`option-${option.id}`}
                    value={option.text}
                    onChange={(e) =>
                      handleOptionTextChange(option.id, e.target.value)
                    }
                    onFocus={onSelect}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                    aria-describedby={`option-${option.id}-description`}
                  />
                  <span
                    id={`option-${option.id}-description`}
                    className="sr-only"
                  >
                    Text for option {index + 1} in this multiple choice question
                  </span>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(option.id);
                    }}
                    aria-label="Remove option"
                    className="text-zinc-600 hover:text-red-600"
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddOption();
                }}
                aria-label="Add option"
                className="text-left hover:text-green-600"
              >
                + Add option
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
