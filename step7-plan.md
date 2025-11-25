# Step 7: JSON Drawer/Panel Component - Detailed Implementation Plan

## Overview
Implement JSON views for both survey definition and responses, with different UI patterns for desktop (collapsible bottom drawer) and mobile (JSON tab content).

## Current State Assessment
- ✅ Steps 1-5 complete
- ✅ Layout structure in place
- ✅ State management wired (questions reducer, responses state)
- ✅ Preview area functional with live response updates
- ✅ Mobile tab system exists with JSON tab placeholder (line 141-144 in page.tsx)
- ✅ Desktop bottom drawer placeholder exists (line 172-174 in page.tsx)
- ⚠️ JSON tab currently shows placeholder text
- ⚠️ JSON drawer currently empty

## Files to Create

### 1. `src/components/JsonPanel.tsx`
Shared component that displays JSON content with tabs for "Definition" and "Responses".

**Props:**
- `questions: Question[]` - Survey questions for definition JSON
- `responses: SurveyResponse` - Current response values for responses JSON

**Responsibilities:**
- Render tab buttons for "Definition" and "Responses"
- Display pretty-printed JSON for selected tab
- Handle copy to clipboard functionality
- Format JSON with proper indentation

**Key Features:**
- Two tabs: "Definition" and "Responses"
- Active tab state management
- Pretty-printed JSON (2-space indentation)
- Copy button for each tab
- Read-only display (no editing)
- Monospace font for JSON
- Syntax highlighting (optional, can use simple styling)
- Scrollable container for long JSON

**JSON Format:**

