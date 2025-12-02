# Interview Preparation Guide: Survey Builder Pairing Sessions

**Time until interviews: 2 days**  
**Sessions: 2 × 90 minutes each**

---

## Overview

You've built a strong submission. The evaluator noted excellent component composition, state management, and extensibility. This guide will help you prepare to explain your decisions, collaborate effectively, and handle the pairing exercises confidently.

---

## ⚡ Quick Answer: What Should I Actually Code?

**Code ONE exercise fully:**

- ✅ **Add a new question type (Rating Scale)** - Most likely exercise, builds real confidence

**For everything else, just think through the approach:**

- 💭 Drag-and-drop, validation improvements, performance optimizations - Discuss, don't code

**Why this balance?**

- Coding one exercise gives you confidence and timing sense
- Thinking through others keeps you flexible and natural
- You'll have the muscle memory for the most common task
- You won't get tunnel vision on one approach

**Time investment:** ~1 hour coding + 2-3 hours thinking/discussing = optimal prep

---

## Day 1: Deep Code Review & Decision Documentation (3-4 hours)

### Morning Session (2 hours): Revisit Your Code

**Goal:** Be able to explain every major decision you made.

#### 1. Review Your Architecture (30 min)

Walk through your codebase and document your reasoning:

**State Management Decisions:**

- [ ] Why did you choose `useReducer` for questions instead of `useState`?
  - _Prepare answer:_ "I chose `useReducer` because questions have complex, interdependent state updates. With multiple action types (add, remove, update, changeType, manage options), a reducer centralizes the logic and makes state transitions predictable. It also scales better if we add undo/redo or time-travel debugging."

- [ ] Why separate `responses` state from `questions` state?
  - _Prepare answer:_ "Responses are ephemeral preview data, while questions are the persistent survey definition. Separating them keeps concerns clear and makes it easy to reset responses without affecting the survey structure."

- [ ] Why `useMemo` for `validSelectedQuestionId`?
  - _Prepare answer:_ "It prevents stale references when questions are deleted. Without it, we could have a selectedQuestionId pointing to a deleted question. The memo ensures we always have a valid selection or fall back to the first question."

**Component Boundaries:**

- [ ] Why `BuilderArea` vs `QuestionCard` separation?
  - _Prepare answer:_ "BuilderArea handles the list/collection concerns - empty states, adding questions. QuestionCard handles individual question editing. This separation makes it easy to add features like filtering, sorting, or bulk operations at the BuilderArea level without touching QuestionCard."

- [ ] Why the polymorphic `Input` component?
  - _Prepare answer:_ "I wanted consistent styling and behavior across text inputs, textareas, and selects. The discriminated union ensures type safety. Alternative approaches could be separate components or a factory, but this keeps the API consistent."

**Practice:** Write down 2-3 sentence explanations for each major architectural choice.

#### 2. Review Your Type System (30 min)

**Key Types to Understand:**

- `QuestionType` union type - why not an enum?
- `QuestionAction` discriminated union - how does TypeScript help here?
- `MultipleChoiceResponse` vs `string` in `SurveyResponse`

**Practice:** Be ready to explain:

- How you'd add a new question type (rating scale 1-5)
- How TypeScript catches bugs at compile time
- Why you chose `Record<string, ...>` for responses

#### 3. Review Your Reducer Logic (30 min)

**Critical Reducer Cases:**

- `changeType` - why initialize 2 empty options when switching to multiple choice?
- `moveUp`/`moveDown` - why array destructuring swap?
- `updateQuestion` - why a patch pattern instead of full replacement?

**Practice:** Trace through what happens when:

1. User changes a text question to multiple choice
2. User deletes the last option from a multiple choice question
3. User moves question #3 to position #1

#### 4. Review Edge Cases You Handled (30 min)

**What you handled well:**

- ✅ Stale selection after deletion (`validSelectedQuestionId`)
- ✅ Response cleanup on type change (`handleTypeChange`)
- ✅ Validation before adding new questions
- ✅ Empty states in BuilderArea and PreviewArea

**What you might be asked about:**

- What if user deletes all questions?
- What if user removes all options from a multiple choice question?
- What if JSON is malformed when importing?

**Practice:** Think through 3 edge cases and how you'd handle them.

---

### Afternoon Session (2 hours): Practice Pairing Exercises

**Goal:** Get comfortable with the types of changes you might make together.

**⚠️ IMPORTANT: Coding Strategy**

**Code this one exercise fully** - it's the most likely pairing task and will build real confidence:

