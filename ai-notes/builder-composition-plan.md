# Builder Area Composition Plan: Component Composition with Context

## Overview

This document outlines a meta plan for refactoring the builder area to use component composition with React Context. The goal is to create a simple, extensible system where components can be easily composed, state is lifted via context, and features like drag-and-drop and click handling are pluggable.

## Core Principles

1. **Composition over Configuration**: Build complex behaviors from simple, composable components
2. **Context for State Lifting**: Use React Context to lift state and avoid prop drilling
3. **Pluggable Features**: Drag-and-drop, click handling, and other interactions are separate, composable components
4. **Simple JSX Composition**: Developers can use components or plain JSX as needed
5. **Type Safety**: Maintain type safety with discriminated unions for question types

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  BuilderArea (Container)                                 │
│  - Provides BuilderContext                               │
│  - Composes interaction components                        │
│  - Renders question list                                 │
└─────────────────────────────────────────────────────────┘
         │
         ├─── BuilderContext (State Management)
         │    - questions: Question[]
         │    - selectedQuestionId: string | undefined
         │    - dispatch: (action) => void
         │    - handlers: { onSelect, onDelete, etc. }
         │
         ├─── DragAndDropHandler (Composable)
         │    - Wraps question items
         │    - Handles drag events
         │    - Calls onReorder callback
         │
         ├─── ClickHandler (Composable)
         │    - Handles click events
         │    - Manages selection state
         │    - Prevents event bubbling where needed
         │
         └─── QuestionCard (Consumer)
              - Uses BuilderContext
              - Renders question UI
              - Type-specific builders via config
```

## 1. Builder Context: State Lifting

### Context Definition

```typescript
// src/contexts/BuilderContext.tsx

interface BuilderContextValue {
  // State
  questions: Question[];
  selectedQuestionId?: string;
  
  // Actions
  dispatch: React.Dispatch<QuestionAction>;
  selectQuestion: (id: string) => void;
  deselectQuestion: () => void;
  deleteQuestion: (id: string) => void;
  addQuestion: () => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  
  // Computed
  selectedQuestion?: Question;
  isSelected: (id: string) => boolean;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useBuilderContext() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilderContext must be used within BuilderProvider');
  }
  return context;
}
```

### Provider Implementation

```typescript
// src/contexts/BuilderContext.tsx

interface BuilderProviderProps {
  questions: Question[];
  dispatch: React.Dispatch<QuestionAction>;
  selectedQuestionId?: string;
  onSelectQuestion: (id: string) => void;
  children: React.ReactNode;
}

export function BuilderProvider({
  questions,
  dispatch,
  selectedQuestionId,
  onSelectQuestion,
  children,
}: BuilderProviderProps) {
  const selectQuestion = useCallback((id: string) => {
    onSelectQuestion(id);
  }, [onSelectQuestion]);

  const deselectQuestion = useCallback(() => {
    onSelectQuestion(undefined);
  }, [onSelectQuestion]);

  const deleteQuestion = useCallback((id: string) => {
    dispatch({ type: 'removeQuestion', id });
    if (selectedQuestionId === id) {
      deselectQuestion();
    }
  }, [dispatch, selectedQuestionId, deselectQuestion]);

  const addQuestion = useCallback(() => {
    dispatch({ type: 'addQuestion' });
  }, [dispatch]);

  const reorderQuestions = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'reorder', fromIndex, toIndex });
  }, [dispatch]);

  const selectedQuestion = useMemo(
    () => questions.find(q => q.id === selectedQuestionId),
    [questions, selectedQuestionId]
  );

  const isSelected = useCallback((id: string) => {
    return id === selectedQuestionId;
  }, [selectedQuestionId]);

  const value: BuilderContextValue = {
    questions,
    selectedQuestionId,
    dispatch,
    selectQuestion,
    deselectQuestion,
    deleteQuestion,
    addQuestion,
    reorderQuestions,
    selectedQuestion,
    isSelected,
  };

  return (
    <BuilderContext.Provider value={value}>
      {children}
    </BuilderContext.Provider>
  );
}
```

## 2. Builder Area: Composable Container

### Simple Composition Pattern

```typescript
// src/components/BuilderArea.tsx

interface BuilderAreaProps {
  questions: Question[];
  selectedQuestionId?: string;
  dispatch: React.Dispatch<QuestionAction>;
  onSelectQuestion: (id: string) => void;
  onAddQuestion: () => void;
  
