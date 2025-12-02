# Zustand Implementation Plan

## Overview

This document outlines the plan for migrating the survey builder from React's `useReducer` to Zustand state management, with support for:

- **Undo/Redo** functionality via custom middleware
- **Persistence** via Zustand's persist middleware
- **Optimistic Updates** via Zustand's async action patterns

## Current State Management

### Current Architecture

The application currently uses:

- `useReducer` with `questionsReducer` for question state management
- `useState` for UI state (tabs, sidebar, selected question)
- `useState` for preview responses
- Direct prop drilling through component tree

**Key Files:**

- `src/app/page.tsx` - Root component managing all state
- `src/lib/questionsReducer.ts` - Reducer with action types
- `src/lib/types.ts` - Type definitions

**Current State Structure:**

```typescript
// Current state in page.tsx
const [questions, dispatch] = useReducer(
  questionsReducer,
  createInitialQuestions()
);
const [selectedQuestionId, setSelectedQuestionId] = useState<
  string | undefined
>();
const [responses, setResponses] = useState<SurveyResponse>({});
const [activeTab, setActiveTab] = useState<Tab>("build");
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState(false);
const [validationError, setValidationError] = useState<string | null>(null);
```

## Zustand Store Design

### Store Structure

```typescript
// src/lib/store/surveyStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Question, SurveyResponse } from "../types";
import { QuestionAction } from "../questionsReducer";
import { questionsReducer, createInitialQuestions } from "../questionsReducer";

interface SurveyState {
  // Core state
  questions: Question[];
  selectedQuestionId?: string;
  responses: SurveyResponse;

  // UI state
  activeTab: "build" | "preview" | "json";
  isSidebarOpen: boolean;
  isJsonDrawerOpen: boolean;
  validationError: string | null;

  // History state (for undo/redo)
  history: {
    past: Question[][];
    present: Question[];
    future: Question[];
  };

  // Async state (for optimistic updates)
  isSaving: boolean;
  lastSaveError: string | null;
  lastSavedAt: number | null;

  // Actions - Synchronous
  dispatch: (action: QuestionAction) => void;
  setSelectedQuestionId: (id: string | undefined) => void;
  setResponses: (responses: SurveyResponse) => void;
  updateResponse: (
    questionId: string,
    value: string | MultipleChoiceResponse
  ) => void;
  setActiveTab: (tab: "build" | "preview" | "json") => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsJsonDrawerOpen: (open: boolean) => void;
  setValidationError: (error: string | null) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Actions - Async (Optimistic Updates)
  saveSurvey: (surveyId?: string) => Promise<void>;
  loadSurvey: (surveyId: string) => Promise<void>;
  syncSurvey: () => Promise<void>;

  // Helper actions
  addQuestion: () => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  changeQuestionType: (id: string, newType: QuestionType) => void;
  moveQuestionUp: (id: string) => void;
  moveQuestionDown: (id: string) => void;
}
```

## Implementation Details

### 1. Undo/Redo Middleware

**Custom Middleware Implementation:**

