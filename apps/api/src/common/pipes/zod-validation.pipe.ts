import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join(", ");
      throw new BadRequestException(messages);
    }
    return parsed.data;
  }
}
