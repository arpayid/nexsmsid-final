import { BadRequestException, PipeTransform } from "@nestjs/common";

const CUID_PATTERN = /^c[0-9a-z]{24}$/;

export class ParseCuidPipe implements PipeTransform<string> {
  transform(value: string) {
    if (!value) {
      throw new BadRequestException("ID parameter is required");
    }
    if (!CUID_PATTERN.test(value)) {
      throw new BadRequestException(`Invalid ID format: ${value}`);
    }
    return value;
  }
}
