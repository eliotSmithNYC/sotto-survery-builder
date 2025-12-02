# Extensibility Plan: Survey Builder Evolution

## Executive Summary

This document outlines a strategic plan for evolving the Survey Builder from a well-structured exercise into a production-ready, scalable feature. The current codebase demonstrates excellent foundations—clean component composition, thoughtful state management, and good separation of concerns. This plan focuses on architectural patterns that will enable the system to scale across multiple dimensions: question types, validation rules, team collaboration, performance, and feature complexity.

---

## 1. Question Type System: Plugin Architecture

### Current State

Question types are hardcoded with if/else statements in multiple places:

- `QuestionCard.tsx` - Type selection dropdown and option management
- `PreviewQuestion.tsx` - Rendering logic
- `questionsReducer.ts` - Type change initialization
- `validation.ts` - Type-specific validation
- `schemas.ts` - Zod schema definitions

### Production-Ready Approach: Strategy Pattern

**Create a Question Type Registry:**

```typescript
// src/lib/questionTypes/registry.ts
export interface QuestionTypeDefinition {
  id: QuestionType;
  label: string;
  icon?: React.ComponentType;

  // Builder UI
  builderComponent: React.ComponentType<QuestionBuilderProps>;
  defaultConfig: Partial<Question>;

  // Preview/Runtime UI
  previewComponent: React.ComponentType<PreviewQuestionProps>;

  // Validation
  validate: (question: Question) => ValidationResult;
  validateResponse: (question: Question, response: unknown) => ValidationResult;

  // Schema
  zodSchema: z.ZodType;
  responseZodSchema: z.ZodType;

  // Type conversion
  onTypeChange?: (question: Question, newType: QuestionType) => Question;

  // Metadata
  description?: string;
  category?: "input" | "selection" | "rating" | "media" | "custom";
  requiresOptions?: boolean;
  maxOptions?: number;
  minOptions?: number;
}
```

**Implementation Pattern:**

```typescript
// src/lib/questionTypes/types/text.ts
export const textQuestionType: QuestionTypeDefinition = {
  id: "text",
  label: "Freeform Text",
  category: "input",
  builderComponent: TextQuestionBuilder,
  previewComponent: TextQuestionPreview,
  defaultConfig: { type: "text", options: [] },
  validate: (q) => ({ valid: !!q.label.trim(), errors: [] }),
  validateResponse: (q, r) => ({
    valid: typeof r === "string",
    errors: typeof r !== "string" ? ["Must be a string"] : [],
  }),
  zodSchema: QuestionSchema.extend({ type: z.literal("text") }),
  responseZodSchema: z.string(),
};

// src/lib/questionTypes/registry.ts
class QuestionTypeRegistry {
  private types = new Map<QuestionType, QuestionTypeDefinition>();

  register(type: QuestionTypeDefinition) {
    this.types.set(type.id, type);
  }

  get(type: QuestionType): QuestionTypeDefinition {
    const def = this.types.get(type);
    if (!def) throw new Error(`Unknown question type: ${type}`);
    return def;
  }

  getAll(): QuestionTypeDefinition[] {
    return Array.from(this.types.values());
  }

  getByCategory(category: string) {
    return this.getAll().filter((t) => t.category === category);
  }
}

export const questionTypeRegistry = new QuestionTypeRegistry();

// Initialize built-in types
questionTypeRegistry.register(textQuestionType);
questionTypeRegistry.register(multipleChoiceQuestionType);
```

**Benefits:**

- Adding a new question type requires only creating a new definition file
- No changes to core components (`QuestionCard`, `PreviewQuestion`)
- Third-party plugins can register custom types
- Type-safe with full TypeScript support
- Easy to test in isolation

**Migration Path:**

1. Create registry infrastructure
2. Migrate existing types one at a time
3. Update components to use registry
4. Remove hardcoded type logic

---

## 2. Validation Framework: Rule-Based System

### Current State

Validation is hardcoded in `validation.ts` with type-specific logic mixed together.

### Production-Ready Approach: Declarative Rules

**Rule-Based Validation:**