  // Optional composable features
  enableDragAndDrop?: boolean;
  enableClickSelection?: boolean;
  renderQuestion?: (question: Question, index: number) => React.ReactNode;
}

export default function BuilderArea({
  questions,
  selectedQuestionId,
  dispatch,
  onSelectQuestion,
  onAddQuestion,
  enableDragAndDrop = true,
  enableClickSelection = true,
  renderQuestion,
}: BuilderAreaProps) {
  return (
    <BuilderProvider
      questions={questions}
      dispatch={dispatch}
      selectedQuestionId={selectedQuestionId}
      onSelectQuestion={onSelectQuestion}
    >
      <div className="p-4 md:p-6">
        <BuilderContent
          enableDragAndDrop={enableDragAndDrop}
          enableClickSelection={enableClickSelection}
          renderQuestion={renderQuestion}
          onAddQuestion={onAddQuestion}
        />
      </div>
    </BuilderProvider>
  );
}
```

### Builder Content: Composable Features

```typescript
// src/components/BuilderArea.tsx (internal component)

interface BuilderContentProps {
  enableDragAndDrop: boolean;
  enableClickSelection: boolean;
  renderQuestion?: (question: Question, index: number) => React.ReactNode;
  onAddQuestion: () => void;
}

function BuilderContent({
  enableDragAndDrop,
  enableClickSelection,
  renderQuestion,
  onAddQuestion,
}: BuilderContentProps) {
  const { questions, addQuestion } = useBuilderContext();

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 mb-4">No questions yet</p>
        <Button variant="primary" onClick={onAddQuestion || addQuestion}>
          Add question
        </Button>
      </div>
    );
  }

  const QuestionList = enableDragAndDrop
    ? DragAndDropQuestionList
    : SimpleQuestionList;

  return (
    <div className="space-y-4 max-w-3xl">
      <QuestionList
        questions={questions}
        enableClickSelection={enableClickSelection}
        renderQuestion={renderQuestion}
      />
      <Button variant="secondary" onClick={onAddQuestion || addQuestion} className="w-full">
        + Add question
      </Button>
    </div>
  );
}
```

## 3. Composable Interaction Components

### Drag and Drop Handler

```typescript
// src/components/builder/DragAndDropHandler.tsx

interface DragAndDropHandlerProps {
  questionId: string;
  index: number;
  children: React.ReactNode;
  onDragStart?: (questionId: string, index: number) => void;
  onDragEnd?: () => void;
  onDrop?: (fromIndex: number, toIndex: number) => void;
}

export function DragAndDropHandler({
  questionId,
  index,
  children,
  onDragStart,
  onDragEnd,
  onDrop,
}: DragAndDropHandlerProps) {
  const { reorderQuestions } = useBuilderContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', questionId);
    onDragStart?.(questionId, index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverIndex(null);
    onDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedQuestionId = e.dataTransfer.getData('text/plain');
    
    if (draggedQuestionId !== questionId) {
      const { questions } = useBuilderContext();
      const fromIndex = questions.findIndex(q => q.id === draggedQuestionId);
      const toIndex = index;
      
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderQuestions(fromIndex, toIndex);
        onDrop?.(fromIndex, toIndex);
      }
    }
    
    setIsDragging(false);
    setDragOverIndex(null);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'transition-opacity',
        isDragging && 'opacity-50',
        dragOverIndex === index && 'border-2 border-blue-500'
      )}
    >
      {children}
    </div>
  );
}
```

### Click Handler

```typescript
// src/components/builder/ClickHandler.tsx

interface ClickHandlerProps {
  questionId: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  preventPropagation?: boolean;
  stopPropagation?: boolean;
}

export function ClickHandler({
  questionId,
  children,
  onClick,
  preventPropagation = false,
  stopPropagation = false,
}: ClickHandlerProps) {
  const { selectQuestion, isSelected } = useBuilderContext();

  const handleClick = (e: React.MouseEvent) => {
    if (preventPropagation) {
      e.preventDefault();
    }
    if (stopPropagation) {
      e.stopPropagation();
    }
    
    selectQuestion(questionId);
    onClick?.(e);
  };

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  );
}
```

## 4. Question List Components

### Simple Question List (No Drag and Drop)

```typescript
// src/components/builder/SimpleQuestionList.tsx

interface SimpleQuestionListProps {
  questions: Question[];
  enableClickSelection: boolean;
  renderQuestion?: (question: Question, index: number) => React.ReactNode;
}

