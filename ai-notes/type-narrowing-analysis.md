# Type Narrowing Analysis: Current Issues & Discriminated Union Solution

## Current Problems

### 1. PreviewQuestion.tsx - Defensive Type Narrowing

**Lines 36-44: Text Question Rendering**

```typescript
{question.type === "text" ? (
  <Input
    type="textarea"
    value={typeof value === "string" ? value : ""}  // ⚠️ Defensive check needed
    onChange={(e) => onChange(e.target.value)}
    // ...
  />
) : (
  // Multiple choice rendering
)}
```

**Problem:** The `value` prop is typed as `string | MultipleChoiceResponse | undefined`, so even though we've checked `question.type === "text"`, TypeScript doesn't know that `value` must be a string. We need a runtime `typeof` check.

**Lines 47-52: Multiple Choice Response Checking**

```typescript
{
  question.options.map((option) => {
    const isSelected =
      typeof value === "object" &&
      value !== null &&
      "optionId" in value &&
      value.optionId === option.id;
    // ...
  });
}
```

**Problem:** Complex runtime type narrowing because TypeScript can't guarantee the relationship between `question.type` and `value` type.

### 2. QuestionCard.tsx - Runtime Type Guards

**Line 185: Conditional Options Rendering**

```typescript
{question.type === "multipleChoice" && (
  <div>
    {question.options.map((option) => (
      // TypeScript allows question.options here even for text questions!
    ))}
  </div>
)}
```

**Problem:** TypeScript doesn't prevent accessing `question.options` on text questions. The runtime check is necessary but not enforced by the type system.

### 3. Reducer - Unsafe Option Access

**Lines 58, 84-90, 94-103: Option Operations**

```typescript
// questionsReducer.ts
if (action.newType === "multipleChoice" && q.options.length === 0) {
  // ⚠️ q.options exists on ALL questions, even text
}

case "addOption":
  return state.map((q) =>
    q.id === action.questionId
      ? {
          ...q,
          options: [...q.options, ...],  // ⚠️ Can be called on text questions!
        }
      : q
  );
```

**Problem:** The reducer can perform option operations on text questions. There's no compile-time protection.

### 4. Type System Root Cause

**Current Definition (types.ts):**

```typescript
export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options: ChoiceOption[]; // ⚠️ Present on ALL questions, even text
}
```

**The Core Issue:**

- `options` exists on all questions, even when it shouldn't
- TypeScript can't distinguish between question types at compile time
- All type narrowing is runtime-based (if/else checks)
- No compile-time safety for type-specific operations

## Solution: Discriminated Union

### Step 1: Refactor Type Definitions

```typescript
// src/lib/types.ts

export type QuestionType = "text" | "multipleChoice";

export interface ChoiceOption {
  id: string;
  text: string;
}

// Base properties shared by all question types
interface BaseQuestion {
  id: string;
  label: string;
  required: boolean;
}

// Text question - NO options property
export interface TextQuestion extends BaseQuestion {
  type: "text";
}

// Multiple choice question - REQUIRES options
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multipleChoice";
  options: ChoiceOption[];
}

// Discriminated union - TypeScript narrows based on 'type' field
export type Question = TextQuestion | MultipleChoiceQuestion;

// Response types can also be discriminated
export type TextResponse = string;
export type MultipleChoiceResponse = {
  optionId: string;
  optionText: string;
};

export type QuestionResponse = TextResponse | MultipleChoiceResponse;

// Helper to get response type from question type
export type ResponseForQuestion<T extends Question> = T extends TextQuestion
  ? TextResponse
  : T extends MultipleChoiceQuestion
    ? MultipleChoiceResponse
    : never;
```

### Step 2: Add Type Guards

```typescript
// src/lib/questionUtils.ts

export function isTextQuestion(question: Question): question is TextQuestion {
  return question.type === "text";
}

export function isMultipleChoiceQuestion(
  question: Question
): question is MultipleChoiceQuestion {
  return question.type === "multipleChoice";
}
```

### Step 3: Update PreviewQuestion with Type Safety

**Before (Current):**

```typescript
{question.type === "text" ? (
  <Input
    value={typeof value === "string" ? value : ""}  // ⚠️ Defensive check
    // ...
  />
) : (
  <div>
    {question.options.map((option) => {  // ⚠️ TypeScript doesn't guarantee options exists
      const isSelected =
        typeof value === "object" &&
        value !== null &&
        "optionId" in value &&
        value.optionId === option.id;
      // ...
    })}
  </div>
)}
```

