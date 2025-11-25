# High Priority Improvements Plan

## For Take-Home Coding Challenge

**Status:** Planning phase  
**Goal:** Demonstrate production-ready code without over-engineering

---

## Completed ✅

1. **Extract reusable UI components** (`Button`, `Input`, `Card`)
2. **Add class name utility function** (`cn`)

---

## Remaining High Priority Items

### 1. Improve Accessibility (ARIA labels, keyboard navigation)

**Why it matters:** Shows production awareness and inclusive design thinking.

**Current State:**

- Some icon buttons already have `aria-label` (Header, JsonDrawer, QuestionSidebar, QuestionCard)
- Missing: `aria-live` regions for validation errors
- Missing: `aria-describedby` for form inputs with validation
- Missing: Focus management for sidebar overlay
- Missing: Keyboard navigation improvements

**Tasks:**

1. ✅ Add `aria-live="polite"` to validation error banner in `page.tsx` - COMPLETED
2. ✅ Add `aria-describedby` to form inputs that have validation (QuestionCard inputs) - COMPLETED
3. ✅ Ensure all interactive elements are keyboard accessible (Card component) - COMPLETED
4. ✅ Add proper label associations with `htmlFor` and `id` - COMPLETED
5. ✅ Add `role` attributes where semantic HTML isn't sufficient - COMPLETED

**Additional Accessibility Improvements (Could be done but not implemented - would require useEffect):**

- Focus trap for mobile sidebar overlay (traps Tab key within sidebar when open)
- Auto-focus first element when sidebar opens (improves keyboard navigation flow)
- Focus management when sidebar closes (return focus to trigger button for better UX)
- Keyboard shortcut to close sidebar (Escape key handler)

**Note:** These improvements would enhance accessibility but require useEffect hooks and event listeners. For a take-home challenge, the current implementation (proper ARIA labels, keyboard-accessible cards, screen reader support) demonstrates solid accessibility awareness without over-engineering.

**Files to modify:**

- `src/app/page.tsx` - Add aria-live to validation banner
- `src/components/QuestionCard.tsx` - Add aria-describedby to inputs
- `src/components/QuestionSidebar.tsx` - Ensure keyboard navigation
- `src/components/BuilderArea.tsx` - Check accessibility

**Estimated effort:** Low (1-2 hours)

---

### 2. Extract Common Question Utilities

**Why it matters:** Reduces duplication, improves maintainability, shows code organization skills.

**Current State:**

- Question type labels duplicated:
  - `QuestionCard.tsx` line 80-81: `typeLabel = question.type === "multipleChoice" ? "Multiple Choice" : "Freeform Text"`
  - `QuestionSidebar.tsx` line 55-56: `typeTag = question.type === "multipleChoice" ? "MC" : "Text"`
- Required label logic duplicated:
  - `QuestionCard.tsx` line 82: `requiredLabel = question.required ? "Required" : "Optional"`

**Tasks:**

1. Create `src/lib/questionUtils.ts` with:
   - `getQuestionTypeLabel(type: QuestionType): string` - Returns "Multiple Choice" or "Freeform Text"
   - `getQuestionTypeTag(type: QuestionType): string` - Returns "MC" or "Text"
   - `getRequiredLabel(required: boolean): string` - Returns "Required" or "Optional"
2. Update `QuestionCard.tsx` to use utilities
3. Update `QuestionSidebar.tsx` to use utilities

**Files to create:**

- `src/lib/questionUtils.ts`

**Files to modify:**

- `src/components/QuestionCard.tsx`
- `src/components/QuestionSidebar.tsx`

**Estimated effort:** Low (30 minutes)

---

### 3. Ensure Zero React Errors

**Why it matters:** Production-ready code should never have React errors or warnings.

**Current State:**

- ✅ Build passes with no TypeScript errors
- ✅ All list items have proper `key` props
- ✅ No obvious React prop errors

**Tasks:**

1. Run dev server and check console for any React warnings
2. Verify all components handle edge cases (empty arrays, undefined props, etc.)
3. Ensure no missing required props
4. Check for any React strict mode warnings
5. Verify all event handlers are properly typed

**Verification:**

- Run `npm run build` - should pass with no errors
- Run `npm run dev` - check browser console for warnings
- Test all user interactions to ensure no runtime errors

**Estimated effort:** Low (30 minutes - mostly verification)

---

## Implementation Order

1. **Ensure Zero React Errors** (critical - verify no errors exist)
2. **Extract Question Utilities** (quick win, shows code organization)
3. **Improve Accessibility** (shows production awareness)

---

## Success Criteria

- [x] Build passes with no TypeScript/React errors
- [x] Question utilities extracted and used consistently
- [x] All form inputs have proper ARIA attributes
- [x] Validation errors are announced to screen readers (aria-live)
- [x] Keyboard navigation works for all interactive elements (Card component supports Enter/Space)
- [x] Proper label associations with htmlFor/id
- [x] Screen reader descriptions for form inputs

---

## Notes

- Focus on demonstrating production-ready thinking, not over-engineering
- Zero React errors is non-negotiable for production code
- Accessibility improvements show inclusive design awareness
- Code organization (utilities) shows maintainability thinking
