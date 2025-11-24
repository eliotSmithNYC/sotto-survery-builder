1. High-level product goals

The app has three core concerns:

Build – author and edit survey questions and options.

Preview – show the survey as a respondent will see it, fully interactive.

JSON Data – show live JSON for:

the survey definition

the survey responses

The UI should make these three concerns obvious and easy to navigate, on both large and small screens.

2. Screen-size behavior (responsive layout)
   Desktop / wide screens (main design)

Use a three-zone layout plus a JSON drawer:

Left: Question Sidebar (survey outline / navigation)

Center: Builder + Preview (two columns inside the center area)

Right: Properties Panel (question settings)

Bottom: Collapsible JSON Panel (definition + responses)

Rough mental layout:

Top: header bar

Middle:

left column: question list

center area: builder + preview

right column: question properties

Bottom: JSON drawer (collapsible devtools-style panel)

Mobile / narrow screens

Use top-level tabs instead of a multi-column layout:

Tabs (top of screen):

Build

Preview

JSON

Within each tab:

Build: question list + editor

Preview: interactive survey form

JSON: two JSON views (definition, responses)

The goal: the same features as desktop, but never forcing more than one main panel at a time.

3. Header / global controls

At the very top of the screen (both desktop and mobile):

App title or label, e.g. “Survey Builder”

Global controls:

“Add question” button

Optional small toggle or label indicating current mode (mostly informational – Build/Preview/JSON are primarily expressed via layout/tabs)

On mobile:

The tabs (Build / Preview / JSON) live directly under the header.

Keep the header minimal and modern.

4. Question Sidebar (left column on desktop, drawer/list on mobile)
   Desktop behavior

A vertical panel showing the survey outline:

Each question row shows:

Question index (1, 2, 3, …)

Truncated question label text

Simple indication if required (e.g., an asterisk or small icon)

The currently selected question is visually highlighted.

At the bottom or top of the list:

“Add question” button.

Reordering:

Provide a minimal UX to move questions up/down (drag handle or up/down controls). It doesn’t need to be fancy, just functional.

Clicking a question:

Selects it in the builder.

Scrolls the builder to that question.

Scrolls the preview to that question (if reasonably simple to implement).

Updates the properties panel to show that question’s settings.

Mobile behavior

Inside the Build tab:

Show a compact question list at the top or via a “Questions” button that opens a panel:

Tapping an item selects that question and scrolls to it in the editor area.

Also expose an “Add question” control here.

The user should be able to:

see the overall question list

jump to a question

add/remove questions

5. Builder area (center-left of main content on desktop)

The Builder area is the main authoring surface for the selected question(s).

Key behavior:

You edit the question content here, not in the preview.

It should support managing multiple questions, but keep the UI focused and not cluttered.

Design:

Show questions as cards stacked vertically.

Only one question should be “expanded” at a time for full editing; others can be collapsed to a slim header row (label + type + required).

For the expanded question, include:

Input for question label

Selector for question type: Freeform Text vs Multiple Choice

Required toggle

For Multiple Choice:

List of options with:

Text input for each option

Remove option control

“Add option” control

Optionally:

“Duplicate question” and “Delete question” actions can live on the question card.

This panel is about definition, not about respondent experience.

6. Preview area (center-right of main content on desktop)

The Preview area shows the full survey as a respondent would see it.

Key decisions:

On desktop, preview the entire survey in order (scrollable in this column).

The preview form is fully interactive:

Text questions use input or textarea.

Multiple choice questions use radio buttons.

Required questions are clearly indicated (e.g. “\*” near label or “(required)”).

The currently selected question from the builder is subtly highlighted in the preview (border, background, or scroll-into-view).

Important:

As the user types in the preview or selects options, the response state updates live, and the JSON “responses” view reflects it.

On mobile:

The Preview tab shows this same form, full-width.

It’s acceptable for the mobile preview to be vertically scrollable; single-question-at-a-time behavior is optional but not required.

7. Properties panel (right column on desktop)

This panel shows contextual settings for the selected question.

Behavior:

When no question is selected, show simple placeholder text.

When a question is selected, show:

Question type selector (Text vs Multiple Choice)

Required toggle

Any extra toggles you choose (e.g., “Allow multiple selection” for multiple choice, if you want a small enhancement)

For multiple choice:

A simplified list of options (mirrors builder area)

The builder and properties panel should not fight each other. Prefer a clear separation:

Builder = content editing (label, options)

Properties = meta/config toggles (type, required, extra behavior)

On mobile:

These properties can appear within the Build tab under the question editor, instead of in a separate right-side panel.

8. JSON panel (bottom drawer on desktop, JSON tab on mobile)

We must show two JSON views:

Survey definition JSON

Survey responses JSON

Desktop behavior

There is a collapsible JSON drawer attached to the bottom of the screen:

Initially collapsed to a small bar labeled “JSON”.

When expanded, it overlays or pushes up the main content.

Inside the JSON drawer:

A small tab or toggle between:

“Definition”

“Responses”

Under each toggle:

Pretty-printed, read-only JSON block.

A “Copy” button for convenience (if time permits).

The JSON should update live as:

the survey structure changes, and

the user fills out answers in the preview.

Mobile behavior

JSON has its own top-level “JSON” tab.

Inside that tab:

Two sections:

“Survey Definition JSON”

“Survey Responses JSON”

Each section contains:

A label/short description

A read-only, scrollable JSON block

Optional “Copy” button

9. State-model expectations (conceptual, not code)

Cursor should model state in a clean, extensible way. Requirements:

A central “survey definition” state representing:

ordered list of questions

question id, label, type

required flag

options for multiple choice questions

A separate “responses” state representing:

answers keyed by question id

All three main views (Builder, Preview, JSON) should derive from these states:

Builder mutates the survey definition

Preview reads survey definition and mutates responses

JSON drawer reads both and displays them

Do not hardcode data; implement full CRUD for questions and options in the UI.

10. Interactions and UX details

Adding a question:

Should create a sensible default (e.g., Text question, empty label, not required).

Automatically select the new question and scroll it into view.

Removing a question:

Remove from definition, update ordering, update sidebar.

Changing type:

Switching between Text/Multiple Choice should adjust the underlying structure and UI.

Reordering:

When questions are reordered via sidebar controls, both builder and preview reflect the new order.

Validation:

Full validation is not required, but the UI should be ready to support it later (clean structure).

11. Non-goals / constraints

No need for backend or persistence; everything can be in-memory client state.

No need for authentication, multiple surveys, themes, or branching logic.

Keep the visual design minimal and modern:

whitespace

subtle borders

limited color usage

Do not bring in large UI libraries (Material, Chakra, etc.).
