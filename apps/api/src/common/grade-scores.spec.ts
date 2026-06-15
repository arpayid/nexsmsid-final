import { describe, expect, it } from "vitest";

import { averageNormalizedPercent, normalizedPercentScore } from "./grade-scores";

describe("grade-scores", () => {
  it("normalizes raw scores to a 0–100 percentage", () => {
    expect(normalizedPercentScore(75, 100)).toBe(75);
    expect(normalizedPercentScore(40, 80)).toBe(50);
  });

  it("averages normalized percentages across assessments with different max scores", () => {
    const average = averageNormalizedPercent([
      { score: 80, assessment: { maxScore: 100 } },
      { score: 40, assessment: { maxScore: 80 } },
    ]);
    expect(average).toBe(65);
  });
});
