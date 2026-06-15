/** Normalize a raw score to a 0–100 percentage using the assessment max score. */
export function normalizedPercentScore(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return (score / maxScore) * 100;
}

/** Average normalized percentage across grades that include assessment max scores. */
export function averageNormalizedPercent(grades: Array<{ score: number; assessment: { maxScore: number } }>): number {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((acc, grade) => acc + normalizedPercentScore(grade.score, grade.assessment.maxScore), 0);
  return Math.round((sum / grades.length) * 10) / 10;
}
