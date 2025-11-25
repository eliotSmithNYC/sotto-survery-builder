"use client";

import { Question } from "@/lib/types";
import { SurveyResponse } from "@/lib/types";
import JsonPanel from "./JsonPanel";
import ChevronDown from "./icons/ChevronDown";
import ChevronUp from "./icons/ChevronUp";
import Button from "./ui/Button";

interface JsonDrawerProps {
  questions: Question[];
  responses: SurveyResponse;
  isOpen: boolean;
  onToggle: () => void;
}

export default function JsonDrawer({
  questions,
  responses,
  isOpen,
  onToggle,
}: JsonDrawerProps) {
  return (
    <div
      className={`border-t border-zinc-200 bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isOpen ? "h-[40vh]" : "h-[48px]"
      }`}
    >
      {isOpen ? (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-center px-4 py-3 border-b border-zinc-200 bg-zinc-50 relative">
            <span className="text-sm font-semibold text-zinc-900">JSON</span>
            <Button
              variant="ghost"
              onClick={onToggle}
              className="absolute right-4"
              aria-label="Collapse JSON drawer"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <JsonPanel questions={questions} responses={responses} />
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full h-full flex items-center justify-center px-4 bg-zinc-50 hover:bg-zinc-100 relative"
          aria-label="Expand JSON drawer"
        >
          <span className="text-sm font-semibold text-zinc-900">JSON</span>
          <ChevronUp className="w-5 h-5 text-zinc-600 absolute right-4" />
        </Button>
      )}
    </div>
  );
}
