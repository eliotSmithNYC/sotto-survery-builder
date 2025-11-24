import { Question, SurveyResponse } from "@/lib/types";

interface SurveyPreviewProps {
  questions: Question[];
  responses: SurveyResponse;
  onResponseChange: (questionId: string, value: string) => void;
}

export default function SurveyPreview({
  questions,
  responses,
  onResponseChange,
}: SurveyPreviewProps) {
  return (
    <div className="p-4">
      <div>Preview</div>
    </div>
  );
}
