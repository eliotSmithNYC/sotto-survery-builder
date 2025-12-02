1. Overall layout

Good:

Left question list, center builder, right preview → very legible.

Preview of the whole survey on the right is clear.

“Survey Builder” header + top-right “Add question” reads nicely.

Tweaks:

Decide on one primary place for “Add question.” Right now you have:

top-right “Add question”

bottom-left “Add question”

I’d keep one:

Either keep the bottom one and make it full-width “+ Add question”

Or keep the top-right one and make it visually tied to the question list (“Add question” just above or inside the left sidebar).

Duplication looks a bit unintentional.

2. Left sidebar (Questions)

Good:

Numbered list, clear which question is selected.

Fits the “outline” mental model.

Improvements:

Add tiny extra metadata per question row:

Maybe a small tag like “MC” / “Text”.

A required indicator (star or dot) for required ones.

Give it a bit more visual hierarchy:

Bold the active question text.

Slight background or left border on active row.

If you have time: add simple reorder affordance (↑/↓ icons or drag handle). Even if you don’t wire full drag-and-drop, just being able to move a question up/down once is a nice “I thought about extensibility” signal.

3. Builder cards (center)

Right now you’re showing all questions fully expanded.

That works, but it’s busy.

What I’d change:

Only the selected question should be fully expanded.

Non-selected questions:

Collapse to a simple bar: “Do you like me? – Multiple choice – Required/Optional”.

Maybe a small “Edit” chevron to expand if needed.

That will:

reduce noise

visually connect “I clicked this in the sidebar → I’m editing this card”

Also:

The “Delete” text in red is good; consider moving it to the top-right of the card header (consistent across cards).

“Options”:

The “+ Add option” label feels slightly detached; maybe place it directly under the last option, so the options visually read as a list.

Minor copy tweak:

For the third question, Question Label placeholder: “Enter question text…” is good; just ensure it’s consistent for all new questions.

4. Preview (right column)

Good:

Required text in red is clear.

The currently selected question has a thicker border → good connection.

Polish:

Narrow the preview column a bit and center the content within it so it feels like a real form (more Typeform/Stripe style).

The heavy black border for the selected question is a little loud. Make it:

thinner or

use a subtle colored border + light background.

Ensure radio labels always read as text from the options, not things like "2" (in your screenshot the “2” under “Do you like me?” looks odd – I assume that’s placeholder text, but it jumps out).

Optional UX candy if you have time:

When you select a different question in the sidebar, smoothly scroll the preview to that question so selection feels “linked.”

5. JSON panel

Right now I just see “JSON” at the bottom-left, with a little caret bottom-right of the screen.

You probably planned a drawer; make it explicit:

Full-width bar across the bottom:

Left: JSON

Right: ▲ / ▼ icon

When expanded:

Panel slides up 30–40% of the screen height.

Inside: a simple tab toggle:

“Definition”

“Responses”

Under each: <pre>-style block with pretty JSON.

Even if the styling is basic, the interaction (collapse/expand + two views) will read as very thoughtful.
