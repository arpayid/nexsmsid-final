import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export function parseWithSchema<TSchema extends z.ZodType>(schema: TSchema, input: unknown): z.infer<TSchema> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join(", ");

    throw new BadRequestException(message);
  }

  return parsed.data;
}
