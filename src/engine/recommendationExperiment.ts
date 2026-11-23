import { exerciseLibrary, MovementCategory } from '../data/exercises';
import { WorkoutEntry } from './volume';

/**
 * Experimental recommendation tuning.
 *
 * ROLLBACK: set this to false to restore the proven pre-experiment behavior:
 * - the original need-first scoring without pull/press balance nudges;
 * - the original category order in sessionBuilder;
 * - no overhead-press cadence nudge.
 *
 * This is intentionally centralized so a live test can be reverted with one
 * small, auditable change (or by switching back to master).
 */
export const ENABLE_EXPERIMENTAL_BALANCE = true;

/** Keep this modest: pull preference must not override muscle need. */
export const PULL_BALANCE_SCORE_BOOST = 1.12;

/** Small press dampening only while weekly pull volume is behind. */
export const PRESS_BALANCE_SCORE_DAMPENING = 0.96;

/** Elevates OHP only when it has been absent recently, never from zero need. */
export const OVERHEAD_PRESS_CADENCE_BOOST = 1.18;

export interface MovementSetTotals {
  pull: number;
  press: number;
}

/**
 * Counts completed sets by movement category for the current week. Sets are
 * used rather than exercise-entry counts so the balance matches the user's
 * actual pull/push exposure.
 */
export function getMovementSetTotals(workouts: WorkoutEntry[]): MovementSetTotals {
  return workouts.reduce(
    (totals, workout) => {
      const category = workout.exercise ? getMovementCategory(workout.exercise) : null;
      if (category === 'pull') totals.pull += workout.sets;
      if (category === 'press') totals.press += workout.sets;
      return totals;
    },
    { pull: 0, press: 0 },
  );
}

/**
 * The history model stores one row per exercise, not one row per session.
 * Grouping by ISO calendar date gives a stable, dependency-free session proxy.
 */
export function getRecentSessionDates(workouts: WorkoutEntry[], limit: number): string[] {
  return [...new Set(workouts.map((workout) => workout.date.slice(0, 10)))]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, limit);
}

export function hasOverheadPressInRecentSessions(
  workouts: WorkoutEntry[],
  sessionLimit: number,
): boolean {
  const recentDates = new Set(getRecentSessionDates(workouts, sessionLimit));
  // Do not manufacture an OHP cadence requirement before the user has
  // completed enough sessions for the rule to have meaning.
  if (recentDates.size < sessionLimit) return true;
  return workouts.some(
    (workout) => workout.exercise === 'Overhead Press' && recentDates.has(workout.date.slice(0, 10)),
  );
}

function getMovementCategory(exercise: string): MovementCategory | null {
  return exerciseLibrary[exercise]?.movementCategory ?? null;
}
