# Compound Component Approach Analysis

## The Approach from Extensibility Plan

```typescript
export function QuestionBuilder({ question, onChange, onDelete, isSelected }: QuestionBuilderProps) {
  const typeDef = questionTypeRegistry.get(question.type);
  const BuilderComponent = typeDef.builderComponent;

  return (
    <Card variant={isSelected ? 'selected' : 'default'}>
      <QuestionBuilder.Header>
        <QuestionTypeSelector
          value={question.type}
          onChange={(newType) => onChange({ ...question, type: newType })}
        />
        <DeleteButton onClick={onDelete} />
      </QuestionBuilder.Header>

      <QuestionBuilder.Body>
        <LabelInput
          value={question.label}
          onChange={(label) => onChange({ ...question, label })}
        />
        <RequiredToggle
          value={question.required}
          onChange={(required) => onChange({ ...question, required })}
        />
        <BuilderComponent
          question={question}
          onChange={onChange}
        />
      </QuestionBuilder.Body>
    </Card>
  );
}
```

## What's Good About This Approach

### ✅ 1. Separation of Concerns
- **Common fields** (label, required, type selector) are handled in the wrapper
- **Type-specific fields** (options, rating scale, etc.) are delegated to `BuilderComponent`
- Clear boundary between shared and type-specific logic

### ✅ 2. Compound Component Pattern
- `QuestionBuilder.Header` and `QuestionBuilder.Body` provide flexibility
- Can be composed differently for different layouts
- Good for future customization

### ✅ 3. Clean Component Interface
- Each type-specific builder only needs to handle its own concerns
- No need to reimplement label/required/type selector in each builder

### ✅ 4. Consistent Structure
- All questions have the same wrapper structure
- Only the type-specific part varies

## Potential Issues & Improvements

### ⚠️ Issue 1: Registry Dependency

**Current:**
```typescript
const typeDef = questionTypeRegistry.get(question.type);
const BuilderComponent = typeDef.builderComponent;
```

**Problem:** Requires a registry, which might be overkill.

**Solution:** Use simple mapping instead:
```typescript
// Simple mapping - no registry needed
const questionTypeComponents = {
  text: { builder: TextQuestionBuilder, preview: TextQuestionPreview },
  multipleChoice: { builder: MultipleChoiceQuestionBuilder, preview: MultipleChoiceQuestionPreview },
} as const;

// Usage
const BuilderComponent = questionTypeComponents[question.type].builder;
```

**Or even simpler with discriminated union:**
```typescript
switch (question.type) {
  case "text":
    return <TextQuestionBuilder question={question} onChange={onChange} />;
  case "multipleChoice":
    return <MultipleChoiceQuestionBuilder question={question} onChange={onChange} />;
}
```

### ⚠️ Issue 2: Type Safety with Discriminated Union

**Current approach:**
```typescript
onChange={(newType) => onChange({ ...question, type: newType })}
```

**Problem:** With discriminated union, you can't just spread `question` and change type. The structure changes (e.g., `options` appears/disappears).

**Solution:** Use factory functions:
```typescript
const handleTypeChange = (newType: QuestionType) => {
  if (newType === question.type) return;
  
  // Use factory to create correctly-typed question
  const newQuestion = newType === "text"
    ? createTextQuestion(question.id, { label: question.label, required: question.required })
    : createMultipleChoiceQuestion(question.id, {
        label: question.label,
        required: question.required,
        options: isMultipleChoiceQuestion(question) ? question.options : undefined,
      });
  
  onChange(newQuestion);
};
```

### ⚠️ Issue 3: Compound Components Might Be Overkill

**Current:**
```typescript
<QuestionBuilder.Header>
  <QuestionTypeSelector ... />
  <DeleteButton ... />
</QuestionBuilder.Header>
```

**Question:** Do you actually need the flexibility of compound components? Or is a simple structure fine?

**Simpler alternative:**
```typescript
<div className="flex items-center justify-between mb-4">
  <QuestionTypeSelector ... />
  <DeleteButton ... />
</div>
```

**Use compound components only if:**
- You need different layouts for different contexts
- You want consumers to customize the structure
- You're building a design system component

## Improved Version: Best of Both Worlds

### Option A: Simple Structure + Discriminated Union (Recommended)

