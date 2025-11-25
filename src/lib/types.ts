export type QuestionType = "text" | "multipleChoice";

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options: ChoiceOption[]; // ignored for text
}

export interface SurveyDefinition {
  questions: Question[];
}

export type MultipleChoiceResponse = {
  optionId: string;
  optionText: string;
};

export type SurveyResponse = Record<string, string | MultipleChoiceResponse>;
