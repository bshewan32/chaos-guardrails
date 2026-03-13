import { ALL_MUSCLES, exerciseLibrary, MuscleGroup } from '../data/exercises';

export interface WorkoutEntry {
  id: number;
  exercise: string;
  variant: string;
  sets: number;
  date: string; // ISO string
}

/** Returns the Monday of the week containing the given date (Mon–Sun window, fixed). */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns all workouts that fall within the Mon–Sun week of the given weekStart. */
export function getWorkoutsForWeek(
  history: WorkoutEntry[],
  weekStart: Date,
): WorkoutEntry[] {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  return history.filter((w) => {
    const d = new Date(w.date);
    return d >= weekStart && d < end;
  });
}

/** Calculates effective set volume per muscle for a list of workouts.
 *  Bonus exercises (isBonus=true) are excluded from volume calculations. */
export function calculateVolumeForWorkouts(
  workouts: WorkoutEntry[],
): Record<MuscleGroup, number> {
  const volume: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  ALL_MUSCLES.forEach((m) => (volume[m] = 0));

  workouts.forEach((w) => {
    const ex = exerciseLibrary[w.exercise];
    if (!ex || ex.isBonus) return;
    Object.entries(ex.muscles).forEach(([muscle, multiplier]) => {
      if (ALL_MUSCLES.includes(muscle as MuscleGroup)) {
        volume[muscle as MuscleGroup] += w.sets * (multiplier ?? 0);
      }
    });
  });

  return volume;
}

/** Convenience: volume for the current week. */
export function calculateCurrentWeekVolume(
  history: WorkoutEntry[],
  weekStart: Date,
): Record<MuscleGroup, number> {
  return calculateVolumeForWorkouts(getWorkoutsForWeek(history, weekStart));
}
