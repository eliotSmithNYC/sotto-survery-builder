# Extensibility Plan: Survey Builder Evolution

## Executive Summary

This document outlines a strategic plan for evolving the Survey Builder from a well-structured exercise into a production-ready, scalable feature. The current codebase demonstrates excellent foundations—clean component composition, thoughtful state management, and good separation of concerns. This plan focuses on architectural patterns that will enable the system to scale across multiple dimensions: question types, validation rules, team collaboration, performance, and feature complexity.

**📖 Quick Reference:** For the question type system implementation, see [`question-type-system.md`](./question-type-system.md) for a detailed guide on using discriminated unions and component mapping.

---

## 1. Question Type System: Discriminated Union + Component Mapping

### Current State

Question types are hardcoded with if/else statements in multiple places, causing type narrowing issues:

- `QuestionCard.tsx` - Type selection dropdown and option management
- `PreviewQuestion.tsx` - Rendering logic with defensive type checks
- `questionsReducer.ts` - Type change initialization
- `validation.ts` - Type-specific validation
- `schemas.ts` - Zod schema definitions

**Problems:**

- `options` property exists on all questions (even text), weakening type safety
- Runtime type checks needed everywhere (`typeof value === "string"`)
- Type narrowing doesn't work properly
- Adding new types requires changes in 5+ places

### Solution: Discriminated Union + Simple Component Mapping

**See detailed guide:** [`question-type-system.md`](./question-type-system.md)

**Key Components:**

1. **Discriminated Union Types** - Each question type has its own interface

   ```typescript
   export interface TextQuestion extends BaseQuestion {
     type: "text";
   }

   export interface MultipleChoiceQuestion extends BaseQuestion {
     type: "multipleChoice";
     options: ChoiceOption[];
   }

   export type Question = TextQuestion | MultipleChoiceQuestion;
   ```

2. **Component Mapping** - Simple config object (no registry needed)

   ```typescript
   export const questionTypeConfig = {
     text: {
       builder: TextQuestionBuilder,
       preview: TextQuestionPreview,
       label: "Freeform Text",
       validate: (q: TextQuestion) => {
         /* ... */
       },
     },
     multipleChoice: {
       builder: MultipleChoiceQuestionBuilder,
       preview: MultipleChoiceQuestionPreview,
       label: "Multiple Choice",
       validate: (q: MultipleChoiceQuestion) => {
         /* ... */
       },
     },
   } as const;
   ```

3. **Factory Functions** - Type-safe question creation

   ```typescript
   export function createTextQuestion(
     id: string,
     overrides?: Partial<TextQuestion>
   ): TextQuestion;
   export function createMultipleChoiceQuestion(
     id: string,
     overrides?: Partial<MultipleChoiceQuestion>
   ): MultipleChoiceQuestion;
   ```

4. **Type Guards** - Compile-time type narrowing
   ```typescript
   export function isTextQuestion(question: Question): question is TextQuestion;
   export function isMultipleChoiceQuestion(
     question: Question
   ): question is MultipleChoiceQuestion;
   ```

**Benefits:**

- ✅ Compile-time type safety (no defensive runtime checks)
- ✅ Automatic type narrowing in switch statements
- ✅ Simple component mapping (no registry overhead)
- ✅ Type-safe type conversions via factory functions
- ✅ Centralized validation per question type
- ✅ Adding new types is straightforward (5 simple steps)

**How It Simplifies:**

- **Reducer** → Uses factory functions and type guards instead of manual type checks
- **Components** → Simple config lookup, no complex conditionals
- **Validation** → Delegated to type-specific functions in config
- **Type Narrowing** → Automatic with discriminated unions

**Adding a New Question Type:**

1. Add interface to discriminated union
2. Create builder/preview components
3. Add factory function
4. Add type guard
5. Add to config mapping

TypeScript ensures all types are handled everywhere.

---

## 2. Validation Framework: Rule-Based System

### Current State

Validation is hardcoded in `validation.ts` with type-specific logic mixed together.

### Production-Ready Approach: Declarative Rules

**Rule-Based Validation:**

