Survey Builder Implementation Plan
Step 1: Responsive Layout Structure
Create the foundational layout with responsive breakpoints:

Header component with app title and "Add question" button
Desktop: three-column layout (sidebar, center, properties) + bottom JSON drawer
Mobile: tab navigation (Build/Preview/JSON) under header
Basic responsive utilities and container structure
No content yet, just the shell
Files to create/modify:

src/app/page.tsx - Main layout structure
src/components/Header.tsx - Header component
src/components/Tabs.tsx - Tab navigation for mobile

---

Step 2: Question Sidebar Component
Build the left sidebar navigation:

Desktop: fixed left column showing question list
Mobile: collapsible drawer/panel (can be shown in Build tab)
Question list items with index, truncated label, required indicator
Click handler to select question (state management in next step)
"Add question" button in sidebar
Visual highlight for selected question (placeholder for now)
Files to create:

## src/components/QuestionSidebar.tsx

Step 3: State Management Integration
Wire up state to the layout:

Initialize useReducer with questions state
Initialize useState for responses
Add selectedQuestionId state
Connect "Add question" button to reducer
Pass state down to components via props
Use initial questions from reducer
Files to modify:

## src/app/page.tsx - Add state hooks and pass to children

Step 4: Builder Area Component
Create the main question editing interface:

Vertical stack of question cards
Expandable/collapsible question cards (only one expanded at a time)
Collapsed view: label, type, required indicator
Expanded view: label input, type selector, required toggle
For multiple choice: options list with add/remove
Delete question action
Scroll-to behavior when question selected
Files to create:

src/components/BuilderArea.tsx
src/components/QuestionCard.tsx

---

Step 5: Preview Area Component
Build the interactive survey preview:

Render all questions in order
Text questions: input/textarea
Multiple choice: radio buttons
Required indicator (asterisk or "(required)")
Highlight currently selected question
Connect to responses state (read/write)
Scroll-to behavior when question selected
Desktop: Show Builder and Preview side-by-side in center area
Mobile: Preview shown in Preview tab
Remove Properties Panel (redundant - all editing in QuestionCard)
Files to create:

src/components/PreviewArea.tsx
src/components/PreviewQuestion.tsx

---

Step 6: (Skipped - Properties Panel removed)
All question editing (type, required, options) is handled in QuestionCard component.
No separate properties panel needed.

Step 7: JSON Drawer/Panel Component
Implement JSON views:

Desktop: collapsible bottom drawer (initially collapsed)
Mobile: JSON tab content
Tabs for "Definition" and "Responses"
Pretty-printed JSON display
Live updates as state changes
Optional copy button
Files to create:

src/components/JsonPanel.tsx
src/components/JsonDrawer.tsx (desktop)
src/components/JsonTab.tsx (mobile)

---

Step 8: Question Reordering
Add reordering functionality:

Up/down buttons in sidebar (or drag handles if time permits)
Update reducer to handle reorder action
Ensure builder and preview reflect new order
Files to modify:

src/lib/questionsReducer.ts - Add reorder action
src/components/QuestionSidebar.tsx - Add reorder controls

---

Step 9: Polish and Integration
Final integration and polish:

Ensure all scroll-to behaviors work
Sync selection across sidebar, builder, preview, properties
Test responsive breakpoints
Add any missing interactions
Clean up styling and spacing
Files to modify:

Various components as needed