**Definition JSON:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "label": "Question text",
      "type": "text" | "multipleChoice",
      "required": boolean,
      "options": [
        {
          "id": "uuid",
          "text": "Option text"
        }
      ]
    }
  ]
}
```

**Responses JSON:**
```json
{
  "questionId1": "response value",
  "questionId2": "optionId"
}
```

**Styling:**
- Container: `bg-white border border-zinc-200 rounded-lg`
- Tabs: Horizontal button group with active state
- JSON display: `font-mono text-sm` with proper padding
- Copy button: Small button with icon or text
- Scrollable: `overflow-auto` for long content

### 2. `src/components/JsonDrawer.tsx`
Desktop collapsible bottom drawer component.

**Props:**
- `questions: Question[]` - Survey questions
- `responses: SurveyResponse` - Current responses
- `isOpen: boolean` - Whether drawer is expanded
- `onToggle: () => void` - Handler to toggle drawer

**Responsibilities:**
- Render collapsible drawer UI
- Show collapsed state (small bar with "JSON" label)
- Show expanded state (full JsonPanel)
- Handle smooth expand/collapse animation
- Position at bottom of screen

**Key Features:**
- Collapsed state: Small bar (h-12) with "JSON" label and expand icon
- Expanded state: Full drawer with JsonPanel (h-96 or similar)
- Smooth transition animation
- Border-top to separate from main content
- Fixed position at bottom (desktop only)
- Toggle button with chevron icon (up when open, down when closed)

**Styling:**
- Collapsed: `h-12 border-t border-zinc-200 bg-white flex items-center justify-between px-4`
- Expanded: `h-96 border-t border-zinc-200 bg-white`
- Transition: `transition-all duration-300 ease-in-out`
- Shadow when expanded: `shadow-lg` (optional)

### 3. `src/components/JsonTab.tsx`
Mobile JSON tab content component (wrapper for JsonPanel).

**Props:**
- `questions: Question[]` - Survey questions
- `responses: SurveyResponse` - Current responses

**Responsibilities:**
- Render JsonPanel in mobile-friendly layout
- Full-width container
- Proper padding and spacing

**Key Features:**
- Full-width container
- Padding consistent with other tabs (p-4 md:p-6)
- Scrollable content area
- Same JsonPanel component as desktop

## Layout Changes

### Desktop Layout
**Current State:**
- Bottom drawer placeholder exists (line 172-174 in page.tsx)
- Empty div with border

**Changes Needed:**
- Replace placeholder with JsonDrawer component
- Add state for drawer open/closed (`isJsonDrawerOpen`)
- Pass questions and responses props
- Initially collapsed (isOpen={false})

### Mobile Layout
**Current State:**
- JSON tab placeholder exists (line 141-144 in page.tsx)
- Shows "JSON view" text

**Changes Needed:**
- Replace placeholder with JsonTab component
- Pass questions and responses props
- Full-width scrollable content

## Integration Points

### Update `src/app/page.tsx`

**Changes needed:**
1. Import JsonDrawer and JsonTab components
2. Add state for JSON drawer: `const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState(false)`
3. Replace desktop JSON drawer placeholder (line 172-174) with JsonDrawer:
   ```tsx
   <JsonDrawer
     questions={questions}
     responses={responses}
     isOpen={isJsonDrawerOpen}
     onToggle={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)}
   />
   ```
4. Replace mobile JSON tab placeholder (line 141-144) with JsonTab:
   ```tsx
   {activeTab === "json" && (
     <JsonTab
       questions={questions}
       responses={responses}
     />
   )}
   ```

## Implementation Details

### JSON Formatting

**Use `JSON.stringify` with formatting:**
```typescript
const formattedJson = JSON.stringify(data, null, 2);
```

**For Definition:**
```typescript
const definitionJson = JSON.stringify(
  { questions },
  null,
  2
);
```

**For Responses:**
```typescript
const responsesJson = JSON.stringify(
  responses,
  null,
  2
);
```

### Copy to Clipboard

**Implementation:**
```typescript
const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // Optional: Show toast/notification
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
```

**UI:**
- Small button next to each tab or below JSON display
- Icon: Copy/clipboard icon (SVG)
- Optional: Show "Copied!" feedback (can use state + timeout)

### Tab State Management

**In JsonPanel:**
```typescript
const [activeTab, setActiveTab] = useState<"definition" | "responses">("definition");
```

**Tab Buttons:**
- Horizontal layout
- Active: `bg-zinc-900 text-white`
- Inactive: `bg-zinc-100 text-zinc-600 hover:bg-zinc-200`
- Border-bottom for active state (optional)

### Drawer Animation

**Height transition:**
- Use CSS transitions on height
- Or use max-height with transition
- Smooth expand/collapse

**Chevron icon rotation:**
- Up when open (180deg rotation)
- Down when closed (0deg)
- Transition: `transition-transform duration-300`

## Implementation Steps

### Step 7.1: Create JsonPanel Component
1. Create `src/components/JsonPanel.tsx`
2. Implement props interface
3. Add tab state management
4. Add tab buttons UI
5. Implement JSON formatting for definition
6. Implement JSON formatting for responses
7. Add JSON display area with monospace font
8. Add copy button functionality
9. Style tabs and JSON display
10. Test with sample data

### Step 7.2: Create JsonDrawer Component
1. Create `src/components/JsonDrawer.tsx`
2. Implement props interface
3. Add collapsed state UI (bar with "JSON" label)
4. Add expanded state UI (JsonPanel)
5. Add toggle button with chevron icon
6. Implement smooth height transition
7. Style collapsed and expanded states
8. Test expand/collapse behavior

### Step 7.3: Create JsonTab Component
1. Create `src/components/JsonTab.tsx`
2. Implement props interface
3. Wrap JsonPanel in mobile-friendly container
4. Add proper padding and spacing
5. Ensure scrollable content
6. Test on mobile viewport

### Step 7.4: Integrate into Main Page
1. Update `src/app/page.tsx`
2. Import JsonDrawer and JsonTab
3. Add `isJsonDrawerOpen` state
4. Replace desktop JSON drawer placeholder with JsonDrawer
5. Replace mobile JSON tab placeholder with JsonTab
6. Pass questions and responses props
7. Test desktop drawer expand/collapse
8. Test mobile JSON tab
9. Verify JSON updates live as state changes

### Step 7.5: Polish and Testing
1. Verify JSON formatting is correct
2. Test copy to clipboard functionality
3. Test with empty questions array
4. Test with empty responses object
5. Test with multiple questions and responses
6. Verify live updates work (edit question, see JSON update)
7. Verify live updates work (type in preview, see responses JSON update)
8. Test drawer animation smoothness
9. Test tab switching
10. Verify styling consistency
11. Test on mobile viewport
12. Test on desktop viewport

## Design Decisions

### JSON Format Structure
**Decision:** Use `{ questions: Question[] }` for definition
**Rationale:** Matches SurveyDefinition type, clear structure

### Tab Default
**Decision:** Default to "Definition" tab
**Rationale:** Definition is more stable, responses change frequently

### Drawer Default State
**Decision:** Initially collapsed
**Rationale:** Keeps main content visible, JSON is secondary feature

### Copy Button Placement
**Decision:** Place copy button near JSON display (top-right or bottom-right)
**Rationale:** Easy to find, doesn't interfere with JSON reading

### Drawer Height
**Decision:** Use fixed height (h-96 or similar) when expanded
**Rationale:** Predictable layout, doesn't take over entire screen

### Animation
**Decision:** Smooth CSS transitions for drawer expand/collapse
**Rationale:** Better UX, feels polished

### Monospace Font
**Decision:** Use `font-mono` for JSON display
**Rationale:** Standard for code/JSON, improves readability

## Testing Checklist

- [ ] JsonPanel renders with definition tab active by default
- [ ] JsonPanel shows correct definition JSON format
- [ ] JsonPanel shows correct responses JSON format
- [ ] Tab switching works (Definition ↔ Responses)
- [ ] Copy button copies definition JSON to clipboard
- [ ] Copy button copies responses JSON to clipboard
- [ ] JSON updates when questions change
- [ ] JSON updates when responses change
- [ ] JsonDrawer renders collapsed by default
- [ ] JsonDrawer expands when clicked
- [ ] JsonDrawer collapses when clicked again
- [ ] Drawer animation is smooth
- [ ] Chevron icon rotates correctly
- [ ] JsonTab renders in mobile JSON tab
- [ ] JsonTab shows both definition and responses
- [ ] Mobile JSON tab is scrollable
- [ ] Empty questions array shows `{ "questions": [] }`
- [ ] Empty responses shows `{}`
- [ ] Multiple questions render correctly in JSON
- [ ] Multiple responses render correctly in JSON
- [ ] JSON formatting is properly indented (2 spaces)
- [ ] Monospace font is applied
- [ ] Styling is consistent with rest of app
- [ ] Desktop drawer doesn't interfere with main content
- [ ] Mobile tab works correctly

## Notes

- JSON is read-only (no editing capability)
- JSON updates live as state changes (no manual refresh needed)
- Copy functionality uses modern Clipboard API
- Drawer uses CSS transitions for smooth animation
- Both desktop and mobile use same JsonPanel component (DRY principle)
- JSON formatting uses 2-space indentation (standard)
- Empty states should still show valid JSON (empty arrays/objects)
- No need for JSON validation or error handling (we control the data structure)
- Optional: Could add syntax highlighting library later, but not required for Step 7