```typescript
// src/lib/validation/rules.ts
export interface ValidationRule {
  id: string;
  appliesTo: (question: Question) => boolean;
  validate: (question: Question) => ValidationError[];
  priority?: number; // For rule ordering
}

export const rules: ValidationRule[] = [
  {
    id: "label-required",
    appliesTo: () => true, // All questions
    validate: (q) =>
      !q.label.trim()
        ? [{ field: "label", message: "Question label is required" }]
        : [],
  },
  {
    id: "options-required-multiple-choice",
    appliesTo: (q) => q.type === "multipleChoice",
    validate: (q) => {
      if (q.options.length === 0) {
        return [
          { field: "options", message: "At least one option is required" },
        ];
      }
      return q.options
        .map((opt, i) =>
          !opt.text.trim()
            ? {
                field: `options[${i}].text`,
                message: "Option text cannot be empty",
              }
            : null
        )
        .filter(Boolean) as ValidationError[];
    },
  },
  {
    id: "min-options",
    appliesTo: (q) => q.type === "multipleChoice",
    validate: (q) => {
      const typeDef = questionTypeRegistry.get(q.type);
      if (typeDef.minOptions && q.options.length < typeDef.minOptions) {
        return [
          {
            field: "options",
            message: `At least ${typeDef.minOptions} options required`,
          },
        ];
      }
      return [];
    },
  },
];

// src/lib/validation/validator.ts
export class QuestionValidator {
  constructor(private rules: ValidationRule[] = rules) {}

  validate(question: Question): ValidationResult {
    const errors: ValidationError[] = [];

    const applicableRules = this.rules
      .filter((rule) => rule.appliesTo(question))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const rule of applicableRules) {
      errors.push(...rule.validate(question));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  addRule(rule: ValidationRule) {
    this.rules.push(rule);
  }
}
```

**Custom Validation Rules:**

```typescript
// Example: Custom rule for rating questions
const ratingRangeRule: ValidationRule = {
  id: "rating-range",
  appliesTo: (q) => q.type === "rating",
  validate: (q) => {
    const config = q.config as RatingConfig;
    if (config.min >= config.max) {
      return [{ field: "config", message: "Min must be less than max" }];
    }
    return [];
  },
};

validator.addRule(ratingRangeRule);
```

**Benefits:**

- Validation logic is composable and testable
- Rules can be added/removed dynamically
- Easy to create question-type-specific rules
- Validation errors are structured and can be displayed contextually
- Rules can be shared across question types

---

## 3. State Management Evolution

### Current State

- `useReducer` for questions (excellent choice)
- `useState` for UI state and responses
- Props drilling through 2-3 levels

### When to Introduce Context

**Phase 1: Keep Current Approach** (0-10 questions, single user)

- Current state management is appropriate
- Props drilling is acceptable at this scale

**Phase 2: Context for Deep Prop Drilling** (10-50 questions)

```typescript
// src/contexts/SurveyBuilderContext.tsx
interface SurveyBuilderContextValue {
  questions: Question[];
  dispatch: React.Dispatch<QuestionAction>;
  selectedQuestionId?: string;
  setSelectedQuestionId: (id: string | undefined) => void;
  // ... other builder-specific state
}

export const SurveyBuilderContext = createContext<SurveyBuilderContextValue | null>(null);

// Usage: Wrap only the builder area
<SurveyBuilderProvider>
  <BuilderArea />
  <QuestionSidebar />
</SurveyBuilderProvider>
```

**Phase 3: External State Management** (50+ questions, collaboration, persistence)
Consider Zustand or Jotai for:

- Optimistic updates
- Undo/redo
- Conflict resolution
- Offline support
- Real-time sync

```typescript
// src/stores/surveyStore.ts (Zustand example)
interface SurveyStore {
  questions: Question[];
  responses: SurveyResponse;
  selectedQuestionId?: string;

  // Actions
  addQuestion: () => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  // ...

  // Async actions
  saveSurvey: () => Promise<void>;
  loadSurvey: (id: string) => Promise<void>;

  // Undo/redo
  history: HistoryState;
  undo: () => void;
  redo: () => void;
}
```

**Decision Matrix:**

- **useReducer + useState**: < 10 questions, no persistence, single user
- **Context**: 10-50 questions, moderate prop drilling, single user
- **Zustand/Jotai**: 50+ questions, persistence, collaboration, undo/redo
- **Redux**: Complex business logic, time-travel debugging, large team

---

## 4. Component Architecture: Pluggable Components

### Current State

Components are well-composed but tightly coupled to question types.

### Production-Ready Approach: Simple Component Mapping

**Builder Component Pattern:**

