# Step 4: Builder Area Component Implementation (Updated)

## Overview
Create the main question editing interface in the Builder area with expandable/collapsible question cards and full CRUD functionality. **No useEffect/useLayoutEffect for state synchronization** - handle selection logic in event handlers.

## Key Principle
Follow "You Might Not Need an Effect" - handle selection state updates directly in event handlers, not in effects.

## Implementation Details

### Files to Create

1. **`src/components/BuilderArea.tsx`**
   - Main container component for the builder
   - Renders vertical stack of QuestionCard components
   - Manages expanded question state (only one expanded at a time)
   - Receives props: questions, selectedQuestionId, dispatch, onSelectQuestion, onDeleteQuestion

2. **`src/components/QuestionCard.tsx`**
   - Individual question card component
   - Collapsed view: shows label (or "Untitled"), type, required indicator
   - Expanded view: full editing interface
   - Expand/collapse toggle behavior
   - For expanded question:
     - Label input field
     - Type selector (Text vs Multiple Choice)
     - Required toggle
     - For Multiple Choice: options list with add/remove/edit
     - Delete question button (calls onDeleteQuestion prop)
   - Receives props: question, isExpanded, isSelected, onExpand, onCollapse, onUpdate, onDelete, dispatch

### Files to Modify

1. **`src/app/page.tsx`**
   - Import BuilderArea component
   - Replace placeholder in build tab (lines 98-102) with BuilderArea
   - **Remove the useEffect that syncs selectedQuestionId** (lines 28-40)
   - **Update handleAddQuestion** to:
     - Dispatch the addQuestion action
     - Compute the new questions array
     - Select the newly added question (last item in array)
   - **Add handleDeleteQuestion** function that:
     - Dispatches removeQuestion action
     - Updates selectedQuestionId: if deleted question was selected, select first remaining question (or undefined if none)
   - **Use useMemo to derive valid selectedQuestionId**: if current selection doesn't exist in questions array, derive the correct one
   - Remove unused imports (useEffect, useRef) if not needed elsewhere

### Selection State Management (No Effects)

**Approach:**
1. **Adding a question**: In `handleAddQuestion`, after dispatching, compute the new questions array and select the last question
2. **Deleting a question**: In `handleDeleteQuestion`, after dispatching, check if deleted question was selected, then select first remaining or clear
3. **Derived validation**: Use `useMemo` to ensure selectedQuestionId always points to a valid question (fallback to first question if invalid)

**Implementation pattern:**
```typescript
// In handleAddQuestion:
const newQuestions = questionsReducer(questions, { type: "addQuestion" });
dispatch({ type: "addQuestion" });
// After dispatch, questions will update on next render, but we can compute the new ID
// Better: dispatch and then use a callback or compute from current state

// Actually, better approach: dispatch first, then in the same handler,
// use the reducer function to compute what the new state will be
const tempNewQuestions = questionsReducer(questions, { type: "addQuestion" });
dispatch({ type: "addQuestion" });
if (tempNewQuestions.length > 0) {
  const newQuestion = tempNewQuestions[tempNewQuestions.length - 1];
  setSelectedQuestionId(newQuestion.id);
}
```

**OR simpler:**
Since the reducer creates a new question with a random UUID, we can't predict the ID. Instead:
- Dispatch the action
- Use a ref or callback pattern, OR
- Let the component re-render and use useMemo to derive the selection

**Best approach:**
- Use `useMemo` to compute a "valid" selectedQuestionId that ensures it exists in questions
- In `handleAddQuestion`, dispatch then immediately compute what the new questions will be and select the last one
- In `handleDeleteQuestion`, handle selection update in the same function

### Key Features

- **Expand/Collapse**: Only one question card expanded at a time
- **Auto-expand**: When a question is selected from sidebar, expand its card (handled in BuilderArea)
- **Scroll-to**: Scroll expanded question into view when selected (use refs and scrollIntoView, no effect needed)
- **Question Editing**:
  - Label input (updates via `updateQuestion` action)
  - Type selector (updates via `changeType` action)
  - Required toggle (updates via `updateQuestion` action)
- **Multiple Choice Options**:
  - List of option inputs
  - Add option button (dispatches `addOption`)
  - Remove option button per option (dispatches `removeOption`)
  - Update option text (dispatches `updateOption`)
- **Delete Question**: Button to remove question (calls onDeleteQuestion handler)

### State Management

- **NO useEffect/useLayoutEffect for state synchronization**
- Handle selection updates in event handlers (handleAddQuestion, handleDeleteQuestion)
- Use useMemo to derive/validate selectedQuestionId when questions change
- Dispatch actions to questionsReducer for all mutations
- Local state in BuilderArea for tracking which question is expanded (not derived from questions)

### Styling

- Use Tailwind classes consistent with existing design
- Collapsed cards: minimal, clean header row
- Expanded cards: full editing form with proper spacing
- Subtle borders and hover states
- Match existing zinc color scheme


