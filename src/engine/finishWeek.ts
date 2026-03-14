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

// Relaxed threshold: fires when all incomplete primary muscles are within
// this many sets of their target. Raised from 2 to 3 to catch "nearly there"
// states where the score shows progress but a session can't be built normally.
const FINISH_WEEK_THRESHOLD = 3;

/** Checks whether the "Finish Week" card should appear at end-of-session.
 *  Fires ONLY when ALL incomplete primary muscles are within FINISH_WEEK_THRESHOLD
 *  sets of their target. This is a stricter condition than the nudge (per-muscle).
 *
 *  Suggests both accessory exercises AND light compound exercises that
 *  contribute to the remaining muscle groups.
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

  // Only show if ALL incomplete muscles are within threshold
  const allNear = incomplete.every((m) => m.remaining <= FINISH_WEEK_THRESHOLD);

  if (!allNear || incomplete.length === 0) {
    return {
      shouldShow: false,
      suggestions: [],
      totalSetsNeeded,
      incompleteMuscles: incomplete.length,
    };
  }

  const suggestions: FinishWeekSuggestion[] = incomplete.map(({ muscle, remaining }) => {
    // First look for accessory exercises with high contribution
    const accessoryExercises = Object.entries(exerciseLibrary)
      .filter(([, data]) => {
        const contribution = data.muscles[muscle] || 0;
        return contribution >= 0.8 && data.category === 'accessory';
      })
      .map(([name, data]) => ({
        exercise: name,
        variants: data.variants,
      }))
      .slice(0, 2);

    // Also include light compound exercises with meaningful contribution
    const compoundExercises = Object.entries(exerciseLibrary)
      .filter(([, data]) => {
        const contribution = data.muscles[muscle] || 0;
        // Only include moderate or low axial cost compounds as finishers
        const axial = data.axialCost ?? 'low';
        return (
          contribution >= 0.6 &&
          data.category === 'compound' &&
          axial !== 'high'
        );
      })
      .map(([name, data]) => ({
        exercise: name,
        variants: data.variants,
      }))
      .slice(0, 2);

    // Combine, deduplicate, prefer accessories first
    const combined = [...accessoryExercises];
    for (const ex of compoundExercises) {
      if (!combined.some((c) => c.exercise === ex.exercise)) {
        combined.push(ex);
      }
    }

    return {
      muscle,
      remaining,
      exercises: combined.slice(0, 3),
    };
  });

  return {
    shouldShow: true,
    suggestions,
    totalSetsNeeded,
    incompleteMuscles: incomplete.length,
  };
}