- **Exercise 1: Add a New Question Type** (below)

**For the others, just think through the approach** - you'll be more flexible and natural:

- Exercises 2 & 3: Discuss approach, don't code

---

#### Exercise 1: Add a New Question Type ⭐ CODE THIS (60 min)

**Task:** Add a "Rating Scale" question type (1-5 stars)

**Why code this one:**

- Most likely pairing exercise (mentioned in evaluation)
- Builds muscle memory for the exact flow
- Reveals edge cases you'll encounter
- Gives you confidence and timing sense

**Steps to practice:**

1. Add `"rating"` to `QuestionType` union
2. Extend `Question` interface if needed (does it need `min`, `max`?)
3. Update reducer's `changeType` case
4. Add rendering in `QuestionCard` for builder
5. Add rendering in `PreviewQuestion` for preview
6. Update validation logic
7. Update Zod schemas

**Actually code this** - don't just think about it. Time yourself. Can you do it in 45 minutes?

**Key questions to consider:**

- Should rating questions have options? (No, they have a scale)
- How do you store the response? (Just a number 1-5)
- What's the default when switching to rating? (Scale of 1-5)

**After coding:** Reflect on what was easy/hard, what edge cases you found, and how you'd explain your approach.

---

#### Exercise 2: Add Minimum Option Validation (30 min) 💭 THINK THROUGH

**Task:** Prevent removing the last option from a multiple choice question

**Don't code this** - just think through the approach:

**Approach A:** Update reducer

