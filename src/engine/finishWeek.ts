import { exerciseLibrary, PRIMARY_MUSCLES, MuscleGroup } from '../data/exercises';
import { WorkoutEntry, calculateCurrentWeekVolume } from './volume';

export interface FinishWeekSuggestion {
  muscle: MuscleGroup;
  remaining: number;
  exercises: Array<{
    exercise: string;
    variants: string[];
  }>;
}

export interface FinishWeekPayload {
  shouldShow: boolean;
  suggestions: FinishWeekSuggestion[];
  totalSetsNeeded: number;
  incompleteMuscles: number;
}

/** Checks whether the "Finish Week" card should appear at end-of-session.
 *  Fires ONLY when ALL primary muscles are within 2 sets of their target.
 *  This is a stricter condition than the nudge (which fires per-muscle).
 */
export function checkFinishWeek(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): FinishWeekPayload {
  const volume = calculateCurrentWeekVolume(history, weekStart);

  const incomplete = PRIMARY_MUSCLES.map((muscle) => {
    const current = volume[muscle] || 0;
    const remaining = weekTarget - current;
    return { muscle, remaining };
  }).filter((m) => m.remaining > 0);

  const totalSetsNeeded = incomplete.reduce((sum, m) => sum + m.remaining, 0);

  // Only show if ALL incomplete muscles are within 2 sets
  const allNear = incomplete.every((m) => m.remaining <= 2);

  if (!allNear || incomplete.length === 0) {
    return { shouldShow: false, suggestions: [], totalSetsNeeded, incompleteMuscles: incomplete.length };
  }

  const suggestions: FinishWeekSuggestion[] = incomplete.map(({ muscle, remaining }) => {
    const quickExercises = Object.entries(exerciseLibrary)
      .filter(([, data]) => {
        const contribution = data.muscles[muscle] || 0;
        return contribution >= 0.8 && data.category === 'accessory';
      })
      .map(([name, data]) => ({
        exercise: name,
        variants: data.variants,
      }))
      .slice(0, 2);

    return { muscle, remaining, exercises: quickExercises };
  });

  return {
    shouldShow: true,
    suggestions,
    totalSetsNeeded,
    incompleteMuscles: incomplete.length,
  };
}
