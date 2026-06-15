import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../database/prisma.service";

const DEFAULT_FORMAT = "{number}/{category}/NEXSMSID/{romanMonth}/{year}";

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class LetterNumberService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async preview(category: string, date = new Date()) {
    const normalizedCategory = normalizeCategory(category);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const sequence = await this.prisma.letterNumberSequence.findUnique({
      where: { category_year_month: { category: normalizedCategory, year, month } },
    });
    const nextNumber = (sequence?.currentNumber ?? 0) + 1;
    return this.formatNumber(nextNumber, normalizedCategory, year, month, sequence?.format ?? DEFAULT_FORMAT);
  }

  async next(category: string, date = new Date(), client: PrismaClientLike = this.prisma) {
    const normalizedCategory = normalizeCategory(category);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const sequence = await client.letterNumberSequence.upsert({
      where: { category_year_month: { category: normalizedCategory, year, month } },
      update: { currentNumber: { increment: 1 }, format: DEFAULT_FORMAT },
      create: { category: normalizedCategory, year, month, currentNumber: 1, format: DEFAULT_FORMAT },
    });
    return this.formatNumber(sequence.currentNumber, normalizedCategory, year, month, sequence.format);
  }

  formatNumber(number: number, category: string, year: number, month: number, format = DEFAULT_FORMAT) {
    return format
      .replace("{number}", String(number).padStart(3, "0"))
      .replace("{category}", normalizeCategory(category))
      .replace("{romanMonth}", romanMonth(month))
      .replace("{year}", String(year));
  }
}

export function normalizeCategory(category: string) {
  const value = category
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
  return value || "UMUM";
}

function romanMonth(month: number) {
  const values = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return values[month - 1] ?? "I";
}
