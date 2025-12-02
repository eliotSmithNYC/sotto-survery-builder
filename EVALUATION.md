# Candidate Evaluation: Survey Builder Exercise

## Executive Summary

**Overall Assessment: Strong** ⭐⭐⭐⭐

The candidate has delivered a well-structured, production-ready implementation that demonstrates solid understanding of React patterns, state management, and component architecture. The codebase shows thoughtful design decisions, clean separation of concerns, and good extensibility. There are minor areas for improvement, but the foundation is excellent.

---

## 1. Component Composition ⭐⭐⭐⭐⭐

### Strengths

**Excellent separation of concerns:**

- Clear hierarchy: Layout → Feature → UI components
- `ResponsiveLayout` acts as a smart container that delegates to `DesktopLayout` and `MobileLayout`
- Feature components (`BuilderArea`, `PreviewArea`, `QuestionSidebar`) are focused and single-purpose
- UI primitives (`Button`, `Input`, `Card`) are reusable and well-abstracted

**Smart composition patterns:**

```12:26:src/components/BuilderArea.tsx
interface BuilderAreaProps {
  questions: Question[];
  selectedQuestionId?: string;
  dispatch: React.Dispatch<QuestionAction>;
  onSelectQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onTypeChange?: (questionId: string) => void;
}
```

The `BuilderArea` component receives only what it needs via props, maintaining clear boundaries. It composes `QuestionCard` components in a clean, declarative way.

**Conditional rendering handled elegantly:**

```84:103:src/components/QuestionCard.tsx
  if (!isSelected) {
    return (
      <Card variant="hover" onClick={onSelect}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm text-zinc-900 truncate">
              {question.label || "Untitled question"}
            </span>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {typeLabel}
            </span>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {requiredLabel}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        </div>
      </Card>
    );
  }
```

The collapsed/expanded state pattern is clean and maintainable.

**UI component abstraction:**

```18:56:src/components/ui/Input.tsx
export default function Input(props: InputProps) {
  const { type, className, ...restProps } = props;

  if (type === "textarea") {
    const textareaProps = restProps as Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      "type"
    >;
    return (
      <textarea
        className={cn(baseStyles, "resize-y", className)}
        {...textareaProps}
      />
    );
  }

  if (type === "select") {
    const { children, ...selectProps } = restProps as Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      "type"
    > & { children: React.ReactNode };
    return (
      <select className={cn(baseStyles, className)} {...selectProps}>
        {children}
      </select>
    );
  }

  const inputProps = restProps as Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  >;
  return (
    <input type="text" className={cn(baseStyles, className)} {...inputProps} />
  );
}
```

The polymorphic `Input` component is well-designed, though the TypeScript discriminated union could be improved.

### Areas for Improvement

- The `Input` component's type system is complex and could benefit from a simpler approach (e.g., separate components or a factory pattern)
- Some prop drilling occurs (e.g., `dispatch` passed through multiple layers), though this is acceptable for the scope

---

## 2. Handling Dynamic Form Fields ⭐⭐⭐⭐⭐

### Strengths

**Excellent reducer pattern for complex state:**

```18:134:src/lib/questionsReducer.ts
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
```

The reducer handles all dynamic form operations cleanly. The `changeType` action intelligently initializes options when switching to multiple choice.

**Dynamic option management:**

```185:241:src/components/QuestionCard.tsx
        {question.type === "multipleChoice" && (
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {question.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <label htmlFor={`option-${option.id}`} className="sr-only">
                    Option {index + 1}
                  </label>
                  <Input
                    type="text"
                    id={`option-${option.id}`}
                    value={option.text}
                    onChange={(e) =>
                      handleOptionTextChange(option.id, e.target.value)
                    }
                    onFocus={onSelect}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                    aria-describedby={`option-${option.id}-description`}
                  />
                  <span
                    id={`option-${option.id}-description`}
                    className="sr-only"
                  >
                    Text for option {index + 1} in this multiple choice question
                  </span>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(option.id);
                    }}
                    aria-label="Remove option"
                    className="text-zinc-600 hover:text-red-600"
                  >
                    <XIcon className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddOption();
                }}
                aria-label="Add option"
                className="text-left hover:text-green-600"
              >
                + Add option
              </Button>
            </div>
          </div>
        )}
```