```typescript
// src/lib/validation/rules.ts
export interface ValidationRule {
  id: string;
  appliesTo: (question: Question) => boolean;
  validate: (question: Question) => ValidationError[];
  priority?: number; // For rule ordering
}

export const rules: ValidationRule[] = [
  {
    id: "label-required",
    appliesTo: () => true, // All questions
    validate: (q) =>
      !q.label.trim()
        ? [{ field: "label", message: "Question label is required" }]
        : [],
  },
  {
    id: "options-required-multiple-choice",
    appliesTo: (q) => q.type === "multipleChoice",
    validate: (q) => {
      if (q.options.length === 0) {
        return [
          { field: "options", message: "At least one option is required" },
        ];
      }
      return q.options
        .map((opt, i) =>
          !opt.text.trim()
            ? {
                field: `options[${i}].text`,
                message: "Option text cannot be empty",
              }
            : null
        )
        .filter(Boolean) as ValidationError[];
    },
  },
  {
    id: "min-options",
    appliesTo: (q) => q.type === "multipleChoice",
    validate: (q) => {
      const typeDef = questionTypeRegistry.get(q.type);
      if (typeDef.minOptions && q.options.length < typeDef.minOptions) {
        return [
          {
            field: "options",
            message: `At least ${typeDef.minOptions} options required`,
          },
        ];
      }
      return [];
    },
  },
];

// src/lib/validation/validator.ts
export class QuestionValidator {
  constructor(private rules: ValidationRule[] = rules) {}

  validate(question: Question): ValidationResult {
    const errors: ValidationError[] = [];

    const applicableRules = this.rules
      .filter((rule) => rule.appliesTo(question))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const rule of applicableRules) {
      errors.push(...rule.validate(question));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  addRule(rule: ValidationRule) {
    this.rules.push(rule);
  }
}
```

**Custom Validation Rules:**

```typescript
// Example: Custom rule for rating questions
const ratingRangeRule: ValidationRule = {
  id: "rating-range",
  appliesTo: (q) => q.type === "rating",
  validate: (q) => {
    const config = q.config as RatingConfig;
    if (config.min >= config.max) {
      return [{ field: "config", message: "Min must be less than max" }];
    }
    return [];
  },
};

validator.addRule(ratingRangeRule);
```

**Benefits:**

- Validation logic is composable and testable
- Rules can be added/removed dynamically
- Easy to create question-type-specific rules
- Validation errors are structured and can be displayed contextually
- Rules can be shared across question types

---

## 3. State Management Evolution

### Current State

- `useReducer` for questions (excellent choice)
- `useState` for UI state and responses
- Props drilling through 2-3 levels

### When to Introduce Context

**Phase 1: Keep Current Approach** (0-10 questions, single user)

- Current state management is appropriate
- Props drilling is acceptable at this scale

**Phase 2: Context for Deep Prop Drilling** (10-50 questions)

```typescript
// src/contexts/SurveyBuilderContext.tsx
interface SurveyBuilderContextValue {
  questions: Question[];
  dispatch: React.Dispatch<QuestionAction>;
  selectedQuestionId?: string;
  setSelectedQuestionId: (id: string | undefined) => void;
  // ... other builder-specific state
}

export const SurveyBuilderContext = createContext<SurveyBuilderContextValue | null>(null);

// Usage: Wrap only the builder area
<SurveyBuilderProvider>
  <BuilderArea />
  <QuestionSidebar />
</SurveyBuilderProvider>
```

**Phase 3: External State Management** (50+ questions, collaboration, persistence)
Consider Zustand or Jotai for:

- Optimistic updates
- Undo/redo
- Conflict resolution
- Offline support
- Real-time sync

```typescript
// src/stores/surveyStore.ts (Zustand example)
interface SurveyStore {
  questions: Question[];
  responses: SurveyResponse;
  selectedQuestionId?: string;

  // Actions
  addQuestion: () => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  // ...

  // Async actions
  saveSurvey: () => Promise<void>;
  loadSurvey: (id: string) => Promise<void>;

  // Undo/redo
  history: HistoryState;
  undo: () => void;
  redo: () => void;
}
```

**Decision Matrix:**

- **useReducer + useState**: < 10 questions, no persistence, single user
- **Context**: 10-50 questions, moderate prop drilling, single user
- **Zustand/Jotai**: 50+ questions, persistence, collaboration, undo/redo
- **Redux**: Complex business logic, time-travel debugging, large team

---

## 4. Component Architecture: Pluggable Components

### Current State

Components are well-composed but tightly coupled to question types.

### Production-Ready Approach: Render Props + Compound Components

**Builder Component Pattern:**