```typescript
// src/lib/store/middleware/undoRedo.ts

import { StateCreator, Middleware } from "zustand";
import { Question } from "../../types";

interface UndoRedoState {
  history: {
    past: Question[][];
    present: Question[];
    future: Question[];
  };
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

interface UndoRedoConfig {
  maxHistorySize?: number;
  trackHistoryFor?: (action: string) => boolean;
}

const defaultConfig: Required<UndoRedoConfig> = {
  maxHistorySize: 50,
  trackHistoryFor: () => true, // Track all actions by default
};

export const undoRedoMiddleware = <T extends { questions: Question[] }>(
  config: UndoRedoConfig = {}
): Middleware<
  T & UndoRedoState,
  [],
  [["zustand/undo-redo", T & UndoRedoState]]
> => {
  const { maxHistorySize, trackHistoryFor } = { ...defaultConfig, ...config };

  return (config) => (set, get, api) => {
    const initialState = {
      history: {
        past: [],
        present: get().questions,
        future: [],
      },
      undo: () => {
        const state = get();
        const { past, present, future } = state.history;

        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, -1);

        set({
          questions: previous,
          history: {
            past: newPast,
            present: previous,
            future: [present, ...future],
          },
        });
      },
      redo: () => {
        const state = get();
        const { past, present, future } = state.history;

        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        set({
          questions: next,
          history: {
            past: [...past, present],
            present: next,
            future: newFuture,
          },
        });
      },
      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
      clearHistory: () => {
        const present = get().questions;
        set({
          history: {
            past: [],
            present,
            future: [],
          },
        });
      },
    };

    // Wrap the set function to track history
    const setWithHistory = (
      partial: Partial<T & UndoRedoState>,
      replace?: boolean
    ) => {
      const currentState = get();
      const currentQuestions = currentState.questions;

      // Check if this update should be tracked
      const shouldTrack = trackHistoryFor("update");

      if (shouldTrack && "questions" in partial) {
        const newQuestions = partial.questions as Question[];

        // Only track if questions actually changed
        if (JSON.stringify(currentQuestions) !== JSON.stringify(newQuestions)) {
          const { past, present } = currentState.history;
          const newPast = [...past, present];

          // Limit history size
          const trimmedPast = newPast.slice(-maxHistorySize);

          set({
            ...partial,
            history: {
              past: trimmedPast,
              present: newQuestions,
              future: [], // Clear future when new action is performed
            },
          } as T & UndoRedoState);
          return;
        }
      }

      // For non-question updates, just set normally
      set(partial, replace);
    };

    return config(setWithHistory as typeof set, get, {
      ...api,
      setState: setWithHistory,
    });
  };
};
```

**Usage in Store:**

```typescript
import { undoRedoMiddleware } from "./middleware/undoRedo";

export const useSurveyStore = create<SurveyState>()(
  undoRedoMiddleware({
    maxHistorySize: 50,
    trackHistoryFor: (action) => {
      // Track all question mutations
      const trackedActions = [
        "addQuestion",
        "removeQuestion",
        "updateQuestion",
        "changeType",
        "addOption",
        "updateOption",
        "removeOption",
        "moveUp",
        "moveDown",
      ];
      return trackedActions.includes(action);
    },
  })((set, get) => ({
    // ... store implementation
  }))
);
```

### 2. Persistence Middleware

**Using Zustand's Built-in Persist Middleware:**

```typescript
// src/lib/store/surveyStore.ts

import { persist, createJSONStorage } from "zustand/middleware";

// Storage configuration
const storage = createJSONStorage<SurveyState>(() => {
  // Use localStorage for persistence
  if (typeof window !== "undefined") {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
});

// Persist configuration
const persistConfig = {
  name: "survey-builder-storage",
  storage,
  partialize: (state: SurveyState) => ({
    // Only persist core survey data, not UI state or history
    questions: state.questions,
    selectedQuestionId: state.selectedQuestionId,
    // Don't persist: responses, UI state, history, async state
  }),
  version: 1,
  migrate: (persistedState: any, version: number) => {
    // Handle migrations if schema changes
    if (version === 0) {
      // Migrate from v0 to v1
      return {
        ...persistedState,
        // Add any new fields with defaults
      };
    }
    return persistedState;
  },
};

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    persistConfig
  )
);
```

**Advanced: Custom Storage with Debouncing**

For better performance, implement debounced persistence:

```typescript
// src/lib/store/storage/debouncedStorage.ts

interface DebouncedStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export function createDebouncedStorage(
  storage: Storage,
  delay: number = 1000
): DebouncedStorage {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingValue: string | null = null;

  return {
    getItem: (name: string) => {
      return storage.getItem(name);
    },

    setItem: (name: string, value: string) => {
      pendingValue = value;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (pendingValue !== null) {
          storage.setItem(name, pendingValue);
          pendingValue = null;
        }
      }, delay);
    },

    removeItem: (name: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingValue = null;
      storage.removeItem(name);
    },
  };
}

// Usage
const debouncedStorage = createDebouncedStorage(localStorage, 1000);
const storage = createJSONStorage(() => debouncedStorage);
```

