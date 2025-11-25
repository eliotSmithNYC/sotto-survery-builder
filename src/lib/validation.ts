import { Question } from "./types";

export function isQuestionValid(question: Question): boolean {
  if (!question.label.trim()) {
    return false;
  }

  if (question.type === "multipleChoice") {
    if (question.options.length === 0) {
      return false;
    }
    return question.options.every((option) => option.text.trim() !== "");
  }

  return true;
}
