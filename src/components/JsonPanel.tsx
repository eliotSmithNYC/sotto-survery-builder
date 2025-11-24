"use client";

import { useState } from "react";
import { Question } from "@/lib/types";
import { SurveyResponse } from "@/lib/types";

interface JsonPanelProps {
  questions: Question[];
  responses: SurveyResponse;
}

export default function JsonPanel({ questions, responses }: JsonPanelProps) {
  const [activeTab, setActiveTab] = useState<"definition" | "responses">(
    "definition"
  );

  const definitionJson = JSON.stringify({ questions }, null, 2);
  const responsesJson = JSON.stringify(responses, null, 2);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("definition")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "definition"
              ? "bg-zinc-900 text-white border-b-2 border-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Definition
        </button>
        <button
          onClick={() => setActiveTab("responses")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "responses"
              ? "bg-zinc-900 text-white border-b-2 border-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Responses
        </button>
      </div>

      <div className="flex-1 overflow-auto relative">
        <pre className="p-4 text-sm font-mono text-zinc-900 whitespace-pre-wrap break-words">
          {activeTab === "definition" ? definitionJson : responsesJson}
        </pre>
        <button
          onClick={() =>
            handleCopy(
              activeTab === "definition" ? definitionJson : responsesJson
            )
          }
          className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