Clean implementation with proper event handling (stopPropagation) and accessibility considerations.

**Type change handling:**

```101:107:src/app/page.tsx
  const handleTypeChange = (questionId: string) => {
    setResponses((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };
```

Smart cleanup of responses when question type changes.

### Areas for Improvement

- No minimum option validation (could prevent removing the last option)
- Could add drag-and-drop for option reordering (though not required)

---

## 3. Practical State Modeling ⭐⭐⭐⭐⭐

### Strengths

**Appropriate state management choices:**

- `useReducer` for complex questions state (perfect fit)
- `useState` for simple UI state (sidebar, tabs, drawer)
- Separate `responses` state for preview (clean separation)

```20:28:src/app/page.tsx
  const [questions, dispatch] = useReducer(
    questionsReducer,
    createInitialQuestions()
  );
  const [responses, setResponses] = useState<SurveyResponse>({});
  const [selectedQuestionId, setSelectedQuestionId] = useState<
    string | undefined
  >(questions.length > 0 ? questions[0].id : undefined);
  const [validationError, setValidationError] = useState<string | null>(null);
```

**Smart derived state:**

```30:39:src/app/page.tsx
  const validSelectedQuestionId = useMemo(() => {
    if (questions.length === 0) {
      return undefined;
    }
    const selectedExists = questions.some((q) => q.id === selectedQuestionId);
    if (selectedExists) {
      return selectedQuestionId;
    }
    return questions[0]?.id;
  }, [questions, selectedQuestionId]);
```

This prevents stale selection when questions are deleted.

**Type safety:**

```1:25:src/lib/types.ts
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
```

Clear, well-defined types that prevent bugs.

**Validation integration:**

```41:56:src/app/page.tsx
  const handleAddQuestion = () => {
    if (questions.length > 0) {
      const invalidQuestion = questions.find((q) => !isQuestionValid(q));
      if (invalidQuestion) {
        setValidationError(
          "Please fill in all fields for all questions before adding a new one."
        );
        setTimeout(() => setValidationError(null), 3000);
        return;
      }
    }
    setValidationError(null);
    const newQuestionId = crypto.randomUUID();
    dispatch({ type: "addQuestion", questionId: newQuestionId });
    setSelectedQuestionId(newQuestionId);
  };
```

Practical validation that prevents invalid state.

### Areas for Improvement

- The `setTimeout` for validation error dismissal is a bit crude; could use a more robust solution
- Could add optimistic updates or undo/redo (though beyond scope)

---

## 4. Code Clarity and Maintainability ⭐⭐⭐⭐

### Strengths

**Excellent naming:**

- Component names are descriptive (`QuestionCard`, `PreviewArea`, `BuilderArea`)
- Functions are clear (`handleAddQuestion`, `handleTypeChange`)
- Types are well-named (`QuestionAction`, `SurveyResponse`)

**Good file organization:**

```
src/
  app/          # Next.js app router
  components/   # React components
    ui/         # Reusable UI primitives
    icons/      # Icon components
  lib/          # Business logic, types, utilities
```

**Clear separation of concerns:**

- Business logic in `lib/` (reducer, validation, schemas)
- UI components in `components/`
- Types centralized in `lib/types.ts`

**Helpful utility functions:**

```1:13:src/lib/questionUtils.ts
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
```

Small, focused utilities that improve readability.

**Comprehensive validation:**

```1:16:src/lib/validation.ts
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
```

Simple, testable validation logic.

**Zod schemas for runtime validation:**