export function SimpleQuestionList({
  questions,
  enableClickSelection,
  renderQuestion,
}: SimpleQuestionListProps) {
  return (
    <>
      {questions.map((question, index) => {
        const content = renderQuestion ? (
          renderQuestion(question, index)
        ) : (
          <QuestionCard key={question.id} question={question} index={index} />
        );

        return enableClickSelection ? (
          <ClickHandler key={question.id} questionId={question.id}>
            {content}
          </ClickHandler>
        ) : (
          <React.Fragment key={question.id}>{content}</React.Fragment>
        );
      })}
    </>
  );
}
```

### Drag and Drop Question List

```typescript
// src/components/builder/DragAndDropQuestionList.tsx

interface DragAndDropQuestionListProps {
  questions: Question[];
  enableClickSelection: boolean;
  renderQuestion?: (question: Question, index: number) => React.ReactNode;
}

export function DragAndDropQuestionList({
  questions,
  enableClickSelection,
  renderQuestion,
}: DragAndDropQuestionListProps) {
  return (
    <>
      {questions.map((question, index) => {
        const content = renderQuestion ? (
          renderQuestion(question, index)
        ) : (
          <QuestionCard key={question.id} question={question} index={index} />
        );

        const wrappedContent = enableClickSelection ? (
          <ClickHandler questionId={question.id}>
            {content}
          </ClickHandler>
        ) : (
          content
        );

        return (
          <DragAndDropHandler
            key={question.id}
            questionId={question.id}
            index={index}
          >
            {wrappedContent}
          </DragAndDropHandler>
        );
      })}
    </>
  );
}
```

## 5. Question Card: Context Consumer

### Simplified Question Card

```typescript
// src/components/QuestionCard.tsx

interface QuestionCardProps {
  question: Question;
  index: number;
}

