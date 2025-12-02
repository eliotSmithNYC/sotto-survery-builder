# Options Array Design: Analysis & Improvement

## Current Design: Trade-offs

### The Problem

Having `options: ChoiceOption[]` on all questions, even text questions where it's always empty, creates a type safety gap:

```typescript
// Current design - TypeScript allows this, but it's conceptually wrong
const textQuestion: Question = {
  id: "1",
  type: "text",
  label: "Name?",
  required: false,
  options: [], // Always empty, but still part of the type
};

// TypeScript doesn't prevent this:
textQuestion.options.push({ id: "x", text: "oops" }); // ❌ Shouldn't be possible
```

### Why This Design Was Chosen

**Pragmatic reasons:**

1. **Simpler reducer logic** - No need to narrow types in every reducer case
2. **Easier serialization** - JSON serialization is straightforward (no type discrimination needed)
3. **Less boilerplate** - Don't need type guards everywhere
4. **MVP mindset** - Works for current scope, can refactor later

**The trade-off:**

- ✅ Simpler code structure
- ✅ Easier to extend initially
- ❌ Weaker type safety
- ❌ Runtime checks required everywhere
- ❌ Conceptual mismatch (text questions have unused data)

## How to Discuss This in an Interview

### Good Discussion Points

1. **Acknowledge the trade-off explicitly:**

   > "I chose to have `options` on all questions for simplicity, but I'm aware this sacrifices some type safety. TypeScript can't prevent accessing options on text questions, so I rely on runtime checks."

2. **Show awareness of alternatives:**

   > "The alternative would be a discriminated union, which would give us compile-time safety but add complexity to the reducer and serialization logic."

3. **Explain when you'd refactor:**

   > "If we were adding more question types or if bugs started emerging from accidentally accessing options on text questions, I'd refactor to a discriminated union."

4. **Demonstrate understanding of the pattern:**
   > "This is a common pattern in TypeScript - sometimes you choose pragmatic simplicity over perfect type safety, especially in MVP stages. The key is knowing when to refactor."

### Red Flags to Avoid

- ❌ "I didn't think about it" - Shows lack of consideration
- ❌ "It's fine, we always check the type" - Dismisses the concern
- ❌ "TypeScript is too complex" - Shows resistance to type safety

### Green Flags

- ✅ "I made a pragmatic choice but I'm aware of the trade-offs"
- ✅ "Here's when I would refactor this"
- ✅ "Let me show you the discriminated union approach"

## Improved Implementation: Discriminated Union

Here's how to improve it with proper type safety:

### Step 1: Define Discriminated Union Types

```typescript
// src/lib/types.ts

export type QuestionType = "text" | "multipleChoice";

export interface ChoiceOption {
  id: string;
  text: string;
}

// Base question properties
interface BaseQuestion {
  id: string;
  label: string;
  required: boolean;
}

// Text question - no options
export interface TextQuestion extends BaseQuestion {
  type: "text";
}

// Multiple choice question - requires options
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multipleChoice";
  options: ChoiceOption[];
}

// Discriminated union - TypeScript will narrow based on 'type'
export type Question = TextQuestion | MultipleChoiceQuestion;
```

### Step 2: Update Type Guards

```typescript
// src/lib/questionUtils.ts

export function isMultipleChoiceQuestion(
  question: Question
): question is MultipleChoiceQuestion {
  return question.type === "multipleChoice";
}

export function isTextQuestion(question: Question): question is TextQuestion {
  return question.type === "text";
}
```

### Step 3: Create Factory Functions

```typescript
// src/lib/questionFactories.ts

export function createTextQuestion(
  id: string,
  overrides?: Partial<TextQuestion>
): TextQuestion {
  return {
    id,
    label: "",
    type: "text",
    required: false,
    ...overrides,
  };
}

export function createMultipleChoiceQuestion(
  id: string,
  overrides?: Partial<MultipleChoiceQuestion>
): MultipleChoiceQuestion {
  return {
    id,
    label: "",
    type: "multipleChoice",
    required: false,
    options: [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ],
    ...overrides,
  };
}
```

### Step 4: Update Reducer

```typescript
// src/lib/questionsReducer.ts
import {
  createTextQuestion,
  createMultipleChoiceQuestion,
} from "./questionFactories";

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

        if (action.newType === "multipleChoice") {
          const existingOptions = isMultipleChoiceQuestion(q)
            ? q.options
            : [
                { id: crypto.randomUUID(), text: "" },
                { id: crypto.randomUUID(), text: "" },
              ];

          return createMultipleChoiceQuestion(q.id, {
            label: q.label,
            required: q.required,
            options: existingOptions,
          });
        }

        return createTextQuestion(q.id, {
          label: q.label,
          required: q.required,
        });
      });

    case "addOption":
      return state.map((q) => {
        if (q.id !== action.questionId) return q;
        if (!isMultipleChoiceQuestion(q)) return q;

        return {
          ...q,
          options: [...q.options, { id: crypto.randomUUID(), text: "" }],
        };
      });

    case "updateOption":
      return state.map((q) => {
        if (q.id !== action.questionId) return q;
        if (!isMultipleChoiceQuestion(q)) return q;

        return {
          ...q,
          options: q.options.map((opt) =>
            opt.id === action.optionId ? { ...opt, text: action.text } : opt
          ),
        };
      });

    case "removeOption":
      return state.map((q) => {
        if (q.id !== action.questionId) return q;
        if (!isMultipleChoiceQuestion(q)) return q;

        return {
          ...q,
          options: q.options.filter((opt) => opt.id !== action.optionId),
        };
      });

    // Other cases...
  }
}
```

**Key improvements:**

- ✅ No type assertions needed - factory functions return correctly typed objects
- ✅ Reusable - factories can be used in tests, initial state, etc.
- ✅ Type-safe - TypeScript validates the structure
- ✅ Self-documenting - function names explain intent

### Step 5: Update Components

```typescript
// src/components/QuestionCard.tsx

// TypeScript now enforces the check!
{isMultipleChoiceQuestion(question) && (
  <div>
    <label>Options</label>
    {question.options.map((option) => (
      // TypeScript knows question.options exists here
    ))}
  </div>
)}
```

### Benefits of Discriminated Union

1. **Compile-time safety** - Can't access `options` on text questions
2. **Better autocomplete** - TypeScript knows which properties exist
3. **Self-documenting** - The type system enforces the domain model
4. **Fewer runtime checks** - Type guards provide narrowing

### Drawbacks

1. **More complex reducer** - Need factory functions and type guards (though factory functions eliminate type assertions)
2. **Serialization complexity** - Need to handle type discrimination in JSON
3. **More boilerplate** - Type guards needed in some places, plus factory functions to maintain

## Migration Strategy

If refactoring existing code:

1. **Add discriminated union types** alongside existing types
2. **Create type guards** for narrowing
3. **Update reducer gradually** - one action at a time
4. **Update components** to use type guards
5. **Remove old type** once migration complete
6. **Add tests** to ensure type safety

## Recommendation

**For the interview/exercise:**

- Keep current design, but **explicitly discuss the trade-off**
- Show you understand discriminated unions
- Explain when you'd refactor

**For production:**

- If adding more question types → refactor to discriminated union
- If bugs emerge from type confusion → refactor
- If staying simple → current design is acceptable with good tests

## Key Takeaway

The "smell" you noticed is valid - it's a type safety trade-off. The important thing is:

1. Being aware of it
2. Understanding the alternatives
3. Knowing when to refactor
4. Being able to discuss it thoughtfully

This shows senior-level thinking: pragmatic choices with awareness of trade-offs, not just "it works."