### 3. Optimistic Updates Pattern

**Async Actions with Optimistic Updates:**

```typescript
// src/lib/store/actions/asyncActions.ts

interface AsyncActions {
  isSaving: boolean;
  lastSaveError: string | null;
  lastSavedAt: number | null;
  saveSurvey: (surveyId?: string) => Promise<void>;
  loadSurvey: (surveyId: string) => Promise<void>;
  syncSurvey: () => Promise<void>;
}

// API client interface (to be implemented)
interface SurveyApi {
  save: (survey: SurveyDefinition) => Promise<Survey>;
  load: (surveyId: string) => Promise<SurveyDefinition>;
  sync: (surveyId: string, localVersion: number) => Promise<SurveyDefinition>;
}

export const createAsyncActions = (
  api: SurveyApi
): StateCreator<SurveyState, [], [], AsyncActions> => {
  return (set, get) => ({
    isSaving: false,
    lastSaveError: null,
    lastSavedAt: null,

    saveSurvey: async (surveyId?: string) => {
      const state = get();

      // Optimistic update: set saving state immediately
      set({ isSaving: true, lastSaveError: null });

      try {
        const surveyDefinition: SurveyDefinition = {
          questions: state.questions,
        };

        // Perform the save
        const saved = await api.save(surveyDefinition);

        // Success: update state with server response
        set({
          isSaving: false,
          lastSavedAt: Date.now(),
          lastSaveError: null,
          // Optionally merge server response if it includes additional fields
        });
      } catch (error) {
        // Failure: revert optimistic update and show error
        set({
          isSaving: false,
          lastSaveError:
            error instanceof Error ? error.message : "Failed to save survey",
        });

        // Optionally: show toast notification or trigger error handler
        throw error;
      }
    },

    loadSurvey: async (surveyId: string) => {
      set({ isSaving: true, lastSaveError: null });

      try {
        const survey = await api.load(surveyId);

        set({
          questions: survey.questions,
          isSaving: false,
          lastSaveError: null,
          // Clear history when loading new survey
          history: {
            past: [],
            present: survey.questions,
            future: [],
          },
        });
      } catch (error) {
        set({
          isSaving: false,
          lastSaveError:
            error instanceof Error ? error.message : "Failed to load survey",
        });
        throw error;
      }
    },

    syncSurvey: async () => {
      const state = get();
      const surveyId = state.selectedQuestionId; // Or from URL/context

      if (!surveyId) return;

      set({ isSaving: true, lastSaveError: null });

      try {
        // Get local version timestamp
        const localVersion = state.lastSavedAt || 0;

        // Sync with server
        const remoteSurvey = await api.sync(surveyId, localVersion);

        // Merge strategy: prefer remote if newer, otherwise keep local
        const shouldUseRemote = remoteSurvey.updatedAt > localVersion;

        if (shouldUseRemote) {
          set({
            questions: remoteSurvey.questions,
            isSaving: false,
            lastSavedAt: remoteSurvey.updatedAt,
          });
        } else {
          // Local is newer, push it
          await get().saveSurvey(surveyId);
        }
      } catch (error) {
        set({
          isSaving: false,
          lastSaveError:
            error instanceof Error ? error.message : "Failed to sync survey",
        });
        throw error;
      }
    },
  });
};
```

**Optimistic Update with Rollback:**

```typescript
// Enhanced version with rollback capability
saveSurvey: async (surveyId?: string) => {
  const state = get();
  const previousQuestions = [...state.questions];
  const previousError = state.lastSaveError;

  // Optimistic update
  set({ isSaving: true, lastSaveError: null });

  try {
    const surveyDefinition: SurveyDefinition = {
      questions: state.questions,
    };

    const saved = await api.save(surveyDefinition);

    // Success
    set({
      isSaving: false,
      lastSavedAt: Date.now(),
      questions: saved.questions, // Use server response
    });
  } catch (error) {
    // Rollback on error
    set({
      questions: previousQuestions,
      isSaving: false,
      lastSaveError: error instanceof Error ? error.message : 'Failed to save',
    });

    // Could also show a toast notification here
    console.error('Save failed, rolled back:', error);
    throw error;
  }
},
```