```typescript
// src/components/QuestionCard.tsx
import { getQuestionTypeConfig } from "@/lib/questionTypes";
import { createTextQuestion, createMultipleChoiceQuestion } from "@/lib/questionFactories";

export default function QuestionCard({ question, onChange, onDelete, isSelected }: QuestionCardProps) {
  const { builder: BuilderComponent, label: typeLabel } = getQuestionTypeConfig(question.type);

  const handleTypeChange = (newType: QuestionType) => {
    // Use factory functions for type-safe conversion
    const newQuestion = newType === "text"
      ? createTextQuestion(question.id, { label: question.label, required: question.required })
      : createMultipleChoiceQuestion(question.id, {
          label: question.label,
          required: question.required,
        });
    onChange(newQuestion);
  };

  return (
    <Card variant={isSelected ? 'selected' : 'default'}>
      <div className="flex items-center justify-between mb-4">
        <TypeSelector value={question.type} onChange={handleTypeChange} />
        <DeleteButton onClick={onDelete} />
      </div>

      <div className="space-y-4">
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
          onChange={(updates) => onChange({ ...question, ...updates })}
        />
      </div>
    </Card>
  );
}
```

**Preview Component Pattern:**

```typescript
// src/components/PreviewQuestion.tsx
import { getQuestionTypeConfig } from "@/lib/questionTypes";

export default function PreviewQuestion({
  question,
  value,
  onChange
}: PreviewQuestionProps) {
  const { preview: PreviewComponent } = getQuestionTypeConfig(question.type);

  return (
    <Card>
      <label>
        {question.label}
        {question.required && <span>*</span>}
      </label>
      <PreviewComponent
        question={question}
        value={value}
        onChange={onChange}
      />
    </Card>
  );
}
```

**Benefits:**

- ✅ Components automatically adapt to new question types (just add to config)
- ✅ Type-safe with discriminated unions
- ✅ Simple config lookup (no registry overhead)
- ✅ Type-safe type conversions via factory functions
- ✅ Components can be lazy-loaded for code splitting

---

## 5. Data Layer: Next.js + React Query + Zustand Architecture

### Current State

All data exists in memory only. The app uses `useReducer` and `useState` in the root client component.

### Critical Analysis: What's Wrong with the Original Plan

The original plan proposed a **Repository Pattern with manual sync logic** - this is over-engineered for a Next.js app. Here's why:

1. **React Query already handles sync, caching, and optimistic updates** - no need to reinvent it
2. **Repository pattern adds unnecessary abstraction** - Next.js API routes are simple enough
3. **Manual conflict resolution is premature** - React Query's cache invalidation handles most cases
4. **Custom optimistic update hooks duplicate React Query's `useMutation`** - which already does this better

### The Right Architecture: Next.js + React Query + Zustand

**Key Principle:** Use the right tool for the right job:

- **Zustand**: Client-side reactive state (questions, responses, UI state)
- **React Query**: Server state synchronization (fetching, mutations, caching)
- **Next.js API Routes**: Backend endpoints (simple REST API)
- **Server Components**: Not needed here (this is a highly interactive builder)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Client Components (All "use client")                   │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Zustand    │◄────────┤ React Query  │             │
│  │   Store      │         │  (Mutations) │             │
│  └──────────────┘         └──────┬───────┘             │
│         │                        │                       │
│         │ (reads/writes)        │ (syncs to server)     │
│         ▼                        ▼                       │
│  ┌──────────────────────────────────────────┐           │
│  │  Components (QuestionCard, PreviewArea)  │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js API Routes (/app/api/surveys/...)              │
│  - GET /api/surveys/:id                                 │
│  - PUT /api/surveys/:id                                 │
│  - POST /api/surveys/:id/questions                      │
└─────────────────────────────────────────────────────────┘
```

### Implementation: Zustand for Client State

**Why Zustand over Context?** You're right - nothing here needs Context. Zustand is perfect for:

- Questions (reactive state)
- Preview responses (ephemeral, doesn't need persistence)
- UI state (selected question, tabs, sidebar)
- No prop drilling needed

```typescript
// src/lib/store/surveyStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Question, SurveyResponse } from "../types";

interface SurveyStore {
  // Core state
  questions: Question[];
  responses: SurveyResponse;
  selectedQuestionId?: string;

  // UI state
  activeTab: "build" | "preview" | "json";
  isSidebarOpen: boolean;

  // Actions (synchronous, updates local state)
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  setSelectedQuestion: (id: string | undefined) => void;
  setResponse: (
    questionId: string,
    value: string | MultipleChoiceResponse
  ) => void;
  setActiveTab: (tab: "build" | "preview" | "json") => void;