```1:33:src/lib/schemas.ts
import { z } from "zod";
import { Question, QuestionType } from "./types";

export const ChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const QuestionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["text", "multipleChoice"]),
    required: z.boolean(),
    options: z.array(ChoiceOptionSchema),
  })
  .refine(
    (data) => {
      if (data.type === "multipleChoice") {
        return data.options.length > 0;
      }
      return true;
    },
    {
      message: "Multiple choice questions must have at least one option",
      path: ["options"],
    }
  );

export const SurveyDefinitionSchema = z.object({
  questions: z.array(QuestionSchema),
});
```

Excellent use of Zod for runtime validation and type safety.

**Accessibility considerations:**

```121:140:src/components/QuestionCard.tsx
          <label
            htmlFor={`label-${question.id}`}
            className="block text-sm font-medium text-zinc-900 mb-2"
          >
            Question Label
          </label>
          <Input
            type="text"
            id={`label-${question.id}`}
            value={question.label}
            onChange={handleLabelChange}
            onFocus={onSelect}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter question text..."
            aria-describedby={`label-${question.id}-description`}
          />
          <span id={`label-${question.id}-description`} className="sr-only">
            Enter the text that will be displayed for this question
          </span>
```

Good accessibility practices with proper labels and ARIA attributes.

### Areas for Improvement

- Some components are getting large (`QuestionCard` at 246 lines); could extract option management into a separate component
- The README is excellent, but inline code comments are minimal (though code is self-documenting)
- Error handling could be more robust (e.g., clipboard API failures)

---

## 5. Ability to Make the UI Extensible ⭐⭐⭐⭐⭐

### Strengths

**Excellent extensibility patterns:**

**1. Question type system is extensible:**

```1:14:src/lib/types.ts
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
```

Adding a new question type would require:

- Adding to `QuestionType` union
- Extending reducer's `changeType` case
- Adding rendering logic in `PreviewQuestion`
- Minimal changes elsewhere

**2. Component composition allows easy extension:**

```43:53:src/components/BuilderArea.tsx
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            isSelected={selectedQuestionId === question.id}
            dispatch={dispatch}
            onSelect={() => onSelectQuestion(question.id)}
            onDelete={() => onDeleteQuestion(question.id)}
            onTypeChange={onTypeChange}
          />
        ))}
```

The map pattern makes it easy to add question-specific rendering or filtering.

**3. Reducer pattern scales well:**

```3:16:src/lib/questionsReducer.ts
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
```

New actions can be added without breaking existing code.

**4. Responsive design pattern is extensible:**

```52:97:src/components/ResponsiveLayout.tsx
  return (
    <div
      className={`flex-1 flex overflow-hidden relative ${
        isJsonDrawerOpen ? "pb-0" : ""
      }`}
    >
      <div className="md:hidden flex-1 flex flex-col">
        <MobileLayout
          activeTab={activeTab}
          onTabChange={onTabChange}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={onCloseSidebar}
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={onSelectQuestion}
          onAddQuestion={onAddQuestion}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          dispatch={dispatch}
          onDeleteQuestion={onDeleteQuestion}
          onTypeChange={onTypeChange}
          responses={responses}
          onResponseChange={onResponseChange}
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col">
        <DesktopLayout
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={onSelectQuestion}
          onAddQuestion={onAddQuestion}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          dispatch={dispatch}
          onDeleteQuestion={onDeleteQuestion}
          onTypeChange={onTypeChange}
          responses={responses}
          onResponseChange={onResponseChange}
          isJsonDrawerOpen={isJsonDrawerOpen}
          onToggleJsonDrawer={onToggleJsonDrawer}
        />
      </div>
    </div>
  );
```

The responsive pattern cleanly separates mobile and desktop concerns, making it easy to add tablet-specific layouts or new breakpoints.

**5. Validation system is extensible:**

```1:16:src/lib/validation.ts
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
```

Could easily be extended to a validation rule system per question type.

**6. Candidate's own extensibility notes:**
From the README:

> **Extensibility**: Component boundaries are intentionally clean to make adding new question types, branching logic, drag-and-drop, or backend persistence straightforward.

