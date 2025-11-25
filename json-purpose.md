# JSON Schema Purpose and Design

## Overview

The JSON output from this survey builder serves as the primary interface for programmatic interaction with survey definitions and responses. This document outlines the schema design, its purpose, and considerations for extensibility.

## Purpose

The JSON format is critical for several use cases:

### 1. AI Tool Calling
When AI systems generate surveys dynamically, they need a structured format to output. The JSON schema provides a clear contract that AI models can follow when creating surveys via function/tool calling. The schema ensures:
- Consistent structure across AI-generated surveys
- Validation of AI outputs before they're used
- Clear type definitions for AI models to understand

### 2. Reinforcement Learning Training Data
Survey responses need to be structured for ML/RL systems to:
- Train models on customer engagement patterns
- Analyze response distributions
- Build recommendation systems
- Optimize survey effectiveness

The structured response format (especially for multiple choice) preserves both the reference (optionId) and human-readable text (optionText), enabling:
- Direct text analysis without lookup operations
- Reference integrity for tracking option changes over time
- Efficient data processing pipelines

### 3. API Integration
Backend systems need to:
- Store survey definitions
- Process and store responses
- Integrate with customer engagement platforms
- Export data for analytics

The JSON format provides a standard interface for these operations.

### 4. Survey Persistence and Restoration
Surveys can be:
- Saved to databases as JSON
- Exported for backup
- Imported to restore previous states
- Shared between systems

## Schema Structure

### Survey Definition Schema

The survey definition represents the structure of a survey:

```json
{
  "questions": [
    {
      "id": "string",
      "label": "string",
      "type": "text" | "multipleChoice",
      "required": boolean,
      "options": [
        {
          "id": "string",
          "text": "string"
        }
      ]
    }
  ]
}
```

**Key Characteristics:**
- `questions`: Ordered array of questions (order matters for survey flow)
- `id`: Unique identifier for each question (used for response mapping)
- `type`: Determines input method and response format
- `options`: Required for `multipleChoice`, ignored for `text` questions
- Each option has both `id` (reference) and `text` (display value)

### Survey Response Schema

Responses map question IDs to answer values:

```json
{
  "question-id-1": "user's text answer",
  "question-id-2": {
    "optionId": "option-abc",
    "optionText": "Very likely"
  }
}
```

**Key Characteristics:**
- Text questions: Direct string values
- Multiple choice questions: Structured objects with both `optionId` and `optionText`
- Mixed format allows efficient processing while maintaining reference integrity

## Design Decisions

### Why Structured Responses for Multiple Choice?

**Problem:** Initially, multiple choice responses stored only option IDs (e.g., `"question-1": "option-abc"`).

**Solution:** Store both `optionId` and `optionText` in a structured object.

**Rationale:**
1. **Human-Readable Analysis**: ML/AI systems can analyze response text directly without looking up option definitions
2. **Reference Integrity**: The `optionId` maintains the link to the original option structure
3. **Temporal Consistency**: If option text changes later, historical responses preserve the original text
4. **Efficiency**: No need for join operations when processing response data
5. **Debugging**: Easier to understand responses in logs and analytics

**Trade-offs:**
- Slightly larger JSON payload (minimal impact)
- More complex type system (handled via TypeScript union types)
- Requires validation to ensure optionText matches optionId (handled by Zod schemas)

### Why Zod Validation?

**Benefits:**
1. **Runtime Safety**: TypeScript types are compile-time only; Zod provides runtime validation
2. **API Contracts**: Ensures data integrity when receiving JSON from external sources (AI, APIs)
3. **Error Messages**: Provides detailed validation errors for debugging
4. **Extensibility**: Easy to add new validation rules as requirements evolve
5. **Type Inference**: Zod schemas can generate TypeScript types, ensuring consistency

**Validation Approach:**
- Basic structure validation (required fields, correct types)
- Conditional validation (options required for multipleChoice)
- Context-aware validation (response optionIds must exist in question definition)
- No over-engineering (e.g., no UUID format validation)

## Extensibility Considerations

### Adding New Question Types

To add a new question type (e.g., "rating", "date", "email"):

1. **Update TypeScript Types:**
   ```typescript
   export type QuestionType = "text" | "multipleChoice" | "rating";
   ```

2. **Update Zod Schema:**
   ```typescript
   type: z.enum(["text", "multipleChoice", "rating"])
   ```

3. **Define Response Format:**
   - For simple types (rating, date): use string
   - For complex types: define structured response object
   - Update `SurveyResponse` union type accordingly

4. **Update UI Components:**
   - Add rendering logic in `PreviewQuestion`
   - Add input handling in `BuilderArea`

