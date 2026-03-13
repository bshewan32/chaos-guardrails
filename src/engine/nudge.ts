import { exerciseLibrary, ALL_MUSCLES, MuscleGroup } from '../data/exercises';
import { WorkoutEntry, calculateCurrentWeekVolume } from './volume';

export interface NudgeSuggestion {
  muscle: MuscleGroup;
  remaining: number;
  exercises: Array<{
    exercise: string;
    variants: string[];
    movementCategory: string;
  }>;
}

/** Checks whether any muscle is within 2 sets of its weekly target after a log.
 *  Returns an array of nudge suggestions (one per near-complete muscle).
 *  Only surfaces accessory exercises as quick finishers (no heavy compounds).
 *  Fires at most once per session (caller is responsible for the guard).
 */
export function checkNudge(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): NudgeSuggestion[] {
  const volume = calculateCurrentWeekVolume(history, weekStart);
  const suggestions: NudgeSuggestion[] = [];

  ALL_MUSCLES.forEach((muscle) => {
    const current = volume[muscle] || 0;
    const remaining = weekTarget - current;

    if (remaining > 0 && remaining <= 2) {
      const quickExercises = Object.entries(exerciseLibrary)
        .filter(([, data]) => {
          const contribution = data.muscles[muscle] || 0;
          return contribution >= 0.8 && data.category === 'accessory';
        })
        .map(([name, data]) => ({
          exercise: name,
          variants: data.variants,
          movementCategory: data.movementCategory,
        }));

      if (quickExercises.length > 0) {
        suggestions.push({
          muscle,
          remaining,
          exercises: quickExercises.slice(0, 3),
        });
      }
    }
  });

  return suggestions;
}