```typescript
// src/components/QuestionBuilder/QuestionBuilder.tsx
interface QuestionBuilderProps {
  question: Question;
  onChange: (question: Question) => void;
  onDelete: () => void;
  isSelected: boolean;
}

export function QuestionBuilder({ question, onChange, onDelete, isSelected }: QuestionBuilderProps) {
  const typeDef = questionTypeRegistry.get(question.type);
  const BuilderComponent = typeDef.builderComponent;

  return (
    <Card variant={isSelected ? 'selected' : 'default'}>
      <QuestionBuilder.Header>
        <QuestionTypeSelector
          value={question.type}
          onChange={(newType) => onChange({ ...question, type: newType })}
        />
        <DeleteButton onClick={onDelete} />
      </QuestionBuilder.Header>

      <QuestionBuilder.Body>
        <LabelInput
          value={question.label}
          onChange={(label) => onChange({ ...question, label })}
        />
        <RequiredToggle
          value={question.required}
          onChange={(required) => onChange({ ...question, required })}
        />
        <BuilderComponent
          question={question}
          onChange={onChange}
        />
      </QuestionBuilder.Body>
    </Card>
  );
}
```

**Preview Component Pattern:**

```typescript
// src/components/QuestionPreview/QuestionPreview.tsx
export function QuestionPreview({
  question,
  value,
  onChange
}: PreviewQuestionProps) {
  const typeDef = questionTypeRegistry.get(question.type);
  const PreviewComponent = typeDef.previewComponent;

  return (
    <Card>
      <QuestionPreview.Label required={question.required}>
        {question.label}
      </QuestionPreview.Label>
      <PreviewComponent
        question={question}
        value={value}
        onChange={onChange}
      />
    </Card>
  );
}
```

**Benefits:**

- Components automatically adapt to new question types
- Type-safe component registration
- Easy to swap implementations (e.g., A/B test different UIs)
- Components can be lazy-loaded for code splitting

---

## 5. Data Layer: Persistence & Sync

### Current State

All data exists in memory only.

### Production-Ready Approach: Repository Pattern

**Data Access Layer:**

```typescript
// src/lib/data/repositories/SurveyRepository.ts
export interface SurveyRepository {
  save(survey: SurveyDefinition): Promise<Survey>;
  load(id: string): Promise<SurveyDefinition>;
  list(filters?: SurveyFilters): Promise<Survey[]>;
  delete(id: string): Promise<void>;
}

// Implementations
export class LocalStorageSurveyRepository implements SurveyRepository {
  async save(survey: SurveyDefinition): Promise<Survey> {
    const id = survey.id || crypto.randomUUID();
    localStorage.setItem(`survey:${id}`, JSON.stringify(survey));
    return { ...survey, id };
  }
  // ...
}

export class ApiSurveyRepository implements SurveyRepository {
  constructor(private apiClient: ApiClient) {}

  async save(survey: SurveyDefinition): Promise<Survey> {
    const response = await this.apiClient.post("/surveys", survey);
    return response.data;
  }
  // ...
}
```

**Sync Strategy:**

```typescript
// src/lib/data/sync/SurveySync.ts
export class SurveySync {
  constructor(
    private localRepo: SurveyRepository,
    private remoteRepo: SurveyRepository,
    private conflictResolver: ConflictResolver
  ) {}

  async sync(surveyId: string): Promise<SyncResult> {
    const local = await this.localRepo.load(surveyId);
    const remote = await this.remoteRepo.load(surveyId);

    if (local.updatedAt > remote.updatedAt) {
      // Local is newer, push
      await this.remoteRepo.save(local);
      return { type: "pushed", survey: local };
    } else if (remote.updatedAt > local.updatedAt) {
      // Remote is newer, pull
      await this.localRepo.save(remote);
      return { type: "pulled", survey: remote };
    } else {
      // Conflict
      const resolved = await this.conflictResolver.resolve(local, remote);
      await this.localRepo.save(resolved);
      await this.remoteRepo.save(resolved);
      return { type: "resolved", survey: resolved };
    }
  }
}
```

**Optimistic Updates:**

```typescript
// src/hooks/useOptimisticSurvey.ts
export function useOptimisticSurvey(surveyId: string) {
  const [localState, setLocalState] = useState<SurveyDefinition>();
  const [pendingMutations, setPendingMutations] = useState<Mutation[]>([]);

  const updateQuestion = async (id: string, patch: Partial<Question>) => {
    // Optimistic update
    setLocalState((prev) => ({
      ...prev!,
      questions: prev!.questions.map((q) =>
        q.id === id ? { ...q, ...patch } : q
      ),
    }));

    // Queue mutation
    const mutation = { type: "updateQuestion", id, patch };
    setPendingMutations((prev) => [...prev, mutation]);

    try {
      await api.updateQuestion(surveyId, id, patch);
      setPendingMutations((prev) => prev.filter((m) => m !== mutation));
    } catch (error) {
      // Rollback
      setLocalState(await loadSurvey(surveyId));
      setPendingMutations((prev) => prev.filter((m) => m !== mutation));
      throw error;
    }
  };

  return { survey: localState, updateQuestion /* ... */ };
}
```