The candidate demonstrates awareness of extensibility needs.

### Areas for Improvement

- Could add a plugin/strategy pattern for question types (though overkill for current scope)
- Validation could be more declarative (rule-based system)

---

## Specification Compliance ✅

### Core Requirements Met

✅ **Create and edit questions**

- Add, remove, edit label, change type, toggle required

✅ **Manage options for multiple choice**

- Add, remove, edit option text

✅ **Preview the survey**

- Renders questions as respondent would see
- Indicates required questions
- Allows filling inputs
- Updates response object

✅ **View JSON representations**

- Survey definition JSON
- Survey responses JSON
- Accessible via drawer (desktop) and tab (mobile)

### Technical Requirements Met

✅ Next.js
✅ React function components and hooks
✅ Tailwind CSS
✅ Client-side only
✅ No large UI libraries (only Zod for validation)

### Bonus Features

- **Question reordering** (move up/down) - not required but excellent addition
- **Responsive design** - thoughtful mobile/desktop split
- **Validation** - prevents invalid state
- **Accessibility** - proper labels and ARIA
- **Smooth UX** - auto-scroll to selected question in preview

---

## Code Quality Observations

### Positive Patterns

1. **Consistent error handling** - Validation errors shown via banner
2. **Event propagation handled correctly** - `stopPropagation()` used appropriately
3. **Stable IDs** - Uses `crypto.randomUUID()` consistently
4. **TypeScript usage** - Strong typing throughout
5. **No prop drilling beyond necessary** - Acceptable level for this scope

### Minor Issues

1. **Input component type complexity** - The discriminated union is clever but could be simpler
2. **Some magic numbers** - e.g., `h-[40vh]` in JsonDrawer (though acceptable)
3. **Timeout-based error dismissal** - Could use a more robust solution
4. **No loading states** - Not needed for this exercise, but worth noting

---

## Interview Discussion Points

### Strong Topics to Explore

1. **Reducer design** - Why `useReducer` over `useState`? How would they scale this?
2. **Component boundaries** - How did they decide what goes in `BuilderArea` vs `QuestionCard`?
3. **Type system** - Discuss the `Input` component's type design and alternatives
4. **Extensibility** - Walk through adding a new question type (e.g., rating scale)
5. **State management** - When would they introduce Context or a state library?

### Areas to Probe

1. **Performance** - How would they optimize for 100+ questions?
2. **Testing** - What would they test? (No tests provided, but that's fine for this exercise)
3. **Error boundaries** - How would they handle runtime errors?
4. **Accessibility** - What else could be improved?

---

## Final Verdict

**Recommendation: Strong Hire** ✅

This submission demonstrates:

- ✅ Strong React fundamentals
- ✅ Good architectural thinking
- ✅ Practical state management
- ✅ Clean, maintainable code
- ✅ Extensibility awareness
- ✅ Production-ready mindset

The candidate shows they can build real features, not just follow tutorials. The codebase is well-organized, type-safe, and ready for extension. Minor improvements could be made, but the foundation is excellent.

**Estimated Time Investment:** The candidate likely spent 3-4 hours, which is appropriate for the scope. The quality suggests they worked efficiently and made thoughtful decisions rather than rushing.

**Pairing Session Readiness:** The code is clean enough to pair on immediately. Good candidates for pairing exercises:

- Add a new question type (rating scale)
- Implement drag-and-drop reordering
- Add question validation rules
- Implement undo/redo

---

## Scoring Summary

| Criterion             | Score     | Notes                                   |
| --------------------- | --------- | --------------------------------------- |
| Component Composition | 5/5       | Excellent separation, clear boundaries  |
| Dynamic Form Fields   | 5/5       | Reducer pattern handles complexity well |
| State Modeling        | 5/5       | Appropriate choices, good type safety   |
| Code Clarity          | 4/5       | Very clear, minor improvements possible |
| Extensibility         | 5/5       | Well-designed for extension             |
| **Overall**           | **4.8/5** | **Strong submission**                   |
