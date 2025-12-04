# Question Type System: Simple Extensibility Guide

## Overview

This document outlines the simple, type-safe approach for extending question types using discriminated unions and component mapping. This solves the current type narrowing issues and makes adding new question types straightforward.

## Core Architecture

### 1. Discriminated Union Types

Each question type has its own interface, sharing only common properties:

```typescript
// src/lib/types.ts

interface BaseQuestion {
  id: string;
  label: string;
  required: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multipleChoice";
  options: ChoiceOption[];
}

// Discriminated union - TypeScript narrows based on 'type'
export type Question = TextQuestion | MultipleChoiceQuestion;
```

**Benefits:**

- ✅ Compile-time type safety
- ✅ Automatic type narrowing
- ✅ No defensive runtime checks needed
- ✅ Exhaustive checking in switch statements

### 2. Component Mapping

Simple mapping object connects question types to their components:

```typescript
// src/lib/questionTypes/index.ts

import TextQuestionBuilder from "./text/TextQuestionBuilder";
import TextQuestionPreview from "./text/TextQuestionPreview";
import MultipleChoiceQuestionBuilder from "./multipleChoice/MultipleChoiceQuestionBuilder";
import MultipleChoiceQuestionPreview from "./multipleChoice/MultipleChoiceQuestionPreview";

export const questionTypeConfig = {
  text: {
    builder: TextQuestionBuilder,
    preview: TextQuestionPreview,
    label: "Freeform Text",
    validate: (q: TextQuestion) => {
      if (!q.label.trim()) return { valid: false, errors: ["Label required"] };
      return { valid: true, errors: [] };
    },
  },
  multipleChoice: {
    builder: MultipleChoiceQuestionBuilder,
    preview: MultipleChoiceQuestionPreview,
    label: "Multiple Choice",
    validate: (q: MultipleChoiceQuestion) => {
      if (!q.label.trim()) return { valid: false, errors: ["Label required"] };
      if (q.options.length === 0)
        return { valid: false, errors: ["At least one option required"] };
      if (!q.options.every((opt) => opt.text.trim())) {
        return { valid: false, errors: ["All options must have text"] };
      }
      return { valid: true, errors: [] };
    },
  },
} as const;

export function getQuestionTypeConfig(type: QuestionType) {
  return questionTypeConfig[type];
}
```

### 3. Type Guards

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

### 4. Factory Functions

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
```

## How Components Use This

### PreviewQuestion (Router)

```typescript
// src/components/PreviewQuestion.tsx

import { getQuestionTypeConfig } from "@/lib/questionTypes";

export default function PreviewQuestion({ question, value, onChange }: PreviewQuestionProps) {
  const { preview: PreviewComponent } = getQuestionTypeConfig(question.type);

  return (
    <Card>
      <label>{question.label}</label>
      <PreviewComponent
        question={question}
        value={value}
        onChange={onChange}
      />
    </Card>
  );
}
```

### QuestionCard (Router)

```typescript
// src/components/QuestionCard.tsx

import { getQuestionTypeConfig } from "@/lib/questionTypes";
import { createTextQuestion, createMultipleChoiceQuestion } from "@/lib/questionFactories";

export default function QuestionCard({ question, dispatch }: QuestionCardProps) {
  const { builder: BuilderComponent, label: typeLabel } = getQuestionTypeConfig(question.type);

  const handleTypeChange = (newType: QuestionType) => {
    // Use factory functions for type-safe conversion
    const newQuestion = newType === "text"
      ? createTextQuestion(question.id, { label: question.label, required: question.required })
      : createMultipleChoiceQuestion(question.id, {
          label: question.label,
          required: question.required,
        });

    dispatch({ type: "changeType", id: question.id, newType, newQuestion });
  };

  return (
    <Card>
      {/* Common fields: label, required, type selector */}
      <LabelInput value={question.label} onChange={...} />
      <RequiredToggle value={question.required} onChange={...} />
      <TypeSelector value={question.type} onChange={handleTypeChange} />

      {/* Type-specific builder */}
      <BuilderComponent
        question={question}
        onChange={(updates) => dispatch({ type: "updateQuestion", id: question.id, patch: updates })}
      />
    </Card>
  );
}
```

### Reducer Simplification

```typescript
// src/lib/questionsReducer.ts

import {
  createTextQuestion,
  createMultipleChoiceQuestion,
} from "./questionFactories";
import { isMultipleChoiceQuestion } from "./questionUtils";

export function questionsReducer(
  state: Question[],
  action: QuestionAction
): Question[] {
  switch (action.type) {
    case "addQuestion":
      return [
        ...state,
        createTextQuestion(action.questionId || crypto.randomUUID()),
      ];

    case "changeType":
      return state.map((q) => {
        if (q.id !== action.id) return q;

        // Factory functions ensure type-safe conversion
        return action.newType === "text"
          ? createTextQuestion(q.id, { label: q.label, required: q.required })
          : createMultipleChoiceQuestion(q.id, {
              label: q.label,
              required: q.required,
              options: isMultipleChoiceQuestion(q) ? q.options : undefined,
            });
      });

    case "addOption":
      return state.map((q) => {
        if (q.id !== action.questionId) return q;
        if (!isMultipleChoiceQuestion(q)) return q; // Type guard ensures safety

        return {
          ...q,
          options: [...q.options, { id: crypto.randomUUID(), text: "" }],
        };
      });

    // ... other cases
  }
}
```

### Validation Simplification

```typescript
// src/lib/validation.ts