---

## 6. Performance Optimization

### Current State

No performance optimizations. Works well for small surveys.

### Production-Ready Optimizations

**1. Virtualization for Long Lists:**

```typescript
// src/components/BuilderArea.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function BuilderArea({ questions }: BuilderAreaProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: questions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated card height
    overscan: 5, // Render 5 extra items
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <QuestionCard question={questions[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**2. Memoization:**

```typescript
// Memoize expensive computations
const validQuestions = useMemo(
  () => questions.filter((q) => isQuestionValid(q)),
  [questions]
);

// Memoize components
const QuestionCardMemo = React.memo(QuestionCard, (prev, next) => {
  return (
    prev.question.id === next.question.id &&
    prev.question.label === next.question.label &&
    prev.isSelected === next.isSelected
  );
});
```

**3. Code Splitting:**

```typescript
// Lazy load question type components
const TextQuestionBuilder = lazy(
  () => import("./questionTypes/text/TextQuestionBuilder")
);
const MultipleChoiceBuilder = lazy(
  () => import("./questionTypes/multipleChoice/MultipleChoiceBuilder")
);

// Lazy load preview area (only needed when viewing preview)
const PreviewArea = lazy(() => import("./PreviewArea"));
```

**4. Debounced Auto-Save:**

```typescript
// src/hooks/useAutoSave.ts
export function useAutoSave(survey: SurveyDefinition, delay = 2000) {
  const debouncedSave = useMemo(
    () =>
      debounce(async (survey: SurveyDefinition) => {
        await surveyRepository.save(survey);
      }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSave(survey);
    return () => debouncedSave.cancel();
  }, [survey, debouncedSave]);
}
```

**Performance Targets:**

- Initial render: < 100ms for 50 questions
- Question update: < 16ms (60fps)
- Scroll: 60fps with virtualization
- Auto-save: Non-blocking, debounced

---

## 7. Feature Extensions

### 7.1 Conditional Logic / Branching

**Architecture:**

```typescript
// src/lib/types.ts
export interface ConditionalRule {
  id: string;
  questionId: string; // Question this rule applies to
  condition: Condition;
  action: 'show' | 'hide' | 'require' | 'skip';
}

export type Condition =
  | { type: 'equals'; questionId: string; value: string }
  | { type: 'contains'; questionId: string; value: string }
  | { type: 'greaterThan'; questionId: string; value: number }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] };

// src/lib/conditionalLogic/evaluator.ts
export class ConditionalLogicEvaluator {
  evaluate(
    rule: ConditionalRule,
    responses: SurveyResponse
  ): boolean {
    return this.evaluateCondition(rule.condition, responses);
  }

  private evaluateCondition(
    condition: Condition,
    responses: SurveyResponse
  ): boolean {
    switch (condition.type) {
      case 'equals':
        const response = responses[condition.questionId];
        return response === condition.value;
      // ... other condition types
    }
  }
}

// src/components/PreviewArea.tsx
export function PreviewArea({ questions, responses, rules }: PreviewAreaProps) {
  const evaluator = new ConditionalLogicEvaluator();

  const visibleQuestions = useMemo(() => {
    return questions.filter(q => {
      const rule = rules.find(r => r.questionId === q.id);
      if (!rule) return true;

      const shouldShow = evaluator.evaluate(rule, responses);
      return rule.action === 'show' ? shouldShow : !shouldShow;
    });
  }, [questions, responses, rules]);

  return (
    <div>
      {visibleQuestions.map(q => (
        <PreviewQuestion key={q.id} question={q} />
      ))}
    </div>
  );
}
```

### 7.2 Question Templates / Library

```typescript
// src/lib/templates/QuestionTemplate.ts
export interface QuestionTemplate {
  id: string;
  name: string;
  category: string;
  question: Omit<Question, "id">;
  tags: string[];
}

// src/lib/templates/TemplateLibrary.ts
export class TemplateLibrary {
  private templates: QuestionTemplate[] = [];

  addTemplate(template: QuestionTemplate) {
    this.templates.push(template);
  }

