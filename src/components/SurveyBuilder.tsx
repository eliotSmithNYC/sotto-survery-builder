import { QuestionAction } from "@/lib/questionsReducer";
import { Question } from "@/lib/types";

interface SurveyBuilderProps {
  questions: Question[];
  dispatch: React.Dispatch<QuestionAction>;
  selectedQuestionId: string | null;
  setSelectedQuestionId: (id: string | null) => void;
}

export default function SurveyBuilder({
  questions,
  dispatch,
  selectedQuestionId,
  setSelectedQuestionId,
}: SurveyBuilderProps) {
  return (
    <div className="p-4">
      <div>Builder</div>
    </div>
  );
}
