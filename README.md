# Survey Builder

A coding exercise building a survey builder with Next.js, React, and Tailwind CSS. Create questions, preview the survey, and view JSON output.

## Running the Project

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What It Does

- Add, edit, and delete questions
- Two question types: freeform text and multiple choice
- Reorder questions with up/down controls
- Live preview of the survey
- View survey definition and responses as JSON
- Responsive design: desktop multi-column layout, mobile tab navigation

## Architecture

**State Management**: Uses `useReducer` for questions and `useState` for responses. No global state library.

**Component Structure**:

- Layout components handle responsive breakpoints (`ResponsiveLayout`, `DesktopLayout`, `MobileLayout`)
- Feature components are focused and composable (`BuilderArea`, `PreviewArea`, `QuestionSidebar`)
- UI components are minimal and reusable

**Validation**: Zod schemas validate question structure. The app prevents adding new questions until all current ones are valid.

**Responsive Design**: The responsive approach shows how I'd think about extensibility. Desktop uses a multi-column layout; mobile switches to tabs to avoid cramming too much on small screens.

## Design Decisions & Tradeoffs

**Three-Zone Layout (Builder / Preview / JSON)**: Clear separation mirrors real-world survey builders and makes state transformations visible. JSON is exposed in a bottom drawer rather than hidden, which helps during pairing sessions and aligns with LLM integration workflows where JSON is a first-class artifact.

**Desktop vs Mobile**: Desktop uses a three-column builder-tool pattern (outline, editor, preview) similar to Typeform/Webflow. Mobile switches to tabs to avoid cramped layouts. Assumption: primary usage is desktop, so mobile gets a clean but minimal implementation.

**Plain React State**: Chose `useReducer` + `useState` over form libraries to keep the transformation pipeline transparent. Tradeoff: libraries like React Hook Form would add features, but add cognitive overhead that isn't needed here.

**Collapsed Builder Cards**: Only the selected question expands fully; others collapse to compact rows. Keeps the builder readable for longer surveys. Tradeoff: batch editing multiple questions simultaneously could be useful but hurts readability.

**Two "Add Question" Buttons**: Sidebar button for structural "add to outline" workflow, builder button for flow-based "add next question". Visually differentiated to support both mental models.

**Extensibility**: Component boundaries are intentionally clean to make adding new question types, branching logic, drag-and-drop, or backend persistence straightforward.

**Assumptions**: Survey exists in memory only (no persistence), no server-side validation needed, basic accessibility is sufficient for the exercise scope.

## What I'd Add With More Time

**Immediate improvements:**

- Download/export JSON functionality
- Better error handling and edge cases
- Duplicate question feature
- Keyboard shortcuts for common actions

**Production features:**

- Rich media (images, video) in questions
- Control flow / skip logic (conditional questions based on answers)
- Save and share surveys (backend integration, team collaboration)
- Publish surveys to public URLs
- Question library for reusing questions across surveys
- Additional question types (ratings, dates, file uploads)

The current structure makes adding these features straightforward - new question types fit into the reducer pattern, and the component composition allows for easy extension.
<img width="2556" height="1315" alt="image" src="https://github.com/user-attachments/assets/222aea3e-2bd3-4e14-aabc-c4fc212f7ce6" />