  search(query: string, category?: string): QuestionTemplate[] {
    return this.templates
      .filter((t) => !category || t.category === category)
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );
  }

  instantiate(templateId: string): Question {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    return {
      ...template.question,
      id: crypto.randomUUID(),
    };
  }
}
```

### 7.3 Rich Media Support

```typescript
// src/lib/types.ts
export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  metadata?: Record<string, unknown>;
}

export interface Question {
  // ... existing fields
  media?: MediaAttachment[];
  mediaPosition?: 'before' | 'after' | 'background';
}

// src/components/MediaUploader.tsx
export function MediaUploader({
  question,
  onUpload
}: MediaUploaderProps) {
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    const attachment: MediaAttachment = await response.json();
    onUpload(attachment);
  };

  return (
    <div>
      <input type="file" onChange={e => handleUpload(e.target.files[0])} />
      {/* Preview existing media */}
    </div>
  );
}
```

---

## 8. Team Collaboration

### 8.1 Real-Time Collaboration

**WebSocket Integration:**

```typescript
// src/lib/collaboration/CollaborationClient.ts
export class CollaborationClient {
  private ws: WebSocket;
  private presence: Map<string, UserPresence> = new Map();

  constructor(surveyId: string) {
    this.ws = new WebSocket(
      `ws://api.example.com/surveys/${surveyId}/collaborate`
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "question_updated":
          this.handleQuestionUpdate(message.payload);
          break;
        case "user_joined":
          this.presence.set(message.userId, message.presence);
          break;
        case "cursor_moved":
          this.handleCursorMove(message.userId, message.position);
          break;
      }
    };
  }

  updateQuestion(questionId: string, patch: Partial<Question>) {
    this.ws.send(
      JSON.stringify({
        type: "update_question",
        questionId,
        patch,
      })
    );
  }
}
```

**Operational Transform / CRDT:**

For conflict-free collaboration, consider:

- **Yjs** (CRDT-based) for shared state
- **ShareJS** (Operational Transform) for text editing
- **Automerge** (CRDT) for structured data

### 8.2 Versioning & History

```typescript
// src/lib/versioning/SurveyVersion.ts
export interface SurveyVersion {
  id: string;
  surveyId: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  snapshot: SurveyDefinition;
  changes: Change[];
}

export interface Change {
  type: "question_added" | "question_updated" | "question_deleted";
  questionId: string;
  before?: Question;
  after?: Question;
  timestamp: Date;
  userId: string;
}

// src/lib/versioning/VersionManager.ts
export class VersionManager {
  async createVersion(
    survey: SurveyDefinition,
    changes: Change[]
  ): Promise<SurveyVersion> {
    return {
      id: crypto.randomUUID(),
      surveyId: survey.id,
      version: await this.getNextVersion(survey.id),
      createdAt: new Date(),
      createdBy: getCurrentUserId(),
      snapshot: survey,
      changes,
    };
  }

  async restoreVersion(versionId: string): Promise<SurveyDefinition> {
    const version = await this.loadVersion(versionId);
    return version.snapshot;
  }

  async getHistory(surveyId: string): Promise<SurveyVersion[]> {
    // Load version history
  }
}
```

---

## 9. Testing Strategy

### Unit Tests

```typescript
// src/lib/questionTypes/__tests__/registry.test.ts
describe("QuestionTypeRegistry", () => {
  it("registers and retrieves question types", () => {
    const registry = new QuestionTypeRegistry();
    registry.register(textQuestionType);

    expect(registry.get("text")).toBe(textQuestionType);
  });

  it("throws error for unknown type", () => {
    const registry = new QuestionTypeRegistry();
    expect(() => registry.get("unknown")).toThrow();
  });
});