export default function QuestionCard({ question, index }: QuestionCardProps) {
  const { isSelected, dispatch, deleteQuestion } = useBuilderContext();
  const selected = isSelected(question.id);
  
  const { builder: BuilderComponent } = getQuestionTypeConfig(question.type);

  if (!selected) {
    return (
      <Card variant="hover">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm text-zinc-900 truncate">
              {question.label || "Untitled question"}
            </span>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {getQuestionTypeLabel(question.type)}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="selected">
      <div className="p-4 space-y-4">
        {/* Common fields */}
        <QuestionLabelInput question={question} />
        <QuestionTypeSelector question={question} />
        <RequiredToggle question={question} />
        
        {/* Type-specific builder */}
        <BuilderComponent
          question={question}
          onChange={(updates) => {
            dispatch({
              type: 'updateQuestion',
              id: question.id,
              patch: updates,
            });
          }}
        />
        
        <Button variant="destructive" onClick={() => deleteQuestion(question.id)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
```

## 6. Flexible Composition Examples

### Example 1: Simple Usage (Default Behavior)

```typescript
<BuilderArea
  questions={questions}
  selectedQuestionId={selectedQuestionId}
  dispatch={dispatch}
  onSelectQuestion={setSelectedQuestionId}
  onAddQuestion={handleAddQuestion}
/>
```

### Example 2: Custom Question Rendering

```typescript
<BuilderArea
  questions={questions}
  selectedQuestionId={selectedQuestionId}
  dispatch={dispatch}
  onSelectQuestion={setSelectedQuestionId}
  onAddQuestion={handleAddQuestion}
  renderQuestion={(question, index) => (
    <CustomQuestionCard
      question={question}
      index={index}
      customProp="value"
    />
  )}
/>
```

### Example 3: Disable Drag and Drop

```typescript
<BuilderArea
  questions={questions}
  selectedQuestionId={selectedQuestionId}
  dispatch={dispatch}
  onSelectQuestion={setSelectedQuestionId}
  onAddQuestion={handleAddQuestion}
  enableDragAndDrop={false}
/>
```

### Example 4: Manual Composition (Full Control)

```typescript
<BuilderProvider
  questions={questions}
  dispatch={dispatch}
  selectedQuestionId={selectedQuestionId}
  onSelectQuestion={setSelectedQuestionId}
>
  <div className="p-4">
    {questions.map((question, index) => (
      <DragAndDropHandler
        key={question.id}
        questionId={question.id}
        index={index}
      >
        <ClickHandler questionId={question.id}>
          <CustomQuestionWrapper>
            <QuestionCard question={question} index={index} />
          </CustomQuestionWrapper>
        </ClickHandler>
      </DragAndDropHandler>
    ))}
  </div>
</BuilderProvider>
```

## 7. Integration with Question Type System

The builder composition system works seamlessly with the question type system:

1. **QuestionCard** uses `getQuestionTypeConfig()` to get the appropriate builder component
2. **Type-specific builders** receive typed questions via discriminated unions
3. **Context** provides `dispatch` for type-safe updates
4. **Factory functions** handle type conversions when needed

```typescript
// QuestionCard automatically uses the right builder
const { builder: BuilderComponent } = getQuestionTypeConfig(question.type);

// BuilderComponent is type-safe
<BuilderComponent
  question={question} // TypeScript knows this is TextQuestion | MultipleChoiceQuestion
  onChange={(updates) => {
    // Type-safe updates
  }}
/>
```

## 8. Benefits of This Approach

### ✅ Simplicity
- Simple JSX composition
- No complex prop drilling
- Clear component boundaries

### ✅ Extensibility
- Easy to add new interaction handlers (keyboard navigation, touch gestures, etc.)
- Can compose features as needed
- Custom rendering without modifying core components

### ✅ Testability
- Each component has a single responsibility
- Context can be mocked easily
- Interaction handlers are isolated

### ✅ Flexibility
- Use default behavior or customize
- Mix and match features
- Plain JSX or components

### ✅ Type Safety
- Context is fully typed
- Discriminated unions for question types
- Compile-time guarantees

## 9. Migration Path

### Phase 1: Add Context (Non-Breaking)
1. Create `BuilderContext` and `BuilderProvider`
2. Wrap `BuilderArea` with provider
3. Update `QuestionCard` to use context (keep props as fallback)
4. Test that existing behavior works

### Phase 2: Add Composable Features
1. Create `DragAndDropHandler` component
2. Create `ClickHandler` component
3. Create `SimpleQuestionList` and `DragAndDropQuestionList`
4. Update `BuilderArea` to use composable lists
5. Test drag and drop functionality

### Phase 3: Simplify QuestionCard
1. Remove prop drilling from `QuestionCard`
2. Use context exclusively
3. Update all consumers to use context
4. Remove old prop-based API

### Phase 4: Add Reducer Action for Reordering
1. Add `reorder` action to `questionsReducer`
2. Update `DragAndDropHandler` to use reducer action
3. Test reordering functionality

## 10. File Structure

```
src/
  contexts/
    BuilderContext.tsx          # Context definition and provider
  components/
    BuilderArea.tsx              # Main container component
    QuestionCard.tsx             # Question card (uses context)
    builder/
      DragAndDropHandler.tsx     # Drag and drop composable
      ClickHandler.tsx            # Click handling composable
      SimpleQuestionList.tsx      # List without drag and drop
      DragAndDropQuestionList.tsx # List with drag and drop
      QuestionLabelInput.tsx      # Extracted common field
      QuestionTypeSelector.tsx    # Extracted common field
      RequiredToggle.tsx          # Extracted common field
```

## 11. Key Design Decisions

### Why Context Instead of Props?
- **Reduces prop drilling**: No need to pass `dispatch`, `selectedQuestionId`, etc. through multiple levels
- **Easier composition**: Components can access state without explicit prop passing
- **Better for extensibility**: New features can access context without modifying parent components

### Why Composable Components?
- **Flexibility**: Can enable/disable features as needed
- **Reusability**: Handlers can be used in different contexts
- **Testability**: Each handler is isolated and testable

### Why Not Compound Components?
- **Simplicity**: Direct composition is easier to understand
- **Flexibility**: Can use JSX or components as needed
- **Less abstraction**: Fewer layers to understand

### Why Keep QuestionCard Simple?
- **Single responsibility**: Renders question UI, delegates to type-specific builders
- **Context access**: Gets all needed state/actions from context
- **Type safety**: Uses discriminated unions for question types

## 12. Future Extensions

This architecture makes it easy to add:

- **Keyboard Navigation**: `KeyboardHandler` component
- **Touch Gestures**: `TouchHandler` component
- **Multi-select**: Extend context with selection array
- **Bulk Operations**: Add to context actions
- **Undo/Redo**: Wrap context with history middleware
- **Virtualization**: Replace list components with virtualized versions

## Conclusion

This plan provides a simple, extensible foundation for the builder area using:
- **Context** for state lifting
- **Composition** for flexible feature assembly
- **Type safety** with discriminated unions
- **Simplicity** in usage and extension

The system is designed to be:
- Easy to use (default behavior works out of the box)
- Easy to extend (compose new features)
- Easy to test (isolated components)
- Easy to understand (clear component boundaries)

