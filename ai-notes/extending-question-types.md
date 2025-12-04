# Simple Extensibility: Discriminated Union + Component Mapping

## The Approach: Start Simple, Add Complexity Only When Needed

This shows how to get the benefits of separate builder/preview components with discriminated unions, without the registry overhead.

## File Structure

```
src/
  lib/
    types.ts                    # Discriminated union types
    questionUtils.ts            # Type guards, utilities
    questionFactories.ts        # Factory functions
    questionTypes/
      index.ts                  # Component mapping (simple!)
      text/
        TextQuestionBuilder.tsx
        TextQuestionPreview.tsx
      multipleChoice/
        MultipleChoiceQuestionBuilder.tsx
        MultipleChoiceQuestionPreview.tsx
  components/
    PreviewQuestion.tsx         # Router component
    QuestionCard.tsx            # Router component
```

## Step 1: Discriminated Union Types

```typescript
// src/lib/types.ts

export type QuestionType = "text" | "multipleChoice";

export interface ChoiceOption {
  id: string;
  text: string;
}

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

export type Question = TextQuestion | MultipleChoiceQuestion;

// Response types
export type TextResponse = string;

export type MultipleChoiceResponse = {
  optionId: string;
  optionText: string;
};

export type QuestionResponse = TextResponse | MultipleChoiceResponse;
```

## Step 2: Type Guards

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

export function getQuestionTypeLabel(type: QuestionType): string {
  return type === "multipleChoice" ? "Multiple Choice" : "Freeform Text";
}
```

## Step 3: Factory Functions

```typescript
// src/lib/questionFactories.ts

import { TextQuestion, MultipleChoiceQuestion } from "./types";

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

## Step 4: Component Mapping (Simple!)

```typescript
// src/lib/questionTypes/index.ts

import TextQuestionBuilder from "./text/TextQuestionBuilder";
import TextQuestionPreview from "./text/TextQuestionPreview";
import MultipleChoiceQuestionBuilder from "./multipleChoice/MultipleChoiceQuestionBuilder";
import MultipleChoiceQuestionPreview from "./multipleChoice/MultipleChoiceQuestionPreview";
import { QuestionType } from "@/lib/types";

// Simple mapping object - no registry class needed!
export const questionTypeComponents = {
  text: {
    builder: TextQuestionBuilder,
    preview: TextQuestionPreview,
    label: "Freeform Text",
  },
  multipleChoice: {
    builder: MultipleChoiceQuestionBuilder,
    preview: MultipleChoiceQuestionPreview,
    label: "Multiple Choice",
  },
} as const;

// Type-safe getter
export function getQuestionTypeComponents(type: QuestionType) {
  return questionTypeComponents[type];
}

// Helper to get all types (for dropdowns, etc.)
export function getAllQuestionTypes() {
  return Object.keys(questionTypeComponents) as QuestionType[];
}
```

## Step 5: Individual Question Type Components

### Text Question Builder

```typescript
// src/lib/questionTypes/text/TextQuestionBuilder.tsx

import { TextQuestion } from "@/lib/types";
import Input from "@/components/ui/Input";

interface TextQuestionBuilderProps {
  question: TextQuestion;
  onUpdate: (updates: Partial<TextQuestion>) => void;
}

export default function TextQuestionBuilder({
  question,
  onUpdate,
}: TextQuestionBuilderProps) {
  // Text questions don't need special builder UI
  // The common fields (label, required) are handled by QuestionCard
  // This component exists for consistency and future extensibility
  return null; // Or return any text-specific builder controls
}
```

### Text Question Preview

```typescript
// src/lib/questionTypes/text/TextQuestionPreview.tsx

import { TextQuestion, TextResponse } from "@/lib/types";
import Input from "@/components/ui/Input";

interface TextQuestionPreviewProps {
  question: TextQuestion;
  value: TextResponse | undefined;
  onChange: (value: TextResponse) => void;
  onFocus?: () => void;
}

export default function TextQuestionPreview({
  question,
  value,
  onChange,
  onFocus,
}: TextQuestionPreviewProps) {
  return (
    <Input
      type="textarea"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder="Type your answer here..."
      rows={4}
    />
  );
}
```