// src/lib/validation/__tests__/validator.test.ts
describe("QuestionValidator", () => {
  it("validates required label", () => {
    const validator = new QuestionValidator();
    const question = {
      id: "1",
      label: "",
      type: "text",
      required: false,
      options: [],
    };

    const result = validator.validate(question);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "label",
      message: "Question label is required",
    });
  });
});
```

### Integration Tests

```typescript
// src/components/__tests__/QuestionBuilder.integration.test.tsx
describe('QuestionBuilder Integration', () => {
  it('updates question when type changes', async () => {
    const { getByLabelText } = render(
      <QuestionBuilder
        question={mockQuestion}
        onChange={jest.fn()}
      />
    );

    const typeSelect = getByLabelText('Question Type');
    fireEvent.change(typeSelect, { target: { value: 'multipleChoice' } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'multipleChoice' })
      );
    });
  });
});
```

### E2E Tests

```typescript
// e2e/survey-builder.spec.ts
test("create and preview survey", async ({ page }) => {
  await page.goto("/");

  // Add question
  await page.click("text=Add question");
  await page.fill('[aria-label="Question Label"]', "What is your name?");

  // Change to multiple choice
  await page.selectOption('[aria-label="Question Type"]', "multipleChoice");
  await page.fill('[placeholder="Option 1"]', "John");
  await page.fill('[placeholder="Option 2"]', "Jane");

  // Preview
  await page.click("text=Preview");
  await page.click("text=John");

  // Verify response
  const response = await page.textContent('[data-testid="json-responses"]');
  expect(response).toContain("John");
});
```

---

## 10. API Design for Extensibility

### RESTful API with Extensibility Hooks

```typescript
// API endpoints
POST   /api/surveys
GET    /api/surveys/:id
PUT    /api/surveys/:id
DELETE /api/surveys/:id

POST   /api/surveys/:id/questions
PUT    /api/surveys/:id/questions/:questionId
DELETE /api/surveys/:id/questions/:questionId

// Extensibility hooks
POST   /api/surveys/:id/hooks/validate
POST   /api/surveys/:id/hooks/before-save
POST   /api/surveys/:id/hooks/after-save
```

### GraphQL for Flexible Queries

```graphql
type Survey {
  id: ID!
  title: String
  questions: [Question!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Question {
  id: ID!
  type: QuestionType!
  label: String!
  required: Boolean!
  config: QuestionConfig
  options: [ChoiceOption!]
}

union QuestionConfig = TextConfig | MultipleChoiceConfig | RatingConfig

query GetSurvey($id: ID!) {
  survey(id: $id) {
    id
    questions {
      id
      type
      label
      ... on MultipleChoiceQuestion {
        options {
          id
          text
        }
      }
    }
  }
}
```

---

## 11. Migration Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Implement question type registry
- [ ] Migrate existing question types to registry
- [ ] Create validation rule system
- [ ] Add unit tests for core logic

### Phase 2: Data Layer (Weeks 3-4)

- [ ] Implement repository pattern
- [ ] Add local storage persistence
- [ ] Implement optimistic updates
- [ ] Add error handling and retry logic

### Phase 3: Performance (Weeks 5-6)

- [ ] Add virtualization for long lists
- [ ] Implement memoization
- [ ] Code splitting for question types
- [ ] Performance monitoring

### Phase 4: Features (Weeks 7-10)

- [ ] Conditional logic system
- [ ] Question templates/library
- [ ] Rich media support
- [ ] Export/import functionality

### Phase 5: Collaboration (Weeks 11-14)

- [ ] Real-time collaboration
- [ ] Versioning system
- [ ] Conflict resolution
- [ ] Presence indicators

### Phase 6: Scale (Weeks 15+)

- [ ] Backend API integration
- [ ] Multi-tenant support
- [ ] Analytics and monitoring
- [ ] Plugin system for third-party extensions

---

## 12. Key Principles

1. **Open/Closed Principle**: Open for extension, closed for modification
2. **Dependency Inversion**: Depend on abstractions (interfaces), not concretions
3. **Single Responsibility**: Each component/function has one clear purpose
4. **Composition over Inheritance**: Build complex features from simple, composable parts
5. **Progressive Enhancement**: Start simple, add complexity only when needed
6. **Type Safety**: Leverage TypeScript to catch errors at compile time
7. **Testability**: Design for easy testing from the start

---

## Conclusion

The current codebase provides an excellent foundation. The extensibility plan outlined here focuses on:

1. **Plugin Architecture**: Making question types truly pluggable
2. **Declarative Systems**: Validation, conditional logic, and rules
3. **Scalable State Management**: Progressive evolution from local to global state
4. **Performance**: Optimization strategies for large surveys
5. **Collaboration**: Real-time editing and versioning
6. **Testing**: Comprehensive test coverage strategy

By following this plan, the Survey Builder can evolve from a well-structured exercise into a production-ready, enterprise-scale feature that supports:

- Unlimited question types (including third-party plugins)
- Complex validation rules
- Team collaboration
- High performance with 100+ questions
- Rich feature set (branching, media, templates)
- Robust error handling and recovery

The key is to implement these changes incrementally, maintaining backward compatibility and ensuring each phase delivers value independently.