## Complete Store Implementation

```typescript
// src/lib/store/surveyStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import {
  Question,
  SurveyResponse,
  QuestionType,
  MultipleChoiceResponse,
} from "../types";
import { QuestionAction } from "../questionsReducer";
import { questionsReducer, createInitialQuestions } from "../questionsReducer";
import { undoRedoMiddleware } from "./middleware/undoRedo";
import { createAsyncActions } from "./actions/asyncActions";

interface SurveyState {
  // Core state
  questions: Question[];
  selectedQuestionId?: string;
  responses: SurveyResponse;

  // UI state
  activeTab: "build" | "preview" | "json";
  isSidebarOpen: boolean;
  isJsonDrawerOpen: boolean;
  validationError: string | null;

  // History state
  history: {
    past: Question[][];
    present: Question[];
    future: Question[];
  };

  // Async state
  isSaving: boolean;
  lastSaveError: string | null;
  lastSavedAt: number | null;

  // Actions
  dispatch: (action: QuestionAction) => void;
  setSelectedQuestionId: (id: string | undefined) => void;
  setResponses: (responses: SurveyResponse) => void;
  updateResponse: (
    questionId: string,
    value: string | MultipleChoiceResponse
  ) => void;
  setActiveTab: (tab: "build" | "preview" | "json") => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsJsonDrawerOpen: (open: boolean) => void;
  setValidationError: (error: string | null) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Async actions
  saveSurvey: (surveyId?: string) => Promise<void>;
  loadSurvey: (surveyId: string) => Promise<void>;
  syncSurvey: () => Promise<void>;

  // Convenience actions
  addQuestion: () => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  changeQuestionType: (id: string, newType: QuestionType) => void;
  moveQuestionUp: (id: string) => void;
  moveQuestionDown: (id: string) => void;
}

const storage = createJSONStorage<SurveyState>(() => {
  if (typeof window !== "undefined") {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
});

export const useSurveyStore = create<SurveyState>()(
  devtools(
    persist(
      undoRedoMiddleware({
        maxHistorySize: 50,
      })((set, get) => ({
        // Initial state
        questions: createInitialQuestions(),
        selectedQuestionId: undefined,
        responses: {},
        activeTab: "build",
        isSidebarOpen: false,
        isJsonDrawerOpen: false,
        validationError: null,
        history: {
          past: [],
          present: createInitialQuestions(),
          future: [],
        },
        isSaving: false,
        lastSaveError: null,
        lastSavedAt: null,

        // Core actions
        dispatch: (action: QuestionAction) => {
          const currentQuestions = get().questions;
          const newQuestions = questionsReducer(currentQuestions, action);
          set({ questions: newQuestions });
        },

        setSelectedQuestionId: (id: string | undefined) => {
          set({ selectedQuestionId: id });
        },

        setResponses: (responses: SurveyResponse) => {
          set({ responses });
        },

        updateResponse: (
          questionId: string,
          value: string | MultipleChoiceResponse
        ) => {
          set((state) => ({
            responses: {
              ...state.responses,
              [questionId]: value,
            },
          }));
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
        setIsJsonDrawerOpen: (open) => set({ isJsonDrawerOpen: open }),
        setValidationError: (error) => set({ validationError: error }),

        // Convenience actions
        addQuestion: () => {
          const newQuestionId = crypto.randomUUID();
          get().dispatch({ type: "addQuestion", questionId: newQuestionId });
          get().setSelectedQuestionId(newQuestionId);
        },

        removeQuestion: (id: string) => {
          const wasSelected = get().selectedQuestionId === id;
          get().dispatch({ type: "removeQuestion", id });

          if (wasSelected) {
            const remaining = get().questions.filter((q) => q.id !== id);
            get().setSelectedQuestionId(
              remaining.length > 0 ? remaining[0].id : undefined
            );
          }
        },

        updateQuestion: (id: string, patch: Partial<Question>) => {
          get().dispatch({ type: "updateQuestion", id, patch });
        },

        changeQuestionType: (id: string, newType: QuestionType) => {
          get().dispatch({ type: "changeType", id, newType });
        },

        moveQuestionUp: (id: string) => {
          get().dispatch({ type: "moveUp", id });
        },

        moveQuestionDown: (id: string) => {
          get().dispatch({ type: "moveDown", id });
        },

        // History actions (implemented by middleware)
        undo: () => {
          // Implemented by undoRedoMiddleware
        },
        redo: () => {
          // Implemented by undoRedoMiddleware
        },
        canUndo: () => get().history.past.length > 0,
        canRedo: () => get().history.future.length > 0,
        clearHistory: () => {
          const present = get().questions;
          set({
            history: {
              past: [],
              present,
              future: [],
            },
          });
        },

        // Async actions (to be implemented with API)
        saveSurvey: async () => {
          // Placeholder - implement with actual API
          console.log("Saving survey...");
        },
        loadSurvey: async () => {
          // Placeholder - implement with actual API
          console.log("Loading survey...");
        },
        syncSurvey: async () => {
          // Placeholder - implement with actual API
          console.log("Syncing survey...");
        },
      }))
    ),
    {
      name: "survey-builder-storage",
      storage,
      partialize: (state) => ({
        questions: state.questions,
        selectedQuestionId: state.selectedQuestionId,
      }),
    }
  )
);
```