- Modify `removeOption` case to check `options.length > 1`
- Return state unchanged if only one option
- Pros: Centralized logic, type-safe
- Cons: Silent failure (user doesn't know why)

**Approach B:** Validation in component

- Check in `QuestionCard` before dispatching
- Show error message if trying to remove last option
- Pros: Better UX, user gets feedback
- Cons: Logic in component

**Approach C:** Hybrid

- Reducer validates and returns error state
- Component shows error message
- Pros: Best of both
- Cons: More complex

**Practice:** Which approach would you choose? Why? How would you discuss this with the interviewer?

---

#### Exercise 3: Improve Error Handling (30 min) 💭 THINK THROUGH

**Task:** Replace `setTimeout` validation error dismissal with a better solution

**Don't code this** - just consider the options:

**Option 1: Custom hook**

```typescript
const { error, setError, clearError } = useErrorTimeout(3000);
```

- Reusable, clean API
- Easy to test

**Option 2: Toast notification**

- Use a library or build simple one
- Better UX, can stack multiple
- More complex

**Option 3: Inline validation**

- Show errors next to each question
- Most user-friendly
- Requires more state management

**Option 4: Error boundary**

- Catches runtime errors
- Different use case (this is for validation)

**Practice:** Which would you choose in production? How would you explain the tradeoff to the interviewer?

---

## Day 2: Communication & Collaboration Prep (2-3 hours)

### Morning Session (1.5 hours): Communication Skills

#### 1. Practice Explaining Your Code (45 min)

**Exercise:** Record yourself (or practice with a friend) explaining:

1. **"Walk me through how adding a question works"** (2 min)
   - Start from button click → validation → dispatch → state update → UI render
   - Use this structure: User action → Handler → State update → Re-render

2. **"How would you add drag-and-drop reordering?"** (3 min)
   - Mention libraries (react-beautiful-dnd, dnd-kit)
   - Or custom implementation with mouse events
   - How it fits into your reducer pattern
   - Performance considerations

3. **"How would you optimize for 100+ questions?"** (3 min)
   - Virtualization (react-window, react-virtualized)
   - Memoization (React.memo, useMemo, useCallback)
   - Lazy loading question cards
   - Debouncing validation

**Key communication tips:**

- ✅ Start with the big picture, then drill down
- ✅ Use analogies when helpful ("The reducer is like a state machine...")
- ✅ Acknowledge tradeoffs ("We could do X, but Y is simpler for now")
- ✅ Ask clarifying questions ("Are you thinking about performance or UX?")

#### 2. Practice Collaborative Problem-Solving (45 min)

**Scenario Practice:**

**Scenario 1:** Interviewer says "I think we should use Context instead of prop drilling. What do you think?"

**Good response structure:**

1. Acknowledge their point: "That's a valid consideration, especially if we add more nested components."
2. Explain current approach: "Right now, prop drilling is minimal - dispatch goes through 2-3 levels, which is acceptable for this scope."
3. Discuss tradeoffs: "Context would reduce prop drilling but adds complexity. We'd need to be careful about re-renders."
4. Suggest when to refactor: "If we add more features that need dispatch deeper in the tree, or if we add multiple reducers, Context would make sense."
5. Ask for input: "What's your thinking on when Context becomes necessary?"

**Practice this pattern** for:

- "Should we use a form library?"
- "Why not use Zustand/Redux?"
- "Could we simplify the Input component?"

---

### Afternoon Session (1.5 hours): Technical Deep-Dives

#### 1. Performance Optimization (30 min)

**Be ready to discuss:**

**React Performance:**

- When to use `React.memo` (expensive renders, stable props)
- When to use `useMemo` (expensive computations)
- When to use `useCallback` (stable function references for memoized children)
- Virtualization for long lists

**State Performance:**

- Reducer vs useState performance (they're similar, reducer is better for complex logic)
- Normalized vs nested state (your questions array is fine for <1000 items)
- When to introduce state management libraries

**Practice question:** "How would you optimize if users could have 500 questions?"

**Your answer should mention:**

- Virtual scrolling for the question list
- Memoizing QuestionCard components
- Debouncing validation
- Lazy loading preview area
- Consider pagination or search/filter

#### 2. Testing Strategy (30 min)

**Be ready to discuss what you'd test:**

**Unit Tests:**

- Reducer actions (each case)
- Validation functions
- Utility functions (getQuestionTypeLabel, etc.)

**Component Tests:**

- QuestionCard rendering (collapsed vs expanded)
- User interactions (add option, change type)
- Form validation

**Integration Tests:**

- Full flow: add question → edit → preview → see JSON
- Type change clears responses

**E2E Tests:**

- Critical user flows
- Cross-browser compatibility

**Practice:** Write test cases (not code, just describe) for:

1. Adding a question
2. Changing question type from text to multiple choice
3. Validation preventing invalid questions

#### 3. Accessibility & UX (30 min)

**What you did well:**

- Proper labels and ARIA attributes
- Keyboard navigation (mostly)
- Screen reader support

**What could be improved:**

- Focus management when adding/deleting questions
- Keyboard shortcuts (Cmd+S to save, etc.)
- Skip links for screen readers
- Better focus indicators
- Announce dynamic changes to screen readers

**Practice:** How would you improve accessibility for:

- Adding a new question (should focus the new question's input)
- Deleting a question (should focus the next question or "Add question" button)
- Changing question type (should announce the change)

---

## Day 2 Evening: Final Prep (1 hour)

### Quick Review Checklist

**Code Familiarity:**

- [ ] Can explain reducer pattern and why you chose it
- [ ] Can walk through adding a question flow
- [ ] Can explain component boundaries
- [ ] Can discuss type system choices
- [ ] Can trace through a type change operation

**Extension Readiness:**

- [ ] Know how to add a new question type (practice it!)
- [ ] Can discuss drag-and-drop implementation
- [ ] Can explain performance optimization strategies
- [ ] Can discuss testing approach

**Communication:**

- [ ] Practice explaining code out loud
- [ ] Prepare to ask clarifying questions
- [ ] Ready to discuss tradeoffs openly
- [ ] Comfortable saying "I don't know, but here's how I'd find out"

**Technical Topics:**

- [ ] React hooks (useReducer, useState, useMemo, useCallback)
- [ ] TypeScript patterns (discriminated unions, generics)
- [ ] State management (when to use what)
- [ ] Performance optimization
- [ ] Accessibility basics

---

## During the Interview: Best Practices

### Communication

**✅ DO:**

- Think out loud - explain your thought process
- Ask clarifying questions before coding
- Discuss tradeoffs as you make decisions
- Acknowledge when you're unsure
- Suggest alternatives when stuck

**❌ DON'T:**

- Code in silence
- Assume requirements
- Defend your code defensively
- Pretend to know something you don't
- Rush without understanding the problem

### Pairing Etiquette

**When driving (typing):**

- Explain what you're about to do
- Ask for input on approach
- Pause for questions
- Check in: "Does this approach make sense?"

**When navigating (not typing):**

- Ask questions about the codebase
- Suggest alternatives
- Point out potential issues
- Help debug when stuck

### Problem-Solving Framework

**When given a task:**

1. **Understand** (2-3 min)
   - Restate the requirement in your own words
   - Ask clarifying questions
   - Identify edge cases

2. **Plan** (3-5 min)
   - Discuss approach with interviewer
   - Identify files to modify
   - Outline steps

3. **Implement** (remainder)
   - Code incrementally
   - Test as you go
   - Refactor if needed

4. **Review** (last 5 min)
   - Walk through what you built
   - Discuss improvements
   - Answer questions

---

## Likely Pairing Exercises (Based on Evaluation)

### High Probability Exercises

**1. Add a New Question Type (Rating Scale)**

- Most likely - tests extensibility
- Practice this one thoroughly
- Time target: 45-60 minutes

**2. Improve Validation**

- Add inline error messages
- Prevent invalid states
- Better error UX
- Time target: 30-45 minutes

**3. Add Drag-and-Drop Reordering**

- Replace up/down buttons
- Test component integration
- Time target: 45-60 minutes

### Medium Probability Exercises

**4. Implement Undo/Redo**

- Extend reducer pattern
- History management
- Time target: 60+ minutes (might be split across sessions)

**5. Add Question Validation Rules**

- Min/max length for text
- Min options for multiple choice
- Custom validation per type
- Time target: 30-45 minutes

**6. Performance Optimization**

- Add virtualization
- Memoize components
- Optimize re-renders
- Time target: 45-60 minutes

### Lower Probability (But Possible)

**7. Add Import/Export JSON**

- File upload/download
- Error handling
- Validation
- Time target: 30-45 minutes

**8. Add Question Templates**

- Pre-built question sets
- Duplicate question
- Time target: 20-30 minutes

---

## Red Flags to Avoid

### Technical Red Flags

❌ **Don't:**

- Refactor working code unnecessarily
- Add dependencies without discussing
- Ignore TypeScript errors
- Break existing functionality
- Write code you can't explain

✅ **Do:**

- Make incremental changes
- Discuss tradeoffs before major changes
- Keep code working at each step
- Explain your choices
- Ask for help when stuck

### Communication Red Flags

❌ **Don't:**

- Code in silence
- Ignore interviewer suggestions
- Get defensive about your code
- Pretend to understand when you don't
- Rush without planning

✅ **Do:**

- Think out loud
- Engage with feedback
- Ask questions
- Admit uncertainty
- Take time to understand

---

## Questions to Ask the Interviewer

**Good questions show engagement:**

1. **About scope:** "Should we handle edge case X, or keep it simple for now?"
2. **About approach:** "I'm thinking approach A or B - which do you prefer?"
3. **About priorities:** "Should we focus on functionality or polish?"
4. **About constraints:** "Are there any performance requirements I should consider?"
5. **About the codebase:** "How does this fit into the larger system?"

**Avoid:**

- Questions answered in the spec
- Questions that show you didn't read your own code
- Overly technical questions that derail the session

---

## Final Confidence Boosters

### Remember:

1. **Your code is strong** - The evaluation shows 4.8/5 overall
2. **You made good decisions** - Reducer pattern, component boundaries, type safety
3. **You can extend it** - The architecture supports new features
4. **You're prepared** - This guide covers the likely scenarios

### Mindset:

- **Collaboration, not perfection** - They want to see how you work with others
- **Learning, not knowing everything** - It's okay to not know something
- **Communication, not silence** - Talk through your process
- **Incremental, not big bang** - Small, working steps are better

### You've Got This:

You built a production-ready feature in 3-4 hours. You understand React, TypeScript, and state management. You can explain your decisions. You can extend the codebase. You're ready to pair program effectively.

---

## Quick Reference: Your Codebase Highlights

**When explaining your architecture, mention:**

- **Reducer pattern** for complex state management
- **Component composition** with clear boundaries
- **Type safety** with TypeScript and Zod
- **Extensibility** through clean abstractions
- **Separation of concerns** (questions vs responses, builder vs preview)
- **Responsive design** with mobile/desktop layouts
- **Validation** to prevent invalid states

**Your strengths (from evaluation):**

- Excellent component composition (5/5)
- Strong dynamic form handling (5/5)
- Practical state modeling (5/5)
- Good code clarity (4/5)
- Great extensibility (5/5)

---

## Last-Minute Checklist (Morning of Interview)

- [ ] Code runs locally (test `pnpm dev`)
- [ ] Can explain reducer pattern
- [ ] Can walk through adding a question
- [ ] Practiced adding a new question type
- [ ] Reviewed edge cases
- [ ] Prepared to discuss performance
- [ ] Ready to ask clarifying questions
- [ ] Comfortable with pair programming
- [ ] Have questions ready for interviewer
- [ ] Confident and ready to collaborate!

---

**Good luck! You've built something impressive. Now show them how you think and collaborate. 🚀**