**After (With Discriminated Union):**

```typescript
// Option 1: Using type guards (explicit)
if (isTextQuestion(question)) {
  // TypeScript knows: question is TextQuestion, value should be string
  return (
    <Input
      type="textarea"
      value={typeof value === "string" ? value : ""}  // Still needed for undefined, but clearer
      onChange={(e) => onChange(e.target.value)}
      // ...
    />
  );
}

if (isMultipleChoiceQuestion(question)) {
  // TypeScript knows: question is MultipleChoiceQuestion, question.options exists
  return (
    <div className="space-y-2">
      {question.options.map((option) => {
        // TypeScript knows value should be MultipleChoiceResponse
        const isSelected =
          typeof value === "object" &&
          value !== null &&
          "optionId" in value &&
          value.optionId === option.id;
        // ...
      })}
    </div>
  );
}

// Option 2: Using switch (exhaustive checking)
switch (question.type) {
  case "text":
    // TypeScript narrows to TextQuestion
    return <Input ... />;

  case "multipleChoice":
    // TypeScript narrows to MultipleChoiceQuestion
    // question.options is guaranteed to exist
    return <div>{question.options.map(...)}</div>;

  default:
    // TypeScript ensures all cases are handled
    const _exhaustive: never = question;
    return null;
}
```

**Better: Type-safe value handling**

```typescript
// We can create a helper that matches question type to response type
function getResponseValue(
  question: Question,
  value: QuestionResponse | undefined
): string | MultipleChoiceResponse | undefined {
  if (isTextQuestion(question)) {
    return typeof value === "string" ? value : undefined;
  }
  if (isMultipleChoiceQuestion(question)) {
    return typeof value === "object" && value !== null && "optionId" in value
      ? value
      : undefined;
  }
  return undefined;
}
```

### Step 4: Update QuestionCard with Type Safety

**Before (Current):**

```typescript
{question.type === "multipleChoice" && (
  <div>
    {question.options.map((option) => (
      // ⚠️ TypeScript doesn't prevent accessing options on text questions
    ))}
  </div>
)}
```

**After (With Discriminated Union):**

```typescript
{isMultipleChoiceQuestion(question) && (
  <div>
    {question.options.map((option) => (
      // ✅ TypeScript guarantees question.options exists here
      // ✅ Can't accidentally access options on text questions
    ))}
  </div>
)}
```

### Step 5: Update Reducer with Type Safety

**Before (Current):**

```typescript
case "addOption":
  return state.map((q) =>
    q.id === action.questionId
      ? {
          ...q,
          options: [...q.options, { id: crypto.randomUUID(), text: "" }],
          // ⚠️ Can be called on text questions!
        }
      : q
  );
```

**After (With Discriminated Union):**

```typescript
case "addOption":
  return state.map((q) => {
    if (q.id !== action.questionId) return q;

    // ✅ Type guard ensures we only operate on multiple choice questions
    if (!isMultipleChoiceQuestion(q)) {
      console.warn("Cannot add option to non-multiple-choice question");
      return q;
    }

    return {
      ...q,  // TypeScript knows q is MultipleChoiceQuestion here
      options: [...q.options, { id: crypto.randomUUID(), text: "" }],
    };
  });
```

**Or better: Type-safe action creation**

```typescript
// Only allow addOption for multiple choice questions
export type QuestionAction =
  | { type: "addQuestion"; questionId?: string }
  | { type: "removeQuestion"; id: string }
  | {
      type: "updateQuestion";
      id: string;
      patch: { label?: string; required?: boolean };
    }
  | { type: "changeType"; id: string; newType: QuestionType }
  | {
      type: "addOption";
      questionId: string;
      // Could add validation that question is multiple choice
    };
// ...
```

### Step 6: Factory Functions for Type Safety