## Migration Strategy

### Phase 1: Install Dependencies

```bash
pnpm add zustand
```

### Phase 2: Create Store Structure

1. Create `src/lib/store/` directory
2. Implement middleware (`undoRedo.ts`)
3. Implement async actions (`asyncActions.ts`)
4. Create main store (`surveyStore.ts`)

### Phase 3: Update Components

**Before (page.tsx):**

```typescript
const [questions, dispatch] = useReducer(
  questionsReducer,
  createInitialQuestions()
);
const [selectedQuestionId, setSelectedQuestionId] = useState<
  string | undefined
>();
```

**After (page.tsx):**

```typescript
const questions = useSurveyStore((state) => state.questions);
const selectedQuestionId = useSurveyStore((state) => state.selectedQuestionId);
const dispatch = useSurveyStore((state) => state.dispatch);
const setSelectedQuestionId = useSurveyStore(
  (state) => state.setSelectedQuestionId
);
```

**Or with selectors for better performance:**

```typescript
const { questions, selectedQuestionId, dispatch, setSelectedQuestionId } =
  useSurveyStore();
```

### Phase 4: Add Undo/Redo UI

```typescript
// src/components/UndoRedoControls.tsx

import { useSurveyStore } from '@/lib/store/surveyStore';
import Button from './ui/Button';

export default function UndoRedoControls() {
  const canUndo = useSurveyStore((state) => state.canUndo());
  const canRedo = useSurveyStore((state) => state.canRedo());
  const undo = useSurveyStore((state) => state.undo);
  const redo = useSurveyStore((state) => state.redo);

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
      >
        ↶ Undo
      </Button>
      <Button
        variant="ghost"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
      >
        ↷ Redo
      </Button>
    </div>
  );
}
```

### Phase 5: Add Keyboard Shortcuts

```typescript
// src/hooks/useUndoRedoKeyboard.ts

import { useEffect } from "react";
import { useSurveyStore } from "@/lib/store/surveyStore";

export function useUndoRedoKeyboard() {
  const undo = useSurveyStore((state) => state.undo);
  const redo = useSurveyStore((state) => state.redo);
  const canUndo = useSurveyStore((state) => state.canUndo());
  const canRedo = useSurveyStore((state) => state.canRedo());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
```

### Phase 6: Add Save Status Indicator