  // Hydration from server (called by React Query)
  hydrateFromServer: (questions: Question[]) => void;
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set) => ({
      questions: [],
      responses: {},
      selectedQuestionId: undefined,
      activeTab: "build",
      isSidebarOpen: false,

      addQuestion: (question) =>
        set((state) => ({
          questions: [...state.questions, question],
        })),

      updateQuestion: (id, patch) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === id ? { ...q, ...patch } : q
          ),
        })),

      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
          responses: Object.fromEntries(
            Object.entries(state.responses).filter(([key]) => key !== id)
          ),
        })),

      setSelectedQuestion: (id) => set({ selectedQuestionId: id }),

      setResponse: (questionId, value) =>
        set((state) => ({
          responses: { ...state.responses, [questionId]: value },
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      hydrateFromServer: (questions) => set({ questions }),
    }),
    {
      name: "survey-builder-storage",
      partialize: (state) => ({
        // Only persist questions, not responses or UI state
        questions: state.questions,
        selectedQuestionId: state.selectedQuestionId,
      }),
    }
  )
);
```

### Implementation: React Query for Server Sync

**Honest Answer: Do You Actually Need React Query?**

For a simple survey builder, you could skip React Query and just do:

```typescript
// Simple alternative - just Zustand + fetch
const useSurveyStore = create((set, get) => ({
  questions: [],
  isLoading: false,
  error: null,

  async loadSurvey(surveyId: string) {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      const data = await res.json();
      set({ questions: data.questions, isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  async saveSurvey(surveyId: string) {
    const { questions } = get();
    await fetch(`/api/surveys/${surveyId}`, {
      method: "PUT",
      body: JSON.stringify({ questions }),
    });
  },
}));
```

**This works fine!** So why use React Query?

React Query provides value through **automatic cache management** and **edge case handling**:

1. **Request Deduplication**: If 3 components need the same survey, React Query makes 1 request, not 3
2. **Background Refetching**: Keeps data fresh if another tab/window updates it
3. **Stale-While-Revalidate**: Shows cached data immediately, updates in background
4. **Automatic Retries**: Network failures retry with exponential backoff
5. **Cache Invalidation**: After saving, automatically refetches fresh data
6. **Optimistic Updates**: Built-in rollback if mutation fails
7. **Loading States**: No manual `isLoading` management needed

**When React Query is Worth It:**

- ✅ Multiple components need the same data
- ✅ Data changes from multiple sources (user edits, websockets, other tabs)
- ✅ You want background sync/refetching
- ✅ You need optimistic updates with rollback
- ✅ You're building a production app (edge cases matter)

**When You Can Skip React Query:**

- ❌ Single-page app with one data source
- ❌ Simple CRUD with no caching needs
- ❌ Prototype/MVP where speed > robustness
- ❌ You're comfortable managing loading/error states manually

**For This Survey Builder:** React Query is probably worth it because:

- Auto-save means mutations happen frequently
- You might add features like "recent surveys" list (needs caching)
- Background sync prevents stale data if user has multiple tabs open
- Optimistic updates make the UI feel instant

**React Query handles:**

- Fetching survey data on mount (with caching)
- Optimistic updates (built-in, with automatic rollback)
- Cache invalidation (auto-refetch after mutations)
- Retry logic (network failures handled automatically)
- Loading/error states (no manual state management)

```typescript
// src/lib/api/surveys.ts
export async function fetchSurvey(surveyId: string): Promise<SurveyDefinition> {
  const res = await fetch(`/api/surveys/${surveyId}`);
  if (!res.ok) throw new Error("Failed to fetch survey");
  return res.json();
}

export async function saveSurvey(
  surveyId: string,
  questions: Question[]
): Promise<SurveyDefinition> {
  const res = await fetch(`/api/surveys/${surveyId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions }),
  });
  if (!res.ok) throw new Error("Failed to save survey");
  return res.json();
}

// src/hooks/useSurveySync.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSurveyStore } from "@/lib/store/surveyStore";
import { fetchSurvey, saveSurvey } from "@/lib/api/surveys";

export function useSurveySync(surveyId: string) {
  const queryClient = useQueryClient();
  const { questions, hydrateFromServer } = useSurveyStore();

  // Fetch survey on mount
  const { data, isLoading } = useQuery({
    queryKey: ["survey", surveyId],
    queryFn: () => fetchSurvey(surveyId),
    enabled: !!surveyId,
  });

  // Hydrate Zustand store when data loads
  useEffect(() => {
    if (data?.questions) {
      hydrateFromServer(data.questions);
    }
  }, [data, hydrateFromServer]);

  // Auto-save mutation (debounced in component)
  const saveMutation = useMutation({
    mutationFn: (questions: Question[]) => saveSurvey(surveyId, questions),
    onSuccess: (saved) => {
      // Update React Query cache
      queryClient.setQueryData(["survey", surveyId], saved);
    },
  });

  return {
    isLoading,
    saveSurvey: () => saveMutation.mutate(questions),
    isSaving: saveMutation.isPending,
  };
}
```

### Implementation: Next.js API Routes

**Simple REST endpoints** - no repository pattern needed:

```typescript
// src/app/api/surveys/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your database client

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const survey = await db.survey.findUnique({
    where: { id: params.id },
    include: { questions: true },
  });

  if (!survey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: survey.id,
    questions: survey.questions,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { questions } = body;

  // Validate, save to database
  const updated = await db.survey.update({
    where: { id: params.id },
    data: {
      questions: {
        deleteMany: {},
        create: questions,
      },
    },
    include: { questions: true },
  });

  return NextResponse.json({
    id: updated.id,
    questions: updated.questions,
  });
}
```

### Auto-Save Pattern

**Debounced auto-save using React Query mutations:**

```typescript
// src/components/SurveyBuilder.tsx
"use client";

import { useEffect } from "react";
import { useSurveySync } from "@/lib/hooks/useSurveySync";
import { useSurveyStore } from "@/lib/store/surveyStore";
import { debounce } from "lodash";

export function SurveyBuilder({ surveyId }: { surveyId: string }) {
  const questions = useSurveyStore((state) => state.questions);
  const { saveSurvey, isSaving } = useSurveySync(surveyId);

  // Debounced auto-save
  useEffect(() => {
    const debouncedSave = debounce(() => {
      saveSurvey();
    }, 2000);

    debouncedSave();
    return () => debouncedSave.cancel();
  }, [questions, saveSurvey]);

  return (
    <div>
      {/* Your builder UI */}
      {isSaving && <div>Saving...</div>}
    </div>
  );
}
```

### Why This Architecture Works

1. **Zustand**: Perfect for reactive client state. No Context needed, no prop drilling.
2. **React Query**: Handles all server sync complexity (caching, invalidation, optimistic updates).
3. **Next.js API Routes**: Simple, familiar REST pattern. No over-engineering.
4. **Separation of Concerns**:
   - Zustand = "What the user sees right now"
   - React Query = "What's on the server"
   - API Routes = "How we talk to the database"

### Alternative: Simpler Architecture (Just Zustand)

**If React Query feels like overkill**, you can absolutely skip it and use Zustand for everything:

```typescript
// src/lib/store/surveyStore.ts - All-in-one approach
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SurveyStore {
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;

  // Async actions
  loadSurvey: (surveyId: string) => Promise<void>;
  saveSurvey: (surveyId: string) => Promise<void>;

  // Sync actions (same as before)
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  // ... etc
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set, get) => ({
      questions: [],
      isLoading: false,
      error: null,
      isSaving: false,

      async loadSurvey(surveyId: string) {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/surveys/${surveyId}`);
          if (!res.ok) throw new Error("Failed to load");
          const data = await res.json();
          set({ questions: data.questions, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      async saveSurvey(surveyId: string) {
        const { questions } = get();
        set({ isSaving: true });
        try {
          await fetch(`/api/surveys/${surveyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions }),
          });
          set({ isSaving: false });
        } catch (error) {
          set({ error: error.message, isSaving: false });
        }
      },

      // ... sync actions
    }),
    { name: "survey-storage" }
  )
);
```

**Pros of Simple Approach:**

- ✅ One less dependency
- ✅ Simpler mental model (everything in one place)
- ✅ Less code overall
- ✅ Fine for MVP/prototype

**Cons of Simple Approach:**

- ❌ Manual loading/error state management
- ❌ No automatic caching (refetches every time)
- ❌ No request deduplication
- ❌ No background refetching
- ❌ Manual optimistic updates (if you want them)

**Recommendation:** Start simple (just Zustand), add React Query later if you need caching/background sync.

### When to Add Complexity

- **Conflict Resolution**: Only if you need real-time collaboration (then consider Yjs/CRDT)
- **Repository Pattern**: Only if you have multiple data sources (localStorage + API + IndexedDB)
- **Server Components**: Not needed here - this is a highly interactive builder that needs client-side reactivity

### Migration Path

1. **Phase 1**: Add Zustand store, migrate from `useReducer` (keep in-memory)
2. **Phase 2**: Add React Query + API routes, wire up fetch/save
3. **Phase 3**: Add auto-save with debouncing
4. **Phase 4**: Add optimistic updates (React Query handles this automatically)

---

## 6. Performance Optimization

### Current State

No performance optimizations. Works well for small surveys.

### Production-Ready Optimizations

**1. Virtualization for Long Lists:**

```typescript
// src/components/BuilderArea.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function BuilderArea({ questions }: BuilderAreaProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: questions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated card height
    overscan: 5, // Render 5 extra items
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <QuestionCard question={questions[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**2. Memoization:**

```typescript
// Memoize expensive computations
const validQuestions = useMemo(
  () => questions.filter((q) => isQuestionValid(q)),
  [questions]
);

// Memoize components
const QuestionCardMemo = React.memo(QuestionCard, (prev, next) => {
  return (
    prev.question.id === next.question.id &&
    prev.question.label === next.question.label &&
    prev.isSelected === next.isSelected
  );
});
```

**3. Code Splitting:**

```typescript
// Lazy load question type components
const TextQuestionBuilder = lazy(
  () => import("./questionTypes/text/TextQuestionBuilder")
);
const MultipleChoiceBuilder = lazy(
  () => import("./questionTypes/multipleChoice/MultipleChoiceBuilder")
);

// Lazy load preview area (only needed when viewing preview)
const PreviewArea = lazy(() => import("./PreviewArea"));
```

**4. Debounced Auto-Save:**

```typescript
// src/hooks/useAutoSave.ts
export function useAutoSave(survey: SurveyDefinition, delay = 2000) {
  const debouncedSave = useMemo(
    () =>
      debounce(async (survey: SurveyDefinition) => {
        await surveyRepository.save(survey);
      }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSave(survey);
    return () => debouncedSave.cancel();
  }, [survey, debouncedSave]);
}
```

**Performance Targets:**

- Initial render: < 100ms for 50 questions
- Question update: < 16ms (60fps)
- Scroll: 60fps with virtualization
- Auto-save: Non-blocking, debounced

---

## 7. Feature Extensions

### 7.1 Conditional Logic / Branching

**Architecture:**

```typescript
// src/lib/types.ts
export interface ConditionalRule {
  id: string;
  questionId: string; // Question this rule applies to
  condition: Condition;
  action: 'show' | 'hide' | 'require' | 'skip';
}

export type Condition =
  | { type: 'equals'; questionId: string; value: string }
  | { type: 'contains'; questionId: string; value: string }
  | { type: 'greaterThan'; questionId: string; value: number }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] };

// src/lib/conditionalLogic/evaluator.ts
export class ConditionalLogicEvaluator {
  evaluate(
    rule: ConditionalRule,
    responses: SurveyResponse
  ): boolean {
    return this.evaluateCondition(rule.condition, responses);
  }

  private evaluateCondition(
    condition: Condition,
    responses: SurveyResponse
  ): boolean {
    switch (condition.type) {
      case 'equals':
        const response = responses[condition.questionId];
        return response === condition.value;
      // ... other condition types
    }
  }
}

// src/components/PreviewArea.tsx
export function PreviewArea({ questions, responses, rules }: PreviewAreaProps) {
  const evaluator = new ConditionalLogicEvaluator();

  const visibleQuestions = useMemo(() => {
    return questions.filter(q => {
      const rule = rules.find(r => r.questionId === q.id);
      if (!rule) return true;

      const shouldShow = evaluator.evaluate(rule, responses);
      return rule.action === 'show' ? shouldShow : !shouldShow;
    });
  }, [questions, responses, rules]);

  return (
    <div>
      {visibleQuestions.map(q => (
        <PreviewQuestion key={q.id} question={q} />
      ))}
    </div>
  );
}
```

### 7.2 Question Templates / Library

```typescript
// src/lib/templates/QuestionTemplate.ts
export interface QuestionTemplate {
  id: string;
  name: string;
  category: string;
  question: Omit<Question, "id">;
  tags: string[];
}

// src/lib/templates/TemplateLibrary.ts
export class TemplateLibrary {
  private templates: QuestionTemplate[] = [];

  addTemplate(template: QuestionTemplate) {
    this.templates.push(template);
  }

  search(query: string, category?: string): QuestionTemplate[] {
    return this.templates
      .filter((t) => !category || t.category === category)
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );
  }

  instantiate(templateId: string): Question {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    return {
      ...template.question,
      id: crypto.randomUUID(),
    };
  }
}
```

### 7.3 Rich Media Support

```typescript
// src/lib/types.ts
export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  metadata?: Record<string, unknown>;
}

export interface Question {
  // ... existing fields
  media?: MediaAttachment[];
  mediaPosition?: 'before' | 'after' | 'background';
}

// src/components/MediaUploader.tsx
export function MediaUploader({
  question,
  onUpload
}: MediaUploaderProps) {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    const attachment: MediaAttachment = await response.json();
    onUpload(attachment);
  };

  return (
    <div>
      <input type="file" onChange={e => handleUpload(e.target.files[0])} />
      {/* Preview existing media */}
    </div>
  );
}
```

---

## 8. Team Collaboration

### 8.1 Real-Time Collaboration

**WebSocket Integration:**

```typescript
// src/lib/collaboration/CollaborationClient.ts
export class CollaborationClient {
  private ws: WebSocket;
  private presence: Map<string, UserPresence> = new Map();

  constructor(surveyId: string) {
    this.ws = new WebSocket(
      `ws://api.example.com/surveys/${surveyId}/collaborate`
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "question_updated":
          this.handleQuestionUpdate(message.payload);
          break;
        case "user_joined":
          this.presence.set(message.userId, message.presence);
          break;
        case "cursor_moved":
          this.handleCursorMove(message.userId, message.position);
          break;
      }
    };
  }

  updateQuestion(questionId: string, patch: Partial<Question>) {
    this.ws.send(
      JSON.stringify({
        type: "update_question",
        questionId,
        patch,
      })
    );
  }
}
```

**Operational Transform / CRDT:**

For conflict-free collaboration, consider:

- **Yjs** (CRDT-based) for shared state
- **ShareJS** (Operational Transform) for text editing
- **Automerge** (CRDT) for structured data

### 8.2 Versioning & History

```typescript
// src/lib/versioning/SurveyVersion.ts
export interface SurveyVersion {
  id: string;
  surveyId: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  snapshot: SurveyDefinition;
  changes: Change[];
}

export interface Change {
  type: "question_added" | "question_updated" | "question_deleted";
  questionId: string;
  before?: Question;
  after?: Question;
  timestamp: Date;
  userId: string;
}

// src/lib/versioning/VersionManager.ts
export class VersionManager {
  async createVersion(
    survey: SurveyDefinition,
    changes: Change[]
  ): Promise<SurveyVersion> {
    return {
      id: crypto.randomUUID(),
      surveyId: survey.id,
      version: await this.getNextVersion(survey.id),
      createdAt: new Date(),
      createdBy: getCurrentUserId(),
      snapshot: survey,
      changes,
    };
  }

  async restoreVersion(versionId: string): Promise<SurveyDefinition> {
    const version = await this.loadVersion(versionId);
    return version.snapshot;
  }

  async getHistory(surveyId: string): Promise<SurveyVersion[]> {
    // Load version history
  }
}
```

---

## 9. Testing Strategy

### Unit Tests

```typescript
// src/lib/questionTypes/__tests__/registry.test.ts
describe("QuestionTypeRegistry", () => {
  it("registers and retrieves question types", () => {
    const registry = new QuestionTypeRegistry();
    registry.register(textQuestionType);

    expect(registry.get("text")).toBe(textQuestionType);
  });

  it("throws error for unknown type", () => {
    const registry = new QuestionTypeRegistry();
    expect(() => registry.get("unknown")).toThrow();
  });
});

// src/lib/validation/__tests__/validator.test.ts
describe("QuestionValidator", () => {
  it("validates required label", () => {
    const validator = new QuestionValidator();
    const question = {
      id: "1",
      label: "",
      type: "text",
      required: false,
      options: [],
    };

    const result = validator.validate(question);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "label",
      message: "Question label is required",
    });
  });
});
```

### Integration Tests

```typescript
// src/components/__tests__/QuestionBuilder.integration.test.tsx
describe('QuestionBuilder Integration', () => {
  it('updates question when type changes', async () => {
    const { getByLabelText } = render(
      <QuestionBuilder
        question={mockQuestion}
        onChange={jest.fn()}
      />
    );

    const typeSelect = getByLabelText('Question Type');
    fireEvent.change(typeSelect, { target: { value: 'multipleChoice' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'multipleChoice' })
      );
    });
  });
});
```

### E2E Tests

```typescript
// e2e/survey-builder.spec.ts
test("create and preview survey", async ({ page }) => {
  await page.goto("/");

  // Add question
  await page.click("text=Add question");
  await page.fill('[aria-label="Question Label"]', "What is your name?");

  // Change to multiple choice
  await page.selectOption('[aria-label="Question Type"]', "multipleChoice");
  await page.fill('[placeholder="Option 1"]', "John");
  await page.fill('[placeholder="Option 2"]', "Jane");

  // Preview
  await page.click("text=Preview");
  await page.click("text=John");

  // Verify response
  const response = await page.textContent('[data-testid="json-responses"]');
  expect(response).toContain("John");
});
```

---

## 10. API Design for Extensibility

### RESTful API with Extensibility Hooks

```typescript
// API endpoints
POST   /api/surveys
GET    /api/surveys/:id
PUT    /api/surveys/:id
DELETE /api/surveys/:id