### Adding Metadata Fields

Optional metadata can be added without breaking changes:

```typescript
export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options: ChoiceOption[];
  metadata?: {
    category?: string;
    tags?: string[];
    aiGenerated?: boolean;
  };
}
```

Use Zod's `.optional()` or `.nullable()` for backward compatibility.

### Versioning Strategy

If breaking changes are needed in the future:

1. **Add version field:**
   ```json
   {
     "version": "1.0",
     "questions": [...]
   }
   ```

2. **Support multiple versions:**
   - Use Zod's discriminated unions
   - Provide migration utilities
   - Maintain backward compatibility where possible

3. **Document migration paths:**
   - Provide upgrade guides
   - Maintain changelog

### Backward Compatibility

Current design principles for maintaining compatibility:

1. **Optional fields**: Use optional properties for new fields
2. **Union types**: Allow multiple response formats (string | object)
3. **Validation leniency**: Accept old formats and transform to new format
4. **Default values**: Provide sensible defaults for missing fields

## Use Cases

### 1. AI-Generated Surveys

**Scenario:** AI assistant creates a survey based on user requirements.

**Flow:**
1. User: "Create a customer satisfaction survey"
2. AI calls function with JSON definition
3. System validates JSON using Zod schema
4. Survey is created and displayed

**Example:**
```json
{
  "questions": [
    {
      "id": "q1",
      "label": "How satisfied are you with our service?",
      "type": "multipleChoice",
      "required": true,
      "options": [
        { "id": "opt1", "text": "Very satisfied" },
        { "id": "opt2", "text": "Satisfied" },
        { "id": "opt3", "text": "Neutral" },
        { "id": "opt4", "text": "Dissatisfied" }
      ]
    }
  ]
}
```

### 2. Response Data for Reinforcement Learning

**Scenario:** Collect responses to train models on customer engagement patterns.

**Flow:**
1. Users complete surveys
2. Responses are collected in JSON format
3. Data is processed for ML training
4. Models learn optimal survey structures

**Example Response:**
```json
{
  "q1": {
    "optionId": "opt1",
    "optionText": "Very satisfied"
  },
  "q2": "The service was excellent and timely."
}
```

**Benefits:**
- Direct text analysis without option lookups
- Preserved historical context (original option text)
- Efficient batch processing

### 3. API Integration

**Scenario:** Backend system stores and processes surveys.

**Flow:**
1. Frontend sends survey definition JSON
2. Backend validates using shared Zod schema
3. Survey stored in database
4. Responses collected and stored
5. Analytics run on response data

**Integration Points:**
- REST API endpoints accept/return JSON
- Database stores JSON (PostgreSQL JSONB, MongoDB)
- Message queues pass JSON between services
- Webhooks send JSON to external systems

### 4. Survey Persistence

**Scenario:** Save and restore survey state.

**Flow:**
1. User builds survey
2. System exports JSON definition
3. JSON stored (database, file, cloud storage)
4. Later, JSON imported to restore survey

**Benefits:**
- Human-readable format
- Easy to version control
- Simple backup/restore
- Cross-platform compatibility

## Schema Validation

The Zod schemas provide:

1. **Definition Validation**: Ensures survey structure is correct
2. **Response Validation**: Validates responses against question definitions
3. **Type Safety**: TypeScript types inferred from schemas
4. **Error Reporting**: Detailed error messages for debugging

**Usage:**
```typescript
import { parseSurveyDefinition, parseSurveyResponse } from "@/lib/schemas";

// Validate definition
const definition = parseSurveyDefinition(jsonData);

// Validate response
const response = parseSurveyResponse(responseData, questions);
```

## Future Considerations

### Potential Enhancements

1. **Question Dependencies**: Conditional questions based on previous answers
2. **Validation Rules**: Custom validation (e.g., email format, number ranges)
3. **Localization**: Multi-language support in schema
4. **Rich Text**: Support for formatted text in questions/options
5. **Media**: Images, videos in questions
6. **Scoring**: Point values for options (for quizzes)

### Schema Evolution

As new features are added:
- Maintain backward compatibility
- Use optional fields where possible
- Provide migration utilities
- Document breaking changes clearly

## Conclusion

The JSON schema design balances:
- **Simplicity**: Easy to understand and use
- **Flexibility**: Extensible for future needs
- **Robustness**: Validated structure prevents errors
- **Efficiency**: Optimized for AI/ML use cases

The structured response format for multiple choice questions, combined with Zod validation, provides a solid foundation for AI-assisted survey generation, ML training data collection, and API integration.