```typescript
// src/components/SaveStatus.tsx

import { useSurveyStore } from '@/lib/store/surveyStore';

export default function SaveStatus() {
  const isSaving = useSurveyStore((state) => state.isSaving);
  const lastSaveError = useSurveyStore((state) => state.lastSaveError);
  const lastSavedAt = useSurveyStore((state) => state.lastSavedAt);

  if (isSaving) {
    return <span className="text-sm text-zinc-500">Saving...</span>;
  }

  if (lastSaveError) {
    return <span className="text-sm text-red-600">Save failed: {lastSaveError}</span>;
  }

  if (lastSavedAt) {
    const timeAgo = Math.floor((Date.now() - lastSavedAt) / 1000);
    return <span className="text-sm text-green-600">Saved {timeAgo}s ago</span>;
  }

  return null;
}
```

## Benefits of This Approach

### 1. Undo/Redo

- **User Experience**: Users can easily revert mistakes
- **Implementation**: Clean middleware pattern, no prop drilling
- **Performance**: History limited to 50 states by default
- **Flexibility**: Can configure which actions to track

### 2. Persistence

- **Automatic**: State persists to localStorage automatically
- **Selective**: Only persists necessary data (questions, selected ID)
- **Migration Support**: Can handle schema changes
- **Performance**: Debounced writes prevent excessive I/O

### 3. Optimistic Updates

- **Responsiveness**: UI updates immediately
- **Error Handling**: Automatic rollback on failure
- **User Feedback**: Clear save status indicators
- **Sync Support**: Built-in conflict resolution patterns

## Testing Strategy

### Unit Tests

```typescript
// src/lib/store/__tests__/surveyStore.test.ts

import { renderHook, act } from "@testing-library/react";
import { useSurveyStore } from "../surveyStore";

describe("SurveyStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useSurveyStore.setState({
      questions: [],
      history: { past: [], present: [], future: [] },
    });
  });

  it("should add a question", () => {
    const { result } = renderHook(() => useSurveyStore());

    act(() => {
      result.current.addQuestion();
    });

    expect(result.current.questions).toHaveLength(1);
  });

  it("should support undo/redo", () => {
    const { result } = renderHook(() => useSurveyStore());

    act(() => {
      result.current.addQuestion();
      result.current.addQuestion();
    });

    expect(result.current.questions).toHaveLength(2);
    expect(result.current.canUndo()).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.questions).toHaveLength(1);
    expect(result.current.canRedo()).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(result.current.questions).toHaveLength(2);
  });
});
```

## Performance Considerations

### 1. Selector Optimization

Use selectors to prevent unnecessary re-renders:

```typescript
// Bad: Component re-renders on any state change
const store = useSurveyStore();

// Good: Component only re-renders when questions change
const questions = useSurveyStore((state) => state.questions);
```

### 2. History Size Limits

- Default: 50 states
- Configurable based on memory constraints
- Consider implementing compression for large states

### 3. Persistence Debouncing

- Default: 1000ms delay
- Prevents excessive localStorage writes
- Configurable per use case

## Future Enhancements

1. **Collaborative Editing**: Add real-time sync with WebSockets
2. **Conflict Resolution**: Implement merge strategies for concurrent edits
3. **Offline Support**: Add service worker for offline persistence
4. **History Compression**: Compress history states to save memory
5. **Selective Persistence**: Allow users to choose what to persist
6. **Export/Import**: Add survey export/import functionality

## Dependencies

```json
{
  "dependencies": {
    "zustand": "^4.5.0"
  }
}
```

## File Structure

```
src/
  lib/
    store/
      surveyStore.ts          # Main store
      middleware/
        undoRedo.ts          # Undo/redo middleware
      actions/
        asyncActions.ts        # Async action implementations
      storage/
        debouncedStorage.ts  # Custom storage with debouncing
```

## Conclusion

This implementation plan provides a comprehensive approach to migrating to Zustand with:

- **Undo/Redo**: Custom middleware for history management
- **Persistence**: Built-in middleware with localStorage
- **Optimistic Updates**: Async action patterns with rollback

The migration can be done incrementally, starting with the store creation and gradually updating components. The middleware pattern keeps concerns separated and makes the codebase maintainable and extensible.