import { Question } from "./types";
import { getQuestionTypeConfig } from "./questionTypes";

export function isQuestionValid(question: Question): boolean {
  const config = getQuestionTypeConfig(question.type);
  const result = config.validate(question);
  return result.valid;
}

export function getQuestionValidationErrors(question: Question): string[] {
  const config = getQuestionTypeConfig(question.type);
  const result = config.validate(question);
  return result.errors;
}
```

## Adding a New Question Type

### Example: Rating Question

**Step 1: Add to types**

```typescript
// src/lib/types.ts

export interface RatingQuestion extends BaseQuestion {
  type: "rating";
  min: number;
  max: number;
  step?: number;
}

export type Question = TextQuestion | MultipleChoiceQuestion | RatingQuestion;
```

**Step 2: Create components**

```typescript
// src/lib/questionTypes/rating/RatingQuestionBuilder.tsx
import { RatingQuestion } from "@/lib/types";

export default function RatingQuestionBuilder({
  question,
  onChange,
}: {
  question: RatingQuestion;
  onChange: (updates: Partial<RatingQuestion>) => void;
}) {
  return (
    <div>
      <label>Min Value</label>
      <Input
        type="number"
        value={question.min}
        onChange={(e) => onChange({ min: Number(e.target.value) })}
      />
      <label>Max Value</label>
      <Input
        type="number"
        value={question.max}
        onChange={(e) => onChange({ max: Number(e.target.value) })}
      />
    </div>
  );
}

// src/lib/questionTypes/rating/RatingQuestionPreview.tsx
export default function RatingQuestionPreview({
  question,
  value,
  onChange,
}: {
  question: RatingQuestion;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      {Array.from({ length: question.max - question.min + 1 }, (_, i) => {
        const rating = question.min + i;
        return (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={value === rating ? "selected" : ""}
          >
            {rating}
          </button>
        );
      })}
    </div>
  );
}
```

**Step 3: Add factory function**

```typescript
// src/lib/questionFactories.ts

export function createRatingQuestion(
  id: string,
  overrides?: Partial<Omit<RatingQuestion, "id" | "type">>
): RatingQuestion {
  return {
    id,
    type: "rating",
    label: "",
    required: false,
    min: 1,
    max: 5,
    step: 1,
    ...overrides,
  };
}
```

**Step 4: Add type guard**

```typescript
// src/lib/questionUtils.ts

export function isRatingQuestion(
  question: Question
): question is RatingQuestion {
  return question.type === "rating";
}
```

**Step 5: Add to config mapping**

```typescript
// src/lib/questionTypes/index.ts

import RatingQuestionBuilder from "./rating/RatingQuestionBuilder";
import RatingQuestionPreview from "./rating/RatingQuestionPreview";

export const questionTypeConfig = {
  // ... existing types
  rating: {
    builder: RatingQuestionBuilder,
    preview: RatingQuestionPreview,
    label: "Rating Scale",
    validate: (q: RatingQuestion) => {
      if (!q.label.trim()) return { valid: false, errors: ["Label required"] };
      if (q.min >= q.max)
        return { valid: false, errors: ["Min must be less than max"] };
      return { valid: true, errors: [] };
    },
  },
} as const;
```

**That's it!** TypeScript will now:

- ✅ Require handling the new type in all switch statements
- ✅ Provide type-safe access to `min`, `max`, `step` properties
- ✅ Prevent accessing rating properties on other question types
- ✅ Ensure factory functions return correctly typed questions

## Benefits Summary

### Solves Current Problems

1. **Type Narrowing Issues** → Discriminated union provides automatic narrowing
2. **Defensive Runtime Checks** → Type guards ensure compile-time safety
3. **Scattered Type Logic** → Centralized in config mapping
4. **Unsafe Type Changes** → Factory functions ensure type-safe conversions

### Simplifies Code

1. **Reducer** → Uses factory functions and type guards
2. **Components** → Simple config lookup, no complex conditionals
3. **Validation** → Delegated to type-specific functions in config
4. **Type Guards** → Reusable, type-safe narrowing functions

### Enables Extensibility

1. **Adding Types** → 5 simple steps, all type-safe
2. **Type Safety** → Compile-time guarantees, no runtime surprises
3. **Clear Structure** → Each type has its own components and logic
4. **Exhaustive Checking** → TypeScript ensures all types are handled

## File Structure

```
src/
  lib/
    types.ts                    # Discriminated union types
    questionUtils.ts            # Type guards
    questionFactories.ts         # Factory functions
    validation.ts               # Uses config.validate()
    questionTypes/
      index.ts                  # Config mapping
      text/
        TextQuestionBuilder.tsx
        TextQuestionPreview.tsx
      multipleChoice/
        MultipleChoiceQuestionBuilder.tsx
        MultipleChoiceQuestionPreview.tsx
      rating/                   # New type
        RatingQuestionBuilder.tsx
        RatingQuestionPreview.tsx
  components/
    PreviewQuestion.tsx         # Router (uses config)
    QuestionCard.tsx            # Router (uses config)
```
