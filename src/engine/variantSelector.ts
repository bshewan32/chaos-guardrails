/** Selects a variant for an exercise using week-seeded deterministic rotation
 *  while avoiding the last 5 used variants.
 *
 *  Preserves the defaultVariant logic from main.jsx exactly.
 */
export function selectVariant(
  exercise: string,
  variants: string[],
  lastUsedVariantsByExercise: Record<string, string[]>,
  weekStart: Date,
): string {
  if (!variants || variants.length === 0) return '';
  if (variants.length === 1) return variants[0];

  const recentHistory = lastUsedVariantsByExercise[exercise] || [];
  const recentSet = new Set(recentHistory.slice(-5));

  // Filter out recently used variants
  const available = variants.filter((v) => !recentSet.has(v));
  const pool = available.length > 0 ? available : variants;

  // Week-seeded deterministic selection
  const weekSeed = weekStart.getTime();
  const exerciseSeed = exercise.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const index = (weekSeed + exerciseSeed) % pool.length;

  return pool[Math.abs(index) % pool.length];
}
