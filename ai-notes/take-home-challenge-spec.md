Sotto Coding Exercise - Dynamic Survey Builder
Overview
In this exercise, you will build a small "Survey Builder" web app using React, Next.js, and Tailwind CSS.
The goal is to understand how you structure components, manage React state, and handle dynamic forms in a clean and extensible way. Treat the project as if it were going into a real production codebase.
We expect the exercise to take about 2 to 3 hours. It is completely fine to leave TODOs or rough edges. We will use your submission as the starting point for a live pairing session.

What you will build
You are creating a Survey Builder that allows a user to define questions for a survey and preview what the survey will look like.
Supported question types
You only need to support these two question types:
Freeform Text
Multiple Choice

Core user flows

1. Create and edit questions
   The user should be able to:
   Add a new question
   Remove an existing question
   Edit:
   The question label (for example: “Describe your experience.”)
   The question type (Freeform Text or Multiple Choice)
   Whether the question is required (boolean toggle)

2. Manage options for multiple choice questions
   When the selected type is Multiple Choice:
   The UI should show an interface to manage options
   The user can:
   Add options
   Remove options
   Edit the text of each option
3. Preview the survey
   Provide a “Survey Preview” panel or page that:
   Renders each question exactly as a respondent would see it
   Clearly indicates required questions
   Allows the user to fill in inputs
   Updates a response object as they type or select answers
4. View JSON representations
   Display two JSON outputs:
   Survey definition JSON
   Survey responses JSON
   Display format and placement are up to you (sidebar, bottom panel, collapsible sections, etc.).

Technical requirements
Use Next.js
Use React function components and hooks
Use Tailwind CSS
Keep everything client-side
Avoid large UI component libraries like Material or Chakra
We are evaluating:
Component composition
Handling dynamic form fields
Practical state modeling
Code clarity and maintainability
Your ability to make the UI extensible

What to submit
Please provide:

1. A GitHub repository (or similar) containing:
   Your Next.js project
   A short README that explains:
   How to run the project
   Your architectural approach
   What you would add or refine with more time
2. Any notes about design decisions, tradeoffs and assumptions.

How this will be used in the interview
In our follow-up session, we will:
Walk through your code and decision-making
Pair together to make small changes
Discuss how you would evolve it into a scalable, production-ready feature
