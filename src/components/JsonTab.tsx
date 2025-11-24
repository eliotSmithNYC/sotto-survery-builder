"use client";

import { Question } from "@/lib/types";
import { SurveyResponse } from "@/lib/types";
import JsonPanel from "./JsonPanel";

interface JsonTabProps {
  questions: Question[];
  responses: SurveyResponse;
}

export default function JsonTab({ questions, responses }: JsonTabProps) {
  return (
    <div className="h-full overflow-hidden bg-white">
      <JsonPanel questions={questions} responses={responses} />
    </div>
  );
}