```typescript
// src/components/QuestionBuilder.tsx
import { Question, QuestionType } from "@/lib/types";
import { questionTypeComponents } from "@/lib/questionTypes";
import { createTextQuestion, createMultipleChoiceQuestion } from "@/lib/questionFactories";
import { isMultipleChoiceQuestion } from "@/lib/questionUtils";
import Card from "./ui/Card";
import Input from "./ui/Input";
import Button from "./ui/Button";

interface QuestionBuilderProps {
  question: Question;
  onChange: (question: Question) => void;
  onDelete: () => void;
  isSelected: boolean;
}

export default function QuestionBuilder({
  question,
  onChange,
  onDelete,
  isSelected,
}: QuestionBuilderProps) {
  const { builder: BuilderComponent } = questionTypeComponents[question.type];

  const handleLabelChange = (label: string) => {
    onChange({ ...question, label });
  };

  const handleRequiredChange = (required: boolean) => {
    onChange({ ...question, required });
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === question.type) return;
    
    // Use factory functions for type-safe conversion
    const newQuestion = newType === "text"
      ? createTextQuestion(question.id, {
          label: question.label,
          required: question.required,
        })
      : createMultipleChoiceQuestion(question.id, {
          label: question.label,
          required: question.required,
          options: isMultipleChoiceQuestion(question) 
            ? question.options 
            : undefined,
        });
    
    onChange(newQuestion);
  };

  if (!isSelected) {
    return (
      <Card variant="hover" onClick={() => {}}>
        {/* Collapsed view */}
      </Card>
    );
  }

  return (
    <Card variant="selected">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Input
          type="select"
          value={question.type}
          onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
        >
          {Object.keys(questionTypeComponents).map((type) => (
            <option key={type} value={type}>
              {questionTypeComponents[type as QuestionType].label}
            </option>
          ))}
        </Input>
        <Button variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>

      {/* Common fields */}
      <div className="space-y-4">
        <div>
          <label>Question Label</label>
          <Input
            type="text"
            value={question.label}
            onChange={(e) => handleLabelChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => handleRequiredChange(e.target.checked)}
          />
          <label>Required</label>
        </div>

        {/* Type-specific builder */}
        <BuilderComponent
          question={question}
          onChange={onChange}
        />
      </div>
    </Card>
  );
}
```

**Benefits:**
- ✅ No registry needed (simple mapping)
- ✅ Type-safe with discriminated union
- ✅ Clean separation of common vs type-specific
- ✅ Simple structure (no compound components unless needed)

### Option B: Keep Compound Components (If You Need Flexibility)

```typescript
// If you want compound components for flexibility
export function QuestionBuilder({ question, onChange, onDelete, isSelected }: QuestionBuilderProps) {
  const { builder: BuilderComponent } = questionTypeComponents[question.type];

  return (
    <Card variant={isSelected ? 'selected' : 'default'}>
      <QuestionBuilder.Header>
        <QuestionTypeSelector
          value={question.type}
          onChange={(newType) => handleTypeChange(newType)}
        />
        <DeleteButton onClick={onDelete} />
      </QuestionBuilder.Header>

      <QuestionBuilder.Body>
        <LabelInput
          value={question.label}
          onChange={(label) => handleLabelChange(label)}
        />
        <RequiredToggle
          value={question.required}
          onChange={(required) => handleRequiredChange(required)}
        />
        <BuilderComponent
          question={question}
          onChange={onChange}
        />
      </QuestionBuilder.Body>
    </Card>
  );
}

// Compound component sub-components
QuestionBuilder.Header = function Header({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between mb-4">{children}</div>;
};

QuestionBuilder.Body = function Body({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
};
```

**Use this if:**
- You want consumers to customize the layout
- You're building a design system
- You need different layouts in different contexts

## Type-Specific Builder Components

### Text Question Builder (Minimal)

```typescript
// src/lib/questionTypes/text/TextQuestionBuilder.tsx
import { TextQuestion } from "@/lib/types";

interface TextQuestionBuilderProps {
  question: TextQuestion;
  onChange: (question: TextQuestion) => void;
}

export default function TextQuestionBuilder({
  question,
  onChange,
}: TextQuestionBuilderProps) {
  // Text questions don't need special builder UI
  // All fields handled by QuestionBuilder wrapper
  return null;
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
  onChange: (question: MultipleChoiceQuestion) => void;
}

export default function MultipleChoiceQuestionBuilder({
  question,
  onChange,
}: MultipleChoiceQuestionBuilderProps) {
  const handleAddOption = () => {
    onChange({
      ...question,
      options: [...question.options, { id: crypto.randomUUID(), text: "" }],
    });
  };

  const handleUpdateOption = (optionId: string, text: string) => {
    onChange({
      ...question,
      options: question.options.map((opt) =>
        opt.id === optionId ? { ...opt, text } : opt
      ),
    });
  };

  const handleRemoveOption = (optionId: string) => {
    onChange({
      ...question,
      options: question.options.filter((opt) => opt.id !== optionId),
    });
  };

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
              onChange={(e) => handleUpdateOption(option.id, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              onClick={() => handleRemoveOption(option.id)}
            >
              <XIcon className="w-5 h-5" />
            </Button>
          </div>
        ))}
        <Button variant="secondary" onClick={handleAddOption}>
          + Add option
        </Button>
      </div>
    </div>
  );
}
```

## Comparison: Registry vs Simple Mapping

| Aspect | Registry | Simple Mapping |
|--------|----------|----------------|
| **Complexity** | Medium | Low |
| **Type Safety** | ✅ Good | ✅ Excellent (with discriminated union) |
| **Runtime Lookup** | ✅ Yes | ❌ No (compile-time) |
| **Plugin Support** | ✅ Yes | ❌ No |
| **Simplicity** | ⭐⭐ | ⭐⭐⭐ |

## Recommendation

**For your use case:**

1. ✅ **Use the compound component structure** - It's clean and separates concerns well
2. ✅ **Use simple mapping instead of registry** - You don't need runtime registration
3. ✅ **Use discriminated unions** - Better type safety
4. ✅ **Use factory functions** - For type-safe type changes
5. ❓ **Compound components** - Only if you need layout flexibility

**The approach is good, just simplify the registry part!**