### Multiple Choice Question Builder

```typescript
// src/lib/questionTypes/multipleChoice/MultipleChoiceQuestionBuilder.tsx

import { MultipleChoiceQuestion } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import XIcon from "@/components/icons/XIcon";

interface MultipleChoiceQuestionBuilderProps {
  question: MultipleChoiceQuestion;
  onUpdate: (updates: Partial<MultipleChoiceQuestion>) => void;
  onAddOption: () => void;
  onUpdateOption: (optionId: string, text: string) => void;
  onRemoveOption: (optionId: string) => void;
}

export default function MultipleChoiceQuestionBuilder({
  question,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: MultipleChoiceQuestionBuilderProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 mb-2">
        Options
      </label>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <Input
              type="text"
              value={option.text}
              onChange={(e) => onUpdateOption(option.id, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              onClick={() => onRemoveOption(option.id)}
              aria-label="Remove option"
            >
              <XIcon className="w-5 h-5" />
            </Button>
          </div>
        ))}
        <Button variant="secondary" onClick={onAddOption}>
          + Add option
        </Button>
      </div>
    </div>
  );
}
```

### Multiple Choice Question Preview

```typescript
// src/lib/questionTypes/multipleChoice/MultipleChoiceQuestionPreview.tsx

import { MultipleChoiceQuestion, MultipleChoiceResponse } from "@/lib/types";

interface MultipleChoiceQuestionPreviewProps {
  question: MultipleChoiceQuestion;
  value: MultipleChoiceResponse | undefined;
  onChange: (value: MultipleChoiceResponse) => void;
  onFocus?: () => void;
}

export default function MultipleChoiceQuestionPreview({
  question,
  value,
  onChange,
  onFocus,
}: MultipleChoiceQuestionPreviewProps) {
  return (
    <div className="space-y-2">
      {question.options.map((option) => {
        const isSelected =
          value?.optionId === option.id;
        
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
  );
}
```

## Step 6: Router Components

### PreviewQuestion (Router)

```typescript
// src/components/PreviewQuestion.tsx

"use client";

import { Question, QuestionResponse } from "@/lib/types";
import { getQuestionTypeComponents } from "@/lib/questionTypes";
import Card from "./ui/Card";

interface PreviewQuestionProps {
  question: Question;
  isSelected: boolean;
  value: QuestionResponse | undefined;
  onChange: (value: QuestionResponse) => void;
  onFocus?: () => void;
}

export default function PreviewQuestion({
  question,
  isSelected,
  value,
  onChange,
  onFocus,
}: PreviewQuestionProps) {
  const { preview: PreviewComponent } = getQuestionTypeComponents(question.type);

  return (
    <Card
      variant={isSelected ? "highlighted" : "default"}
      className="p-4 transition-colors"
    >
      <label className="block text-sm font-medium text-zinc-900 mb-3">
        {question.label || "Untitled question"}
        {question.required && (
          <span className="ml-2 text-red-600 font-semibold">
            <span className="text-lg">*</span> Required
          </span>
        )}
      </label>

      <PreviewComponent
        question={question}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
      />
    </Card>
  );
}
```

### QuestionCard (Router)