```typescript
// src/lib/questionFactories.ts

export function createTextQuestion(
  id: string,
  overrides?: Partial<Omit<TextQuestion, "id" | "type">>
): TextQuestion {
  return {
    id,
    type: "text",
    label: "",
    required: false,
    ...overrides,
  };
}

export function createMultipleChoiceQuestion(
  id: string,
  overrides?: Partial<Omit<MultipleChoiceQuestion, "id" | "type">>
): MultipleChoiceQuestion {
  return {
    id,
    type: "multipleChoice",
    label: "",
    required: false,
    options: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    ...overrides,
  };
}

// Usage in reducer:
case "addQuestion":
  return [
    ...state,
    createTextQuestion(action.questionId || crypto.randomUUID()),
  ];

case "changeType":
  return state.map((q) => {
    if (q.id !== action.id) return q;

    if (action.newType === "multipleChoice") {
      // Preserve options if already multiple choice
      const existingOptions = isMultipleChoiceQuestion(q)
        ? q.options
        : undefined;

      return createMultipleChoiceQuestion(q.id, {
        label: q.label,
        required: q.required,
        options: existingOptions,
      });
    }

    if (action.newType === "text") {
      return createTextQuestion(q.id, {
        label: q.label,
        required: q.required,
      });
    }

    return q;
  });
```

## Benefits of Discriminated Union Approach

### 1. Compile-Time Safety

- ✅ TypeScript prevents accessing `options` on text questions
- ✅ Type narrowing is automatic and guaranteed
- ✅ Exhaustive checking in switch statements
- ✅ No accidental type mismatches

### 2. Better Developer Experience

- ✅ Autocomplete knows which properties exist
- ✅ Type errors catch bugs before runtime
- ✅ Self-documenting code (types show intent)
- ✅ Refactoring is safer (TypeScript catches breaking changes)

### 3. Extensibility Foundation

**Adding a new question type becomes type-safe:**

```typescript
// Add rating question type
export interface RatingQuestion extends BaseQuestion {
  type: "rating";
  min: number;
  max: number;
  step?: number;
}

// Update union
export type Question = TextQuestion | MultipleChoiceQuestion | RatingQuestion;

// TypeScript will now require handling this case everywhere:
switch (question.type) {
  case "text":
    // ...
  case "multipleChoice":
    // ...
  case "rating":
    // ✅ TypeScript forces you to handle this
    return <RatingInput min={question.min} max={question.max} />;
  default:
    const _exhaustive: never = question;  // ✅ Compile error if case missing
}
```

**This aligns with your extensibility plan:**

- Plugin architecture becomes type-safe
- New question types are caught at compile time
- Registry pattern works better with discriminated unions
- Each question type can have its own response type

### 4. Cleaner Component Code

**PreviewQuestion becomes:**

```typescript
export default function PreviewQuestion({
  question,
  value,
  onChange,
}: PreviewQuestionProps) {
  // Type-safe rendering based on question type
  switch (question.type) {
    case "text":
      return <TextQuestionPreview question={question} value={value} onChange={onChange} />;

    case "multipleChoice":
      return <MultipleChoicePreview question={question} value={value} onChange={onChange} />;

    default:
      const _exhaustive: never = question;
      return null;
  }
}
```

**Or with registry pattern (from extensibility plan):**

```typescript
export default function PreviewQuestion({ question, value, onChange }: PreviewQuestionProps) {
  const typeDef = questionTypeRegistry.get(question.type);
  const PreviewComponent = typeDef.previewComponent;

  // TypeScript ensures question matches the component's expected type
  return <PreviewComponent question={question} value={value} onChange={onChange} />;
}
```

## Migration Strategy

### Phase 1: Add Discriminated Union Types (Non-Breaking)

1. Add `TextQuestion` and `MultipleChoiceQuestion` interfaces alongside `Question`
2. Create type guards
3. Create factory functions
4. Keep existing `Question` type as union type

### Phase 2: Update Components Gradually

1. Update `PreviewQuestion` to use type guards
2. Update `QuestionCard` to use type guards
3. Update reducer to use factory functions
4. Update validation to use type guards

### Phase 3: Remove Old Patterns

1. Remove defensive type checks where no longer needed
2. Add exhaustive checking in switch statements
3. Update tests to use factory functions

## Key Takeaways

1. **Current Issue:** The `options` property on all questions creates a type safety gap
2. **Root Cause:** Single interface instead of discriminated union
3. **Solution:** Discriminated union with type guards and factory functions
4. **Impact:**
   - Compile-time safety instead of runtime checks
   - Better extensibility foundation
   - Cleaner, more maintainable code
   - Aligns with extensibility plan's plugin architecture

5. **For Interview Discussion:**
   - Acknowledge the pragmatic trade-off made initially
   - Show understanding of discriminated unions
   - Explain when you'd refactor (adding more types, type safety issues)
   - Demonstrate how this enables the extensibility plan
