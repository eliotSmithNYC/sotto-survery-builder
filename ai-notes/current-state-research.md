# Current Question Builder State - Research Summary

## Type System

### Current Type Definition

**File:** `src/lib/types.ts`

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

**Issues:**

- Single `Question` interface with optional `options` field
- No discriminated union - TypeScript cannot narrow types automatically
- `options` field exists on all questions but is ignored for text type
- Adding new question types requires modifying the base interface

## State Management

### Root State (`src/app/page.tsx`)

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

**State Flow:**

- `questions` managed via `useReducer` with `questionsReducer`
- `dispatch` passed down through component tree via props
- UI state (selectedQuestionId, responses, tabs) managed separately with `useState`
- No centralized state management - prop drilling throughout

### Reducer Actions (`src/lib/questionsReducer.ts`)

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

**Type Change Logic:**

```49:81:src/lib/questionsReducer.ts
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
```

**Issues:**

- Type conversion logic is implicit and hardcoded
- No type-safe factory functions
- Options handling assumes all non-text types need options
- Adding new types requires modifying reducer switch statement

## Component Architecture

### Component Hierarchy

```
page.tsx (state management)
  └── ResponsiveLayout
      ├── MobileLayout / DesktopLayout
      │   ├── BuilderArea
      │   │   └── QuestionCard (renders type-specific UI inline)
      │   └── PreviewArea
      │       └── PreviewQuestion (conditional rendering by type)
      └── QuestionSidebar
```

### QuestionCard - Builder Component

**File:** `src/components/QuestionCard.tsx`

**Type-Specific Logic:**

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

**Issues:**

- Type-specific UI rendered inline with conditional checks
- No component mapping or factory pattern
- Adding new types requires modifying this component
- Type selector hardcoded:

```158:160:src/components/QuestionCard.tsx
            <option value="text">Freeform Text</option>
            <option value="multipleChoice">Multiple Choice</option>
```

### PreviewQuestion - Preview Component

**File:** `src/components/PreviewQuestion.tsx`

**Type-Specific Logic:**

```36:79:src/components/PreviewQuestion.tsx
      {question.type === "text" ? (
        <Input
          type="textarea"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder="Type your answer here..."
          rows={4}
        />
      ) : (
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected =
              typeof value === "object" &&
              value !== null &&
              "optionId" in value &&
              value.optionId === option.id;
            return (
              <label
                key={option.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 p-2 rounded-md -ml-2"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() =>
                    onChange({
                      optionId: option.id,
                      optionText: option.text,
                    })
                  }
                  onFocus={onFocus}
                  className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                />
                <span className="text-sm text-zinc-900">
                  {option.text || "Untitled option"}
                </span>
              </label>
            );
          })}
        </div>
      )}
```

**Issues:**

- Conditional rendering based on type
- Assumes only two types (text vs everything else)
- No component mapping system

## Utility Functions

### Type Utilities (`src/lib/questionUtils.ts`)

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

**Issues:**

- Hardcoded switch-like logic
- No type guards for narrowing
- Adding types requires modifying these functions

### Validation (`src/lib/validation.ts`)

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

**Issues:**

- Type-specific validation logic inline
- Assumes text type is always valid (no additional checks)
- Adding new types requires modifying this function

## Data Flow

### State Updates

1. User interaction in `QuestionCard` → dispatches action → `questionsReducer` updates state
2. State change triggers re-render of all question cards
3. `PreviewQuestion` receives updated question prop and re-renders

### Prop Drilling

- `dispatch` function passed from `page.tsx` → `ResponsiveLayout` → `MobileLayout/DesktopLayout` → `BuilderArea` → `QuestionCard`
- `questions` array passed through same chain
- No context or state management library

## Key Problems for Extensibility

1. **No Discriminated Union**: Cannot leverage TypeScript's type narrowing
2. **Scattered Type Logic**: Type-specific code in multiple files (QuestionCard, PreviewQuestion, validation, reducer)
3. **Hardcoded Conditionals**: `if (question.type === "multipleChoice")` checks throughout
4. **No Component Mapping**: No centralized registry of question type components
5. **Unsafe Type Conversions**: Type changes in reducer are implicit and error-prone
6. **No Factory Functions**: Question creation logic duplicated
7. **No Type Guards**: Runtime type checking required everywhere
8. **Monolithic Components**: QuestionCard and PreviewQuestion handle all types inline

## Files Requiring Changes for New Types

- `src/lib/types.ts` - Add to Question interface
- `src/lib/questionsReducer.ts` - Add case to changeType switch
- `src/components/QuestionCard.tsx` - Add conditional rendering
- `src/components/PreviewQuestion.tsx` - Add conditional rendering
- `src/lib/questionUtils.ts` - Add label/tag functions
- `src/lib/validation.ts` - Add validation logic
- Any component that checks `question.type`
