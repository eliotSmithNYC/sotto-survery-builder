# Selection and Interaction Patterns

## Current Behavior Analysis

### Selection Sources

The application supports question selection from multiple entry points:

1. **Sidebar Selection** (`QuestionSidebar.tsx`)
   - Clicking a question in the sidebar selects it
   - Closes mobile sidebar after selection
   - Uses `handleQuestionClick` which calls `onSelectQuestion(questionId)`

2. **Builder Area Selection** (`QuestionCard.tsx`)
   - Clicking anywhere on the card selects it (via `Card` component's `onClick={onSelect}`)
   - Inputs have `onFocus={onSelect}` to select when focused
   - Uses `stopPropagation` extensively to prevent card click from interfering with input interactions

3. **Preview Area Selection** (`PreviewArea.tsx`, `PreviewQuestion.tsx`)
   - Focusing inputs in preview selects the question (`onFocus={() => onSelectQuestion?.(question.id)}`)
   - No card-level click handler in preview (inputs are the only selection mechanism)

### Scroll Behavior

**Current Implementation:**

- **PreviewArea**: Has scroll logic using `useEffect` + `scrollIntoView` when `selectedQuestionId` changes
- **BuilderArea**: No scroll logic currently implemented
- **Sidebar**: No scroll logic (but sidebar itself is scrollable)

**Gap Identified:**

- When selecting a question from the sidebar, the BuilderArea doesn't scroll to show the selected question
- When adding a new question, it should scroll to the newly created question

### stopPropagation Usage

**In QuestionCard.tsx:**

- Delete button (line 112)
- Label input (line 133) - both `onClick` and `onFocus`
- Type select (line 155) - both `onClick` and `onFocus`
- Required checkbox (line 174) - both `onClick` and `onFocus`
- Option inputs (line 204) - both `onClick` and `onFocus`
- Remove option button (line 218)
- Add option button (line 231) - **NOTE: Currently doesn't select the question**

**In QuestionSidebar.tsx:**

- Move up button (line 34)
- Move down button (line 39)

**Why stopPropagation is needed:**

- The `Card` component has `onClick={onSelect}` making the entire card clickable
- Interactive elements inside (inputs, buttons) need to prevent their clicks from bubbling up to the card's click handler
- This allows users to interact with inputs without accidentally triggering selection

## Issues and Gaps

### 1. Missing Selection on "Add Option" Button

- The "Add option" button in `QuestionCard` has `stopPropagation` but doesn't call `onSelect`
- User expectation: Clicking "Add option" should select the question (as mentioned in requirements)

### 2. Inconsistent Scroll Behavior

- PreviewArea scrolls to selected question
- BuilderArea doesn't scroll when question is selected from sidebar
- No scroll when adding a new question

### 3. Code Duplication

- Selection logic scattered across components
- Similar patterns repeated in multiple places
- Hard to maintain and extend for new question types

### 4. Abstraction Gaps

- Each new question type would need to reimplement:
  - Card click handling
  - Input focus handling
  - stopPropagation patterns
  - Selection callbacks

## Mature Approach Recommendations

### 1. Custom Hooks for Reusable Logic

#### `useScrollToQuestion` Hook

Create a reusable hook that handles scroll behavior for any scrollable container:

```typescript
// src/lib/hooks/useScrollToQuestion.ts
function useScrollToQuestion(
  selectedQuestionId: string | undefined,
  scrollOptions?: ScrollIntoViewOptions
) {
  const questionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (selectedQuestionId && questionRefs.current[selectedQuestionId]) {
      questionRefs.current[selectedQuestionId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        ...scrollOptions,
      });
    }
  }, [selectedQuestionId, scrollOptions]);

  const setQuestionRef = useCallback(
    (questionId: string, element: HTMLElement | null) => {
      questionRefs.current[questionId] = element;
    },
    []
  );

  return { setQuestionRef };
}
```

**Benefits:**

- Reusable across PreviewArea, BuilderArea, and any future scrollable areas
- Consistent scroll behavior
- Easy to adjust scroll options per context

#### `useInteractiveElement` Hook

Abstract the common pattern of "stop propagation + optionally select":

```typescript
// src/lib/hooks/useInteractiveElement.ts
type InteractionType = "select" | "ignore" | "custom";

interface UseInteractiveElementOptions {
  onSelect?: () => void;
  interactionType?: InteractionType;
  customHandler?: (e: React.MouseEvent) => void;
}

function useInteractiveElement({
  onSelect,
  interactionType = "ignore",
  customHandler,
}: UseInteractiveElementOptions) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (interactionType === "select" && onSelect) {
        onSelect();
      }
      customHandler?.(e);
    },
    [onSelect, interactionType, customHandler]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent) => {
      if (interactionType === "select" && onSelect) {
        onSelect();
      }
    },
    [onSelect, interactionType]
  );

  return {
    onClick: handleClick,
    onFocus: interactionType === "select" ? handleFocus : undefined,
  };
}
```

**Usage Example:**

```typescript
// In QuestionCard.tsx
const addOptionHandlers = useInteractiveElement({
  onSelect,
  interactionType: "select",
  customHandler: handleAddOption,
});

<Button {...addOptionHandlers}>+ Add option</Button>

// For inputs that should select on focus
const inputHandlers = useInteractiveElement({
  onSelect,
  interactionType: "select",
});

<Input {...inputHandlers} />

// For buttons that should NOT select
const deleteHandlers = useInteractiveElement({
  interactionType: "ignore",
  customHandler: onDelete,
});

<Button {...deleteHandlers}>Delete</Button>
```

**Benefits:**

- Eliminates manual `stopPropagation` calls
- Makes selection intent explicit via `interactionType`
- Reduces boilerplate for new question types
- Type-safe interaction patterns

### 2. Component Abstractions

#### `InteractiveWrapper` Component

A wrapper component that handles the stopPropagation pattern for any child element:

```typescript
// src/components/ui/InteractiveWrapper.tsx
interface InteractiveWrapperProps {
  children: React.ReactElement;
  onSelect?: () => void;
  interactionType?: "select" | "ignore";
  onClick?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
}

function InteractiveWrapper({
  children,
  onSelect,
  interactionType = "ignore",
  onClick,
  onFocus,
}: InteractiveWrapperProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactionType === "select" && onSelect) {
      onSelect();
    }
    onClick?.(e);
  };

  const handleFocus = (e: React.FocusEvent) => {
    if (interactionType === "select" && onSelect) {
      onSelect();
    }
    onFocus?.(e);
  };

  return React.cloneElement(children, {
    onClick: handleClick,
    onFocus: handleFocus,
  });
}
```

**Usage:**

```typescript
<InteractiveWrapper onSelect={onSelect} interactionType="select">
  <Button onClick={handleAddOption}>+ Add option</Button>
</InteractiveWrapper>
```

**Benefits:**

- Works with any component without prop drilling
- Clear intent through `interactionType` prop
- Can wrap multiple elements consistently

#### `QuestionCardContainer` Component

A container component that encapsulates all question card interaction logic:

```typescript
// src/components/QuestionCardContainer.tsx
interface QuestionCardContainerProps {
  questionId: string;
  isSelected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
}

function QuestionCardContainer({
  questionId,
  isSelected,
  onSelect,
  children,
  className,
}: QuestionCardContainerProps) {
  return (
    <div ref={(el) => setQuestionRef(questionId, el)}>
      <Card variant={isSelected ? "selected" : "hover"} onClick={onSelect}>
        {children}
      </Card>
    </div>
  );
}
```

**Benefits:**

- Centralizes card-level selection logic
- Can integrate scroll refs automatically
- Consistent card behavior across question types

### 3. Selection Context Pattern

Create a context that manages selection state and coordinates scrolling:

```typescript
// src/contexts/QuestionSelectionContext.tsx
interface QuestionSelectionContextValue {
  selectedQuestionId: string | undefined;
  selectQuestion: (questionId: string) => void;
  registerScrollTarget: (questionId: string, element: HTMLElement | null) => void;
  scrollToQuestion: (questionId: string) => void;
}

const QuestionSelectionContext = createContext<QuestionSelectionContextValue | null>(null);

export function QuestionSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | undefined>();
  const scrollTargets = useRef<Record<string, HTMLElement | null>>({});

  const selectQuestion = useCallback((questionId: string) => {
    setSelectedQuestionId(questionId);
    // Auto-scroll happens via useEffect in hook
  }, []);

  const registerScrollTarget = useCallback((questionId: string, element: HTMLElement | null) => {
    scrollTargets.current[questionId] = element;
  }, []);

  const scrollToQuestion = useCallback((questionId: string) => {
    scrollTargets.current[questionId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  useEffect(() => {
    if (selectedQuestionId) {
      scrollToQuestion(selectedQuestionId);
    }
  }, [selectedQuestionId, scrollToQuestion]);

  return (
    <QuestionSelectionContext.Provider
      value={{ selectedQuestionId, selectQuestion, registerScrollTarget, scrollToQuestion }}
    >
      {children}
    </QuestionSelectionContext.Provider>
  );
}
```

**Benefits:**

- Single source of truth for selection state
- Automatic coordination between selection and scrolling
- Components don't need to pass selection props through multiple layers
- Easy to add new selection behaviors (e.g., keyboard navigation)

### 4. Event Handler Factory Pattern

Create factory functions that generate consistent event handlers:

```typescript
// src/lib/questionInteractions.ts
export function createQuestionInteractionHandlers(
  questionId: string,
  options: {
    onSelect: (questionId: string) => void;
    onAction?: (questionId: string) => void;
    shouldSelect?: boolean;
  }
) {
  const { onSelect, onAction, shouldSelect = false } = options;

  return {
    // For card-level clicks
    onCardClick: () => onSelect(questionId),

    // For interactive elements that should select
    onInteractiveClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (shouldSelect) {
        onSelect(questionId);
      }
      onAction?.(questionId);
    },

    // For inputs that should select on focus
    onInputFocus: () => {
      if (shouldSelect) {
        onSelect(questionId);
      }
    },

    // For interactive elements that should NOT select
    onActionOnly: (e: React.MouseEvent) => {
      e.stopPropagation();
      onAction?.(questionId);
    },
  };
}
```

**Usage:**

```typescript
const handlers = createQuestionInteractionHandlers(question.id, {
  onSelect: onSelectQuestion,
  shouldSelect: true,
});

<Input onFocus={handlers.onInputFocus} onClick={handlers.onInteractiveClick} />
```

### 5. Composable Question Card Pattern

Structure question cards to be composable with clear interaction boundaries:

```typescript
// src/components/question-types/BaseQuestionCard.tsx
interface BaseQuestionCardProps {
  question: Question;
  isSelected: boolean;
  onSelect: () => void;
  renderHeader: (handlers: InteractionHandlers) => React.ReactNode;
  renderFields: (handlers: InteractionHandlers) => React.ReactNode;
  renderTypeSpecific?: (handlers: InteractionHandlers) => React.ReactNode;
}

function BaseQuestionCard({
  question,
  isSelected,
  onSelect,
  renderHeader,
  renderFields,
  renderTypeSpecific,
}: BaseQuestionCardProps) {
  const handlers = useQuestionInteractionHandlers({ onSelect });

  return (
    <Card variant={isSelected ? "selected" : "hover"} onClick={onSelect}>
      {renderHeader(handlers)}
      {renderFields(handlers)}
      {renderTypeSpecific?.(handlers)}
    </Card>
  );
}
```

**Benefits:**

- Clear separation between common and type-specific logic
- New question types only need to implement `renderTypeSpecific`
- All interaction patterns handled in base component

### 6. Recommended Implementation Strategy

**Phase 1: Fix Immediate Issues**

1. Add `onSelect()` call to "Add option" button
2. Implement scroll behavior in BuilderArea using `useScrollToQuestion` hook
3. Ensure scroll happens when selecting from sidebar

**Phase 2: Extract Reusable Hooks**

1. Create `useScrollToQuestion` hook
2. Create `useInteractiveElement` hook
3. Refactor existing components to use hooks

**Phase 3: Component Abstractions**

1. Create `InteractiveWrapper` component
2. Refactor QuestionCard to use new abstractions
3. Update QuestionSidebar to use consistent patterns

**Phase 4: Advanced Patterns (Optional)**

1. Consider Selection Context if prop drilling becomes problematic
2. Implement composable card pattern for new question types
3. Add keyboard navigation support

### 7. Key Principles for New Question Types

When adding a new question type, developers should only need to:

1. **Define the question data structure** (already in types)
2. **Render the type-specific UI** (inputs, controls, etc.)
3. **Wrap interactive elements** with `InteractiveWrapper` or use `useInteractiveElement` hook
4. **Specify interaction type** (`"select"` or `"ignore"`) for each interactive element

**Example for a new "Rating" question type:**

```typescript
function RatingQuestionCard({ question, isSelected, onSelect, ... }) {
  const inputHandlers = useInteractiveElement({
    onSelect,
    interactionType: "select",
  });

  const addScaleHandlers = useInteractiveElement({
    onSelect,
    interactionType: "select",
    customHandler: handleAddScale,
  });

  return (
    <Card onClick={onSelect}>
      <Input {...inputHandlers} />
      <Button {...addScaleHandlers}>Add scale point</Button>
    </Card>
  );
}
```

**Benefits:**

- No need to remember `stopPropagation`
- No need to manually wire up selection
- Clear intent through `interactionType`
- Consistent behavior across all question types

### 8. Testing Considerations

With these abstractions, testing becomes easier:

- Test hooks in isolation
- Test interaction types independently
- Mock scroll behavior easily
- Verify selection logic without UI complexity

### Summary

The mature approach focuses on:

1. **Abstraction**: Hooks and components that encapsulate common patterns
2. **Explicitness**: Clear intent through `interactionType` rather than implicit behavior
3. **Reusability**: Patterns that work across all question types
4. **Maintainability**: Single source of truth for interaction logic
5. **Extensibility**: Easy to add new question types without reimplementing interaction patterns

This approach eliminates the need for developers to remember:

- When to call `stopPropagation`
- When to call `onSelect`
- How to implement scrolling
- How to coordinate selection across multiple areas

Instead, they declare their intent (`interactionType="select"`) and the system handles the rest.