POST   /api/surveys/:id/questions
PUT    /api/surveys/:id/questions/:questionId
DELETE /api/surveys/:id/questions/:questionId

// Extensibility hooks
POST   /api/surveys/:id/hooks/validate
POST   /api/surveys/:id/hooks/before-save
POST   /api/surveys/:id/hooks/after-save
```

### GraphQL for Flexible Queries

```graphql
type Survey {
  id: ID!
  title: String
  questions: [Question!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Question {
  id: ID!
  type: QuestionType!
  label: String!
  required: Boolean!
  config: QuestionConfig
  options: [ChoiceOption!]
}

union QuestionConfig = TextConfig | MultipleChoiceConfig | RatingConfig

query GetSurvey($id: ID!) {
  survey(id: $id) {
    id
    questions {
      id
      type
      label
      ... on MultipleChoiceQuestion {
        options {
          id
          text
        }
      }
    }
  }
}
```

---

## 11. Migration Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Implement question type registry
- [ ] Migrate existing question types to registry
- [ ] Create validation rule system
- [ ] Add unit tests for core logic

### Phase 2: Data Layer (Weeks 3-4)

- [ ] Implement repository pattern
- [ ] Add local storage persistence
- [ ] Implement optimistic updates
- [ ] Add error handling and retry logic

### Phase 3: Performance (Weeks 5-6)

- [ ] Add virtualization for long lists
- [ ] Implement memoization
- [ ] Code splitting for question types
- [ ] Performance monitoring

### Phase 4: Features (Weeks 7-10)

- [ ] Conditional logic system
- [ ] Question templates/library
- [ ] Rich media support
- [ ] Export/import functionality

### Phase 5: Collaboration (Weeks 11-14)

- [ ] Real-time collaboration
- [ ] Versioning system
- [ ] Conflict resolution
- [ ] Presence indicators

### Phase 6: Scale (Weeks 15+)

- [ ] Backend API integration
- [ ] Multi-tenant support
- [ ] Analytics and monitoring
- [ ] Plugin system for third-party extensions

---

## 12. Key Principles

1. **Open/Closed Principle**: Open for extension, closed for modification
2. **Dependency Inversion**: Depend on abstractions (interfaces), not concretions
3. **Single Responsibility**: Each component/function has one clear purpose
4. **Composition over Inheritance**: Build complex features from simple, composable parts
5. **Progressive Enhancement**: Start simple, add complexity only when needed
6. **Type Safety**: Leverage TypeScript to catch errors at compile time
7. **Testability**: Design for easy testing from the start

---

## Conclusion

The current codebase provides an excellent foundation. The extensibility plan outlined here focuses on:

1. **Plugin Architecture**: Making question types truly pluggable
2. **Declarative Systems**: Validation, conditional logic, and rules
3. **Scalable State Management**: Progressive evolution from local to global state
4. **Performance**: Optimization strategies for large surveys
5. **Collaboration**: Real-time editing and versioning
6. **Testing**: Comprehensive test coverage strategy

By following this plan, the Survey Builder can evolve from a well-structured exercise into a production-ready, enterprise-scale feature that supports:

- Unlimited question types (including third-party plugins)
- Complex validation rules
- Team collaboration
- High performance with 100+ questions
- Rich feature set (branching, media, templates)
- Robust error handling and recovery

The key is to implement these changes incrementally, maintaining backward compatibility and ensuring each phase delivers value independently.
