# Step 5: Preview Area Component - Detailed Implementation Plan

## Overview

Build the interactive survey preview that renders questions as a respondent would see them, with full interactivity and live response state updates.

## Current State Assessment

- ✅ Steps 1-4 complete
- ✅ Layout structure in place
- ✅ State management wired (questions reducer, responses state exists but unused)
- ✅ Builder area functional
- ✅ Preview tab placeholder exists in `page.tsx` (line 123-127)
- ⚠️ Scroll-to behavior not yet implemented in BuilderArea (mentioned in step4-plan but not implemented)
- ✅ Properties Panel removed from plan (redundant - all editing already in QuestionCard)

## Files to Create

### 1. `src/components/PreviewArea.tsx`

Main container component for the preview area.

**Props:**

- `questions: Question[]` - All questions to render
- `selectedQuestionId?: string` - Currently selected question ID (for highlighting)
- `responses: SurveyResponse` - Current response values
- `onResponseChange: (questionId: string, value: string) => void` - Handler to update responses
- `onSelectQuestion?: (questionId: string) => void` - Optional handler to select question from preview

**Responsibilities:**

- Render vertical stack of PreviewQuestion components
- Handle empty state (no questions)
- Container styling consistent with BuilderArea
- Scrollable container
- Pass through all props to PreviewQuestion components

**Key Features:**

- Empty state message when no questions exist
- Vertical spacing between questions (space-y-4 or similar)
- Max-width constraint for readability (max-w-3xl)
- Padding consistent with BuilderArea (p-4 md:p-6)

### 2. `src/components/PreviewQuestion.tsx`

Individual question rendering component.

**Props:**

- `question: Question` - Question to render
- `isSelected: boolean` - Whether this question is currently selected
- `value: string` - Current response value (from responses state)
- `onChange: (value: string) => void` - Handler for response changes
- `onFocus?: () => void` - Optional handler when question receives focus (for selection)

**Responsibilities:**

- Render question label with required indicator
- Render appropriate input based on question type:
  - Text: `<textarea>` element
  - Multiple Choice: Radio button group
- Apply visual highlight when `isSelected` is true
- Handle response updates and call `onChange`

**Question Type Rendering:**

**Text Questions:**

- Label: Question label + required asterisk if required
- Input: `<textarea>` with:
  - Rows: 4 (reasonable default)
  - Placeholder: "Type your answer here..."
  - Value bound to `value` prop
  - onChange calls `onChange(e.target.value)`
  - Styling: Consistent with builder inputs (border, rounded, focus states)

**Multiple Choice Questions:**

- Label: Question label + required asterisk if required
- Options: Radio button group
  - Each option as `<label>` containing:
    - `<input type="radio">` with:
      - name: `question-${question.id}` (unique per question)
      - value: option.id
      - checked: `value === option.id`
      - onChange: calls `onChange(option.id)`
    - Option text displayed next to radio
  - Vertical stack of options (space-y-2)
  - Styling: Clean radio buttons with proper spacing

**Required Indicator:**

- Show asterisk (\*) after question label if `question.required` is true
- Style: text-zinc-500 or similar subtle color
- Format: `{question.label} *` or `{question.label}*` (choose one consistent style)

**Selected Highlighting:**

- When `isSelected` is true, apply visual highlight:
  - Option 1: Ring border (ring-2 ring-zinc-900) - matches BuilderArea style
  - Option 2: Background color (bg-zinc-50)
  - Option 3: Border color change
  - Recommendation: Use ring-2 ring-zinc-900 to match QuestionCard selected style

**Styling:**

- Card-like container with border (border border-zinc-200 rounded-lg bg-white)
- Padding: p-4 or p-6
- Spacing between label and input: mb-3 or mb-4
- Consistent with existing design system (zinc colors, rounded corners)

## Layout Changes

### Desktop Layout (md and up)

**New Structure:**

- Left: Question Sidebar (existing)
- Center: Split into two columns:
  - Left column: BuilderArea (question editing)
  - Right column: PreviewArea (survey preview)
- Bottom: JSON drawer (Step 7)

**Implementation:**

- Remove the right Properties Panel column (lines 135-137 in page.tsx)
- Split the center area into two columns on desktop
- Both Builder and Preview visible simultaneously on desktop
- Use flex layout: `flex` with `flex-1` for each column
- Add border between columns: `border-l border-zinc-200` on PreviewArea container

### Mobile Layout (below md)

**Keep existing tab system:**

- Tabs: Build / Preview / JSON
- Preview shown only in Preview tab
- Builder shown only in Build tab
- No side-by-side layout on mobile

## Integration Points

### Update `src/app/page.tsx`

**Changes needed:**

1. Import PreviewArea component
2. Remove Properties Panel column (lines 135-137)
3. Restructure center area for desktop side-by-side layout:
   - On desktop: Show BuilderArea and PreviewArea side-by-side
   - On mobile: Keep tab-based switching (existing behavior)
4. Add `handleResponseChange` function
5. Pass required props to PreviewArea:
   - `questions={questions}`
   - `selectedQuestionId={validSelectedQuestionId}`
   - `responses={responses}`
   - `onResponseChange={handleResponseChange}`
   - `onSelectQuestion={setSelectedQuestionId}` (enable selection from preview)

**Response State Handler:**

```typescript
const handleResponseChange = (questionId: string, value: string) => {
  setResponses((prev) => ({
    ...prev,
    [questionId]: value,
  }));
};
```

