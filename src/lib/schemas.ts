import { z } from "zod";
import { Question, QuestionType } from "./types";

export const ChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const QuestionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["text", "multipleChoice"]),
    required: z.boolean(),
    options: z.array(ChoiceOptionSchema),
  })
  .refine(
    (data) => {
      if (data.type === "multipleChoice") {
        return data.options.length > 0;
      }
      return true;
    },
    {
      message: "Multiple choice questions must have at least one option",
      path: ["options"],
    }
  );

export const SurveyDefinitionSchema = z.object({
  questions: z.array(QuestionSchema),
});

export const MultipleChoiceResponseSchema = z.object({
  optionId: z.string(),
  optionText: z.string(),
});

export const TextResponseSchema = z.string();

export const SurveyResponseSchema = z.record(
  z.union([z.string(), MultipleChoiceResponseSchema])
);

export function parseSurveyDefinition(
  json: unknown
): z.infer<typeof SurveyDefinitionSchema> {
  return SurveyDefinitionSchema.parse(json);
}

export function parseSurveyResponse(
  json: unknown,
  questions: Question[]
): z.infer<typeof SurveyResponseSchema> {
  const response = SurveyResponseSchema.parse(json);

  for (const [questionId, value] of Object.entries(response)) {
    const question = questions.find((q) => q.id === questionId);
    if (!question) {
      throw new z.ZodError([
        {
          code: "custom",
          path: [questionId],
          message: `Question with id "${questionId}" not found in survey definition`,
        },
      ]);
    }

    if (question.type === "multipleChoice") {
      if (typeof value === "string") {
        throw new z.ZodError([
          {
            code: "custom",
            path: [questionId],
            message: `Multiple choice question must have structured response with optionId and optionText`,
          },
        ]);
      }

      const option = question.options.find((opt) => opt.id === value.optionId);
      if (!option) {
        throw new z.ZodError([
          {
            code: "custom",
            path: [questionId, "optionId"],
            message: `Option with id "${value.optionId}" not found in question options`,
          },
        ]);
      }

      if (option.text !== value.optionText) {
        throw new z.ZodError([
          {
            code: "custom",
            path: [questionId, "optionText"],
            message: `Option text mismatch. Expected "${option.text}", got "${value.optionText}"`,
          },
        ]);
      }
    } else {
      if (typeof value !== "string") {
        throw new z.ZodError([
          {
            code: "custom",
            path: [questionId],
            message: `Text question must have string response`,
          },
        ]);
      }
    }
  }

  return response;
}

export function validateSurveyDefinition(data: unknown): {
  success: boolean;
  error?: z.ZodError;
} {
  const result = SurveyDefinitionSchema.safeParse(data);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error };
}

export function validateSurveyResponse(
  data: unknown,
  questions: Question[]
): {
  success: boolean;
  error?: z.ZodError;
} {
  try {
    parseSurveyResponse(data, questions);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

export function formatValidationError(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join(".");
      return path ? `${path}: ${err.message}` : err.message;
    })
    .join("\n");
}