```typescript
// src/components/QuestionCard.tsx

"use client";

import { Question, QuestionType } from "@/lib/types";
import { QuestionAction } from "@/lib/questionsReducer";
import { getQuestionTypeComponents, getAllQuestionTypes } from "@/lib/questionTypes";
import { isMultipleChoiceQuestion } from "@/lib/questionUtils";
import Input from "./ui/Input";
import Card from "./ui/Card";
import Button from "./ui/Button";
import ChevronDown from "./icons/ChevronDown";

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  dispatch: React.Dispatch<QuestionAction>;
  onSelect: () => void;
  onDelete: () => void;
  onTypeChange?: (questionId: string) => void;
}

export default function QuestionCard({
  question,
  isSelected,
  dispatch,
  onSelect,
  onDelete,
  onTypeChange,
}: QuestionCardProps) {
  const { builder: BuilderComponent, label: typeLabel } = 
    getQuestionTypeComponents(question.type);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "updateQuestion",
      id: question.id,
      patch: { label: e.target.value },
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as QuestionType;
    if (newType !== question.type) {
      onTypeChange?.(question.id);
    }
    dispatch({
      type: "changeType",
      id: question.id,
      newType,
    });
  };

  const handleRequiredToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "updateQuestion",
      id: question.id,
      patch: { required: e.target.checked },
    });
  };

  // Builder-specific handlers
  const handleAddOption = () => {
    if (isMultipleChoiceQuestion(question)) {
      dispatch({ type: "addOption", questionId: question.id });
    }
  };

  const handleUpdateOption = (optionId: string, text: string) => {
    if (isMultipleChoiceQuestion(question)) {
      dispatch({
        type: "updateOption",
        questionId: question.id,
        optionId,
        text,
      });
    }
  };

  const handleRemoveOption = (optionId: string) => {
    if (isMultipleChoiceQuestion(question)) {
      dispatch({
        type: "removeOption",
        questionId: question.id,
        optionId,
      });
    }
  };

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
              {question.required ? "Required" : "Optional"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="selected" onClick={onSelect}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-end">
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Question Label
          </label>
          <Input
            type="text"
            value={question.label}
            onChange={handleLabelChange}
            onFocus={onSelect}
            placeholder="Enter question text..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Question Type
          </label>
          <Input
            type="select"
            value={question.type}
            onChange={handleTypeChange}
            onFocus={onSelect}
          >
            {getAllQuestionTypes().map((type) => {
              const { label } = getQuestionTypeComponents(type);
              return (
                <option key={type} value={type}>
                  {label}
                </option>
              );
            })}
          </Input>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.required}
            onChange={handleRequiredToggle}
            onFocus={onSelect}
          />
          <label>Required</label>
        </div>

        <BuilderComponent
          question={question}
          onUpdate={(updates) =>
            dispatch({
              type: "updateQuestion",
              id: question.id,
              patch: updates,
            })
          }
          onAddOption={handleAddOption}
          onUpdateOption={handleUpdateOption}
          onRemoveOption={handleRemoveOption}
        />
      </div>
    </Card>
  );
}
```

## Adding a New Question Type

**Example: Rating Question**

1. **Add to types:**
```typescript
export interface RatingQuestion extends BaseQuestion {
  type: "rating";
  min: number;
  max: number;
  step?: number;
}

export type Question = TextQuestion | MultipleChoiceQuestion | RatingQuestion;
```

2. **Create components:**
```typescript
// src/lib/questionTypes/rating/RatingQuestionBuilder.tsx
// src/lib/questionTypes/rating/RatingQuestionPreview.tsx
```

3. **Add to mapping:**
```typescript
export const questionTypeComponents = {
  // ... existing
  rating: {
    builder: RatingQuestionBuilder,
    preview: RatingQuestionPreview,
    label: "Rating Scale",
  },
} as const;
```

4. **TypeScript ensures:**
- All switch statements handle the new type
- Components are type-safe
- Factory functions updated

**That's it!** No registry, no complex registration, just add to the mapping.

## Benefits of This Approach

✅ **Type Safety** - Discriminated union ensures compile-time safety  
✅ **Separate Components** - Each question type has its own builder/preview  
✅ **Simple** - No registry overhead, just a mapping object  
✅ **Easy to Extend** - Add new type = add to mapping  
✅ **Exhaustive Checking** - TypeScript ensures all types handled  
✅ **Clear Structure** - Easy to understand and maintain  

## When to Add Registry

Only if you need:
- 10+ question types (mapping becomes unwieldy)
- Runtime plugin system (third-party types)
- Dynamic type loading (from API)
- Complex metadata queries (filter by category, etc.)

**For now, this simple approach is perfect!**