**Selection from Preview:**
Enable clicking/focusing questions in preview to select them in the builder:

- Pass `onSelectQuestion={setSelectedQuestionId}` to PreviewArea
- PreviewArea passes `onFocus={() => onSelectQuestion?.(question.id)}` to PreviewQuestion
- PreviewQuestion calls `onFocus?.()` when input/textarea receives focus
- This enables bidirectional navigation between builder and preview

## Scroll-to Behavior

**Goal:** When a question is selected from sidebar/builder, scroll it into view in preview.

**Implementation Approach:**

1. Use `useRef` in PreviewQuestion to create ref for each question element
2. Use `useEffect` in PreviewArea to scroll selected question into view
3. Or: Use `useEffect` in page.tsx to handle scroll when `validSelectedQuestionId` changes

**Recommendation:**

- Implement basic scroll-to using `useRef` and `scrollIntoView` in PreviewArea
- Use `useEffect` that watches `selectedQuestionId` prop
- Only scroll if question is actually rendered (exists in questions array)
- Use `behavior: 'smooth'` for smooth scrolling

**Code Pattern:**

```typescript
// In PreviewArea.tsx
const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

useEffect(() => {
  if (selectedQuestionId && questionRefs.current[selectedQuestionId]) {
    questionRefs.current[selectedQuestionId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}, [selectedQuestionId]);

// Pass ref callback to PreviewQuestion
```

## Implementation Steps

### Step 5.1: Create PreviewQuestion Component

1. Create `src/components/PreviewQuestion.tsx`
2. Implement basic structure with props interface
3. Add question label rendering with required indicator
4. Add text question rendering (textarea)
5. Add multiple choice rendering (radio buttons)
6. Add selected highlighting
7. Test with both question types

### Step 5.2: Create PreviewArea Component

1. Create `src/components/PreviewArea.tsx`
2. Implement container structure
3. Add empty state handling
4. Map questions to PreviewQuestion components
5. Wire up response change handler
6. Add proper styling and spacing

### Step 5.3: Integrate into Main Page

1. Update `src/app/page.tsx`
2. Import PreviewArea
3. Remove Properties Panel column (right side)
4. Restructure center area:
   - Desktop: Split into two columns (Builder left, Preview right)
   - Mobile: Keep tab system (Preview in preview tab)
5. Add `handleResponseChange` function
6. Pass all required props to PreviewArea
7. Test response state updates
8. Verify desktop side-by-side layout works

### Step 5.4: Add Scroll-to Behavior and Selection from Preview

1. Add refs to PreviewQuestion components
2. Implement scroll effect in PreviewArea (useEffect watching selectedQuestionId)
3. Add onFocus handlers to PreviewQuestion inputs/textarea
4. Pass onSelectQuestion prop through PreviewArea to PreviewQuestion
5. Test scroll behavior when selecting questions from sidebar/builder
6. Test selection when clicking/focusing questions in preview
7. Ensure smooth scrolling works correctly

### Step 5.5: Polish and Testing

1. Verify all question types render correctly
2. Test response state updates (check in console or prepare for JSON view)
3. Test required indicators display correctly
4. Test selected highlighting
5. Verify styling consistency with rest of app
6. Test on mobile (preview tab)
7. Test on desktop (if preview shows in center-right area)

## Design Decisions

### Text Input vs Textarea

**Decision:** Use `<textarea>` for text questions
**Rationale:** Allows longer responses, more flexible for users, matches typical survey UX

### Required Indicator Style

**Decision:** Asterisk (\*) after label
**Rationale:** Standard pattern, matches existing sidebar indicator style

### Selected Highlighting

**Decision:** Ring border (ring-2 ring-zinc-900)
**Rationale:** Matches QuestionCard selected style for consistency

### Response State Structure

**Decision:** Use existing `SurveyResponse` type (Record<string, string>)
**Rationale:** Already defined, simple and extensible

### Scroll-to Behavior

**Decision:** Implement smooth scroll-to when question selected
**Rationale:** Improves UX, helps user see selected question in preview

### Selection from Preview

**Decision:** Allow clicking/focusing questions in preview to select them in builder
**Rationale:** Improves bidirectional navigation, makes preview more interactive

## Testing Checklist

- [ ] Text questions render with textarea
- [ ] Multiple choice questions render with radio buttons
- [ ] Required indicator shows for required questions
- [ ] Selected question is highlighted in preview
- [ ] Typing in textarea updates responses state
- [ ] Selecting radio button updates responses state
- [ ] Empty state shows when no questions exist
- [ ] Styling is consistent with rest of app
- [ ] Preview works on mobile (preview tab)
- [ ] Preview works on desktop (side-by-side with builder)
- [ ] Desktop layout shows Builder and Preview simultaneously
- [ ] Border between Builder and Preview columns on desktop
- [ ] Scroll-to behavior works when question selected
- [ ] Multiple questions can be rendered correctly
- [ ] Response values persist when switching tabs

## Notes

- Preview is read-only for question definition (questions come from state)
- Preview is write-only for responses (updates responses state)
- No validation errors needed yet (just required indicators)
- Response state will be displayed in JSON view (Step 7)
- Properties Panel removed - all question editing happens in BuilderArea/QuestionCard
- Desktop shows Builder and Preview side-by-side for better workflow
- Mobile uses tabs to avoid cramped layout
