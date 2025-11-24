import { Question, QuestionType } from "./types";

export type QuestionAction =
  | { type: "addQuestion" }
  | { type: "removeQuestion"; id: string }
  | {
      type: "updateQuestion";
      id: string;
      patch: { label?: string; required?: boolean };
    }
  | { type: "changeType"; id: string; newType: QuestionType }
  | { type: "addOption"; questionId: string }
  | { type: "updateOption"; questionId: string; optionId: string; text: string }
  | { type: "removeOption"; questionId: string; optionId: string };

export function questionsReducer(
  state: Question[],
  action: QuestionAction
): Question[] {
  switch (action.type) {
    case "addQuestion":
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          label: "",
          type: "text",
          required: false,
          options: [],
        },
      ];

    case "removeQuestion":
      return state.filter((q) => q.id !== action.id);

    case "updateQuestion":
      return state.map((q) =>
        q.id === action.id
          ? {
              ...q,
              ...action.patch,
            }
          : q
      );

    case "changeType":
      return state.map((q) => {
        if (q.id !== action.id) return q;

        if (action.newType === "multipleChoice" && q.options.length === 0) {
          return {
            ...q,
            type: action.newType,
            options: [
              { id: crypto.randomUUID(), text: "" },
              { id: crypto.randomUUID(), text: "" },
            ],
          };
        }

        return {
          ...q,
          type: action.newType,
        };
      });

    case "addOption":
      return state.map((q) =>
        q.id === action.questionId
          ? {
              ...q,
              options: [...q.options, { id: crypto.randomUUID(), text: "" }],
            }
          : q
      );

    case "updateOption":
      return state.map((q) =>
        q.id === action.questionId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === action.optionId ? { ...opt, text: action.text } : opt
              ),
            }
          : q
      );

    case "removeOption":
      return state.map((q) =>
        q.id === action.questionId
          ? {
              ...q,
              options: q.options.filter((opt) => opt.id !== action.optionId),
            }
          : q
      );

    default:
      return state;
  }
}

export function createInitialQuestions(): Question[] {
  return [
    {
      id: crypto.randomUUID(),
      label: "How likely are you to recommend us to a friend?",
      type: "multipleChoice",
      required: true,
      options: [
        { id: crypto.randomUUID(), text: "Very likely" },
        { id: crypto.randomUUID(), text: "Somewhat likely" },
        { id: crypto.randomUUID(), text: "Not likely" },
      ],
    },
  ];
}
