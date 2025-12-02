import { QuestionType } from "./types";

export function getQuestionTypeLabel(type: QuestionType): string {
  return type === "multipleChoice" ? "Multiple Choice" : "Freeform Text";
}

export function getQuestionTypeTag(type: QuestionType): string {
  return type === "multipleChoice" ? "MC" : "Text";
}

export function getRequiredLabel(required: boolean): string {
  return required ? "Required" : "Optional";
}
