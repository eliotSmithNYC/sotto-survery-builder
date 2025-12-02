# Reducer Refactor Plan

## Current Implementation Analysis

### Strengths

1. **Type Safety**: Excellent use of discriminated union actions with TypeScript
2. **Immutability**: All cases properly return new state arrays
3. **Clear Action Types**: Each action has a single, well-defined purpose
4. **Smart Initialization**: `changeType` intelligently initializes options when switching to multiple choice
5. **Defensive Guards**: `moveUp`/`moveDown` properly check bounds before swapping

### Areas for Improvement

#### 1. Repetitive Mapping Pattern

Many cases use the same `state.map` pattern to find and update a question:

```typescript
case "changeType":
  return state.map((q) => {
    if (q.id !== action.id) return q;
    // ... transformation logic
  });
```

**Refactor Suggestion**: Extract a helper function:

```typescript
function updateQuestion(
  state: Question[],
  id: string,
  updater: (q: Question) => Question
): Question[] {
  return state.map((q) => (q.id === id ? updater(q) : q));
}
```

This would simplify cases like:

- `updateQuestion`
- `changeType`
- `addOption`
- `updateOption`
- `removeOption`

#### 2. `changeType` Logic Clarity

The `changeType` case has nested conditionals that could be clearer:

**Current Issues:**

- The final return path is only reachable if `newType === "multipleChoice"` and options already exist (not obvious)
- Logic could be more explicit about what happens in each transition

**Refactored Version:**

```typescript
case "changeType":
  return state.map((q) => {
    if (q.id !== action.id) return q;

    if (action.newType === "multipleChoice") {
      return {
        ...q,
        type: action.newType,
        options: q.options.length > 0
          ? q.options
          : [
              { id: crypto.randomUUID(), text: "" },
              { id: crypto.randomUUID(), text: "" },
            ],
      };
    }

    // action.newType === "text"
    return {
      ...q,
      type: action.newType,
      options: [],
    };
  });
```

This makes the two possible transitions explicit and easier to understand.

#### 3. `moveUp`/`moveDown` Duplication

These cases are nearly identical and could share logic:

**Refactored Version:**

```typescript
function moveQuestion(
  state: Question[],
  id: string,
  direction: "up" | "down"
): Question[] {
  const index = state.findIndex((q) => q.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= state.length) {
    return state;
  }

  const newState = [...state];
  [newState[index], newState[targetIndex]] = [
    newState[targetIndex],
    newState[index],
  ];
  return newState;
}

// In reducer:
case "moveUp":
  return moveQuestion(state, action.id, "up");

case "moveDown":
  return moveQuestion(state, action.id, "down");
```

#### 4. Missing Validation

The reducer doesn't validate:

- Removing the last option from a multiple choice question (should prevent or handle gracefully)
- Invalid question IDs in actions (could silently fail)
- Invalid option IDs in option actions

**Suggestion**: Add validation helpers or guards:

```typescript
function validateRemoveOption(question: Question, optionId: string): boolean {
  if (question.type !== "multipleChoice") return false;
  if (question.options.length <= 1) return false;
  return question.options.some((opt) => opt.id === optionId);
}
```

#### 5. `updateQuestion` Patch Merging

The spread of `action.patch` could potentially overwrite fields unintentionally:

```typescript
case "updateQuestion":
  return state.map((q) =>
    q.id === action.id
      ? {
          ...q,
          ...action.patch,
        }
      : q
  );
```

**Current State**: This is fine for the current patch shape, but if `patch` grows, consider explicit field updates.

#### 6. Error Handling

The `default` case silently returns state. Consider logging or throwing for unexpected actions in development:

```typescript
default: {
  if (process.env.NODE_ENV === "development") {
    console.warn(`Unknown action type: ${(action as any).type}`);
  }
  return state;
}
```

## Proposed Refactored Reducer

```typescript
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

function updateQuestion(
  state: Question[],
  id: string,
  updater: (q: Question) => Question
): Question[] {
  return state.map((q) => (q.id === id ? updater(q) : q));
}

function moveQuestion(
  state: Question[],
  id: string,
  direction: "up" | "down"
): Question[] {
  const index = state.findIndex((q) => q.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= state.length) {
    return state;
  }

  const newState = [...state];
  [newState[index], newState[targetIndex]] = [
    newState[targetIndex],
    newState[index],
  ];
  return newState;
}

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
      return updateQuestion(state, action.id, (q) => ({
        ...q,
        ...action.patch,
      }));

    case "changeType":
      return updateQuestion(state, action.id, (q) => {
        if (action.newType === "multipleChoice") {
          return {
            ...q,
            type: action.newType,
            options:
              q.options.length > 0
                ? q.options
                : [
                    { id: crypto.randomUUID(), text: "" },
                    { id: crypto.randomUUID(), text: "" },
                  ],
          };
        }

        return {
          ...q,
          type: action.newType,
          options: [],
        };
      });

    case "addOption":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        options: [...q.options, { id: crypto.randomUUID(), text: "" }],
      }));

    case "updateOption":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        options: q.options.map((opt) =>
          opt.id === action.optionId ? { ...opt, text: action.text } : opt
        ),
      }));

    case "removeOption":
      return updateQuestion(state, action.questionId, (q) => ({
        ...q,
        options: q.options.filter((opt) => opt.id !== action.optionId),
      }));

    case "moveUp":
      return moveQuestion(state, action.id, "up");

    case "moveDown":
      return moveQuestion(state, action.id, "down");

    default: {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Unknown action type: ${(action as any).type}`);
      }
      return state;
    }
  }
}
```

## Benefits of Refactoring

1. **Reduced Duplication**: Helper functions eliminate repetitive mapping patterns
2. **Improved Readability**: `changeType` logic is clearer and more explicit
3. **Easier Maintenance**: Changes to update patterns only need to happen in one place
4. **Better Error Handling**: Development warnings for unexpected actions
5. **Type Safety Maintained**: All improvements preserve existing type safety

## Migration Notes

- All changes are internal to the reducer - no API changes
- Existing tests should continue to pass
- Can be done incrementally (one helper at a time)
- No breaking changes to action types or component usage
