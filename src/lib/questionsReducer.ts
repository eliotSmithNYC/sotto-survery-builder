import { Question, QuestionType } from "./types";

export type QuestionAction =
  | { type: "addQuestion"; questionId?: string }
  | { type: "removeQuestion"; id: string }
  | {
      type: "updateQuestion";
      id: string;
      patch: { label?: string; required?: boolean };
    }
  | { type: "changeType"; id: string; newType: QuestionType }
  | { type: "addOption"; questionId: string }
  | { type: "updateOption"; questionId: string; optionId: string; text: string }
  | { type: "removeOption"; questionId: string; optionId: string }
  | { type: "moveUp"; id: string }
  | { type: "moveDown"; id: string };

export function questionsReducer(
  state: Question[],
  action: QuestionAction
): Question[] {
  switch (action.type) {
    case "addQuestion":
      return [
        ...state,
        {
          id: action.questionId || crypto.randomUUID(),
          label: "",
          type: "text",
          required: false,
          options: [],
        },
      ];

    case "removeQuestion":
      return state.filter((q) => q.id !== action.id);

    case "updateQuestion":
      // could unintentionally overwrite other fields
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

        /*
         * The final return path is only reachable if newType === "multipleChoice" and options already exist, which isn't obvious.
         * The logic could be more explicit about what happens in each transition.
         * Suggestion: make transitions explicit:
         */
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

        if (action.newType === "text") {
          return {
            ...q,
            type: action.newType,
            options: [],
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

    case "moveUp": {
      const index = state.findIndex((q) => q.id === action.id);
      if (index <= 0) return state;
      const newState = [...state];
      [newState[index - 1], newState[index]] = [
        newState[index],
        newState[index - 1],
      ];
      return newState;
    }

    case "moveDown": {
      const index = state.findIndex((q) => q.id === action.id);
      if (index < 0 || index >= state.length - 1) return state;
      const newState = [...state];
      [newState[index], newState[index + 1]] = [
        newState[index + 1],
        newState[index],
      ];
      return newState;
    }

    default:
      return state;
  }
}

export function createInitialQuestions(): Question[] {
  // Note: We use stable IDs for the initial question to avoid hydration mismatches
  // between server and client rendering. In production, this would use a deterministic
  // hash based on user info and date/visit to ensure uniqueness across surveys
  // while maintaining consistency between SSR and client hydration.
  return [
    {
      id: "initial-question-1",
      label: "How likely are you to recommend us to a friend?",
      type: "multipleChoice",
      required: true,
      options: [
        { id: "initial-option-1", text: "Very likely" },
        { id: "initial-option-2", text: "Somewhat likely" },
        { id: "initial-option-3", text: "Not likely" },
      ],
    },
  ];
}
