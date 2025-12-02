# Code Walkthrough Guide: Survey Builder

**Purpose:** This document helps you systematically walk through your codebase for the interview. Use it to prepare explanations, identify key talking points, and track questions.

**How to use:**

1. Read through each section
2. Review the referenced code
3. Practice explaining each part out loud
4. Write questions in the "Questions" sections
5. Use this as your reference during the interview

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Entry Point & State Management](#entry-point--state-management)
3. [Core Data Structures](#core-data-structures)
4. [State Management: Reducer Pattern](#state-management-reducer-pattern)
5. [Component Hierarchy](#component-hierarchy)
6. [Key User Flows](#key-user-flows)
7. [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)
8. [Extension Points](#extension-points)
9. [Questions & Discussion Points](#questions--discussion-points)

---

## High-Level Architecture

### Overview

The application follows a **component-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         page.tsx (Root)                 │
│  - State management (reducer + hooks)   │
│  - Event handlers                        │
│  - Validation logic                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      ResponsiveLayout                   │
│  - Mobile/Desktop layout switching      │
└──────┬──────────────────┬───────────────┘
       │                  │
       ▼                  ▼
┌──────────────┐  ┌──────────────────────┐
│ MobileLayout │  │   DesktopLayout      │
└──────────────┘  └──────────────────────┘
       │                  │
       └────────┬─────────┘
                ▼
    ┌───────────────────────┐
    │   BuilderArea          │
    │   PreviewArea          │
    │   QuestionSidebar      │
    │   JsonPanel/Drawer     │
    └───────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**
   - Business logic in `lib/` (reducer, validation, types)
   - UI components in `components/`
   - State management at the root level

2. **Component Composition**
   - Small, focused components
   - Props-based communication
   - Clear component boundaries

3. **Type Safety**
   - TypeScript throughout
   - Zod schemas for runtime validation
   - Discriminated unions for type narrowing

---

## Entry Point & State Management

### File: `src/app/page.tsx`

**Purpose:** Root component that manages all application state and coordinates between components.

**Key Responsibilities:**

- Managing questions state with `useReducer`
- Managing preview responses with `useState`
- Handling UI state (tabs, sidebar, drawer)
- Coordinating event handlers
- Validation logic

**Salient Code Sections:**

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

**Why this matters:**

- `useReducer` for complex questions state (multiple action types, interdependent updates)
- Separate `responses` state for preview (ephemeral vs persistent data)
- `selectedQuestionId` for UI state (which question is being edited)

**Derived State Pattern:**

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

**Why this matters:**

- Prevents stale references when questions are deleted
- Always ensures a valid selection or falls back to first question
- Example of defensive programming

**Key Event Handlers:**

1. **Adding Questions** (lines 41-56)
   - Validates all existing questions before allowing new ones
   - Creates new question with UUID
   - Auto-selects the new question

2. **Deleting Questions** (lines 58-69)
   - Handles selection cleanup when deleting selected question
   - Falls back to first remaining question

3. **Type Changes** (lines 101-107)
   - Cleans up responses when question type changes
   - Prevents invalid response state

**Questions:**

- [ ] Your question here
- [ ] Your question here

---

## Core Data Structures

### File: `src/lib/types.ts`

**Purpose:** Central type definitions for the entire application.

**Key Types:**

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

**Design Decisions:**

1. **Union Type vs Enum**
   - Used `type QuestionType = "text" | "multipleChoice"` instead of enum
   - Simpler, more idiomatic TypeScript
   - Easy to extend (just add to union)

2. **Options Array for All Questions**
   - `options: ChoiceOption[]` exists on all questions
   - Ignored for text questions (documented in comment)
   - Alternative: discriminated union, but this is simpler

3. **Response Type Design**
   - `SurveyResponse` uses `Record<string, ...>` for O(1) lookups
   - Union type `string | MultipleChoiceResponse` for type safety
   - Multiple choice stores both `optionId` and `optionText` for display

**Questions:**

- [ ] Your question here
- [ ] Your question here

---

## State Management: Reducer Pattern

### File: `src/lib/questionsReducer.ts`

**Purpose:** Centralized state management for all question operations using the reducer pattern.

**Why Reducer Instead of useState?**

- **Complex state updates:** Multiple interdependent operations
- **Predictable state transitions:** All updates go through one function
- **Scalability:** Easy to add new action types
- **Testability:** Pure function, easy to test
- **Future-proof:** Foundation for undo/redo, time-travel debugging

**Action Types:**

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

**Key Reducer Cases:**

1. **`changeType`** (lines 48-75)
   - Most complex case
   - Initializes 2 empty options when switching to multiple choice
   - Clears options when switching to text
   - Why 2 options? Good UX - gives user a starting point

2. **`updateQuestion`** (lines 38-46)
   - Uses patch pattern instead of full replacement
   - Only updates specified fields
   - Immutable update pattern

3. **`moveUp`/`moveDown`** (lines 109-129)
   - Array destructuring swap pattern
   - Boundary checks (can't move first item up, last item down)
   - Returns state unchanged if invalid move

**Initial State:**

```136:154:src/lib/questionsReducer.ts
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
```

**Why stable IDs?**

- Prevents hydration mismatches in Next.js
- SSR generates one ID, client generates another → mismatch
- Production would use deterministic hashing

**Questions:**

- [ ] Your question here
- [ ] Your question here

---

## Component Hierarchy

### Component Structure

```
page.tsx (Root)
├── Header
├── ValidationBanner
└── ResponsiveLayout
    ├── MobileLayout
    │   ├── Tabs (Build/Preview/JSON)
    │   ├── BuilderArea (when Build tab)
    │   ├── PreviewArea (when Preview tab)
    │   └── JsonPanel (when JSON tab)
    └── DesktopLayout
        ├── QuestionSidebar
        ├── BuilderArea / PreviewArea (split view)
        └── JsonDrawer (bottom panel)
```

### Key Components

#### 1. `BuilderArea` (`src/components/BuilderArea.tsx`)

**Purpose:** Container for the list of question cards in builder mode.

**Key Features:**

- Empty state handling
- Maps questions to `QuestionCard` components
- "Add question" button at bottom

**Design Pattern:**

- Receives only what it needs via props
- Doesn't know about reducer directly (receives `dispatch`)
- Clean separation: list management vs individual question editing

#### 2. `QuestionCard` (`src/components/QuestionCard.tsx`)

**Purpose:** Individual question editor with collapsed/expanded states.

**Key Features:**

- **Collapsed state:** Shows label, type, required status
- **Expanded state:** Full editing interface
- **Conditional rendering:** Only shows options UI for multiple choice
- **Event handling:** `stopPropagation()` to prevent card selection when clicking inputs

**Salient Code:**

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

**Why this pattern?**

- Early return for collapsed state keeps code clean
- Avoids deeply nested conditionals
- Clear visual distinction between states

**Options Management:**

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

**Key Points:**

- Conditional rendering based on question type
- `stopPropagation()` prevents card selection when interacting with inputs
- Accessibility: proper labels and ARIA attributes
- Uses `option.id` as key (stable, unique)

#### 3. `ResponsiveLayout` (`src/components/ResponsiveLayout.tsx`)

**Purpose:** Smart container that delegates to mobile or desktop layouts based on screen size.

**Key Pattern:**

- Uses CSS classes (`md:hidden`, `hidden md:flex`) for responsive switching
- Delegates all props to child layouts
- No business logic, just routing

**Why this pattern?**

- Clean separation: mobile and desktop can have completely different UIs
- Easy to test each layout independently
- Can add tablet-specific layout later
- Props flow through cleanly

**Salient Code:**

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

**Design Decision:**

- Mobile uses tabs (Build/Preview/JSON)
- Desktop uses split view (Builder + Preview) with sidebar
- Different UX patterns for different screen sizes

#### 4. `PreviewQuestion` (`src/components/PreviewQuestion.tsx`)

**Purpose:** Renders a question as a respondent would see it.

**Key Features:**

- Type-specific rendering (text vs multiple choice)
- Required indicator
- Updates response state
- Highlighted when selected (for scroll-to behavior)

**Type Narrowing:**

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

**Type Safety:**

- TypeScript narrows `question.type` in each branch
- Runtime type checking for `value` (string vs object)
- Type guard: `"optionId" in value` ensures it's `MultipleChoiceResponse`

#### 5. Validation (`src/lib/validation.ts`)

**Purpose:** Type-specific validation logic for questions.

**Key Function:**

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

**Validation Rules:**

1. **All questions:** Must have non-empty label
2. **Multiple choice:** Must have at least one option
3. **Multiple choice:** All options must have non-empty text

**Design:**

- Simple, testable function
- Type-specific logic (could be extended to rule-based system)
- Returns boolean (could return error details for better UX)

**Usage:**

- Called before allowing new questions
- Prevents invalid state accumulation
- Could be called on blur for inline validation

**Questions:**

- [ ] Your question here
- [ ] Your question here

---

## Key User Flows

### Flow 1: Adding a Question

**Path:** User clicks "Add question" → Validation → Dispatch → State update → Re-render

1. **User Action:** Click "Add question" button
2. **Handler:** `handleAddQuestion()` in `page.tsx` (lines 41-56)
3. **Validation:** Checks all existing questions are valid
4. **Dispatch:** `dispatch({ type: "addQuestion", questionId: newId })`
5. **Reducer:** `questionsReducer` adds new question to array
6. **State Update:** `questions` array updates
7. **Re-render:** `BuilderArea` renders new `QuestionCard`
8. **Auto-select:** New question is automatically selected

**Key Code:**

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

**Why validate before adding?**

- Prevents accumulation of invalid questions
- Encourages completion
- Better UX (user knows what's wrong)

### Flow 2: Changing Question Type

**Path:** User selects new type → Type change handler → Response cleanup → Reducer → State update

1. **User Action:** Select new type from dropdown
2. **Handler:** `handleTypeChange()` in `QuestionCard` (lines 37-47)
3. **Response Cleanup:** `onTypeChange?.(question.id)` in `page.tsx` (lines 101-107)
4. **Dispatch:** `dispatch({ type: "changeType", id, newType })`
5. **Reducer:** `changeType` case (lines 48-75)
   - If switching to multiple choice: initializes 2 empty options
   - If switching to text: clears options
6. **State Update:** Question type and options update
7. **Re-render:** `QuestionCard` shows/hides options UI

**Key Code:**

```48:75:src/lib/questionsReducer.ts
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
```

**Why initialize 2 options?**

- Better UX: user has a starting point
- Common pattern: most multiple choice questions have at least 2 options
- User can remove if not needed

### Flow 3: Preview and Response

**Path:** User switches to preview → Renders questions → User interacts → Response state updates

1. **User Action:** Switch to Preview tab
2. **Render:** `PreviewArea` maps questions to `PreviewQuestion`
3. **User Input:** Types text or selects option
4. **Handler:** `onChange` in `PreviewQuestion`
5. **State Update:** `handleResponseChange()` in `page.tsx` (lines 91-99)
6. **JSON Update:** `JsonPanel` shows updated responses

**Key Code:**

```91:99:src/app/page.tsx
  const handleResponseChange = (
    questionId: string,
    value: string | MultipleChoiceResponse
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };
```

**Why separate responses state?**

- Ephemeral: responses are just for preview
- Can be reset without affecting questions
- Clear separation: questions = definition, responses = data

**Questions:**

- [ ] Your question here
- [ ] Your question here

---

## Design Decisions & Tradeoffs

### 1. Reducer vs useState

**Decision:** Used `useReducer` for questions state

**Pros:**

- Centralized logic
- Predictable state transitions
- Easy to extend with new actions
- Foundation for undo/redo

**Cons:**

- More boilerplate than `useState`
- Slightly more complex for simple updates

**When to use each:**

- `useReducer`: Complex state, multiple update types, interdependent updates
- `useState`: Simple state, independent updates

**Alternative considered:** Context API

- Rejected: Prop drilling is minimal (2-3 levels), acceptable for this scope
- Would consider if: More nested components, multiple reducers, or shared state across distant components

### 2. Separate Responses State

**Decision:** Separate `responses` state from `questions` state

**Pros:**

- Clear separation: definition vs data
- Can reset responses without affecting questions
- Easier to reason about

**Cons:**

- Two state variables to manage
- Need to keep them in sync (e.g., delete response when question deleted)

**Alternative considered:** Store responses in questions

- Rejected: Mixes concerns, responses are ephemeral preview data

### 3. Options Array on All Questions

**Decision:** `options: ChoiceOption[]` exists on all questions, ignored for text

**Pros:**

- Simpler type system
- No discriminated union needed
- Easy to check: `if (question.type === "multipleChoice")`

**Cons:**

- Wasted memory (minimal)
- Type system doesn't prevent accessing options on text questions

**Alternative considered:** Discriminated union

```typescript
type Question =
  | { type: "text"; ... }
  | { type: "multipleChoice"; options: ChoiceOption[]; ... }
```

- Rejected: More complex, harder to work with, not worth it for 2 types

### 4. Validation Timing

**Decision:** Validate before allowing new questions

**Pros:**

- Prevents accumulation of invalid state
- User knows what's wrong immediately
- Encourages completion

**Cons:**

- Can be annoying if user wants to add multiple questions quickly
- Blocks workflow

**Alternative considered:** Validate on save/submit

- Rejected: For this exercise, keeping questions valid is better UX

### 5. Polymorphic Input Component

**Decision:** Single `Input` component that handles text, textarea, and select

**Pros:**

- Consistent styling
- Single API
- Type-safe with discriminated union

**Cons:**

- Complex type system
- Could be simpler with separate components

**Alternative considered:** Separate components (`TextInput`, `Textarea`, `Select`)

- Rejected: Wanted consistent API and styling, but this is a valid alternative

**Questions:**

- [ ] Your question here
- [ ] Your question here

---

## Extension Points

### How to Add a New Question Type

**Steps:**

1. **Add to type union:**

   ```typescript
   export type QuestionType = "text" | "multipleChoice" | "rating";
   ```

2. **Update reducer's `changeType` case:**

   ```typescript
   if (action.newType === "rating") {
     return { ...q, type: action.newType, options: [] };
   }
   ```

3. **Add rendering in `QuestionCard`:**

   ```typescript
   {question.type === "rating" && (
     <div>
       {/* Rating-specific builder UI */}
     </div>
   )}
   ```

4. **Add rendering in `PreviewQuestion`:**

   ```typescript
   {question.type === "rating" ? (
     <div>{/* Rating stars UI */}</div>
   ) : question.type === "text" ? (
     // ...
   )}
   ```

5. **Update validation:**

   ```typescript
   if (question.type === "rating") {
     // Rating-specific validation
   }
   ```

6. **Update Zod schema:**
   ```typescript
   type: z.enum(["text", "multipleChoice", "rating"]);
   ```

**Current Limitations:**

- Type logic scattered across multiple files
- Need to update 5+ places
- Not truly pluggable

**Future Improvement:**

- Plugin/registry system (see `extensibility-plan.md`)
- Single registration point
- Automatic UI generation

### How to Add Drag-and-Drop

**Approach:**

1. **Option A: Library (react-beautiful-dnd, dnd-kit)**
   - Pros: Battle-tested, handles edge cases
   - Cons: Additional dependency, learning curve

2. **Option B: Custom implementation**
   - Pros: Full control, no dependencies
   - Cons: More code, need to handle edge cases

**Integration:**

- Replace `moveUp`/`moveDown` actions with `reorder` action
- Reducer handles array reordering
- Components handle drag/drop UI

### How to Add Undo/Redo

**Approach:**

1. **Extend reducer pattern:**

   ```typescript
   interface State {
     questions: Question[];
     history: Question[][];
     historyIndex: number;
   }
   ```

2. **Store snapshots:**
   - Before each action, save current state to history
   - Limit history size (e.g., 50 actions)

3. **Undo/Redo actions:**
   ```typescript
   case "undo": {
     if (state.historyIndex > 0) {
       return {
         ...state,
         questions: state.history[state.historyIndex - 1],
         historyIndex: state.historyIndex - 1,
       };
     }
     return state;
   }
   ```

**Alternative:** Use library (Zustand with history middleware, Immer with patches)

**Questions:**

- [ ] Your question here
- [ ] Your question here

---

## Questions & Discussion Points

### For You to Prepare

**About Architecture:**

- [ ] Why did you choose reducer over Context API?
- [ ] How would you scale this for 100+ questions?
- [ ] When would you introduce a state management library?

**About Implementation:**

- [ ] Why initialize 2 options when switching to multiple choice?
- [ ] How would you add minimum option validation?
- [ ] What's your approach to error handling?

**About Extensibility:**

- [ ] How would you add a new question type?
- [ ] How would you implement drag-and-drop?
- [ ] How would you add conditional logic?

**About Tradeoffs:**

- [ ] What would you do differently with more time?
- [ ] What are the limitations of the current approach?
- [ ] How would you improve the Input component?

### For the Interviewer

**Clarifying Questions:**

- [ ] What's the scope of changes we'll be making?
- [ ] Are there any constraints I should be aware of?
- [ ] Should we focus on functionality or polish?

**Technical Questions:**

- [ ] How does this fit into the larger system?
- [ ] Are there any performance requirements?
- [ ] What's the team's approach to state management?

---

## Quick Reference: Key Files

| File                                 | Purpose                          | Key Concepts                           |
| ------------------------------------ | -------------------------------- | -------------------------------------- |
| `src/app/page.tsx`                   | Root component, state management | useReducer, useState, event handlers   |
| `src/lib/questionsReducer.ts`        | State logic                      | Reducer pattern, immutable updates     |
| `src/lib/types.ts`                   | Type definitions                 | TypeScript types, discriminated unions |
| `src/components/QuestionCard.tsx`    | Question editor                  | Conditional rendering, event handling  |
| `src/components/PreviewQuestion.tsx` | Question preview                 | Type narrowing, response handling      |
| `src/components/BuilderArea.tsx`     | Builder container                | List management, empty states          |
| `src/lib/validation.ts`              | Validation logic                 | Type-specific validation               |
| `src/lib/schemas.ts`                 | Runtime validation               | Zod schemas                            |

---

## Practice Exercises

### Exercise 1: Explain Adding a Question

**Practice:** Walk through the flow from button click to UI update.

**Key points to cover:**

1. User clicks "Add question"
2. Validation checks all questions
3. Dispatch action with new ID
4. Reducer adds question to array
5. State updates trigger re-render
6. New QuestionCard appears
7. Auto-selected for editing

### Exercise 2: Explain Type Change

**Practice:** Walk through changing a question from text to multiple choice.

**Key points to cover:**

1. User selects new type
2. Response cleanup (delete old response)
3. Dispatch changeType action
4. Reducer initializes 2 empty options
5. State updates
6. UI shows options management
7. Preview updates to show radio buttons

### Exercise 3: Discuss Extensibility

**Practice:** Explain how you'd add a rating scale question type.

**Key points to cover:**

1. Add to type union
2. Update reducer
3. Add builder UI
4. Add preview UI
5. Update validation
6. Update schemas
7. Mention plugin system as future improvement

---

## Final Notes

**Remember:**

- Your code is strong (4.8/5 evaluation)
- You made thoughtful decisions
- Be ready to explain tradeoffs
- It's okay to say "I'd do X differently with more time"
- Focus on collaboration, not perfection

**Good luck! 🚀**
