import { ALL_MUSCLES, PRIMARY_MUSCLES, MuscleGroup } from '../data/exercises';
import { WorkoutEntry, calculateCurrentWeekVolume } from './volume';
import { getMesocycleAverage, processWeeklyVolumes } from './grades';

export interface MusclePriority {
  muscle: MuscleGroup;
  current: number;
  remaining: number;
  percentage: number;
  isPrimary: boolean;
  mesocycleAvg: number;
  chronicDeficit: boolean;
  priority: number;
}

/** Returns all muscles sorted by priority (highest need first).
 *  Priority = remaining × (isPrimary ? 2 : 1) + (chronicDeficit ? 5 : 0)
 *  Chronic deficit: primary muscle whose 6-week avg is < target × 0.8
 */
export function getMuscleGroupPriorities(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): MusclePriority[] {
  const current = calculateCurrentWeekVolume(history, weekStart);
  const weeklyVolumes = processWeeklyVolumes(history, weekTarget);
  const mesocycleAvg = getMesocycleAverage(weeklyVolumes);

  return ALL_MUSCLES.map((muscle) => {
    const currentVol = current[muscle] || 0;
    const remaining = Math.max(0, weekTarget - currentVol);
    const percentage = weekTarget > 0 ? (currentVol / weekTarget) * 100 : 0;
    const isPrimary = PRIMARY_MUSCLES.includes(muscle);
    const mesocycleAvgVal = mesocycleAvg[muscle] || 0;
    const chronicDeficit = isPrimary && mesocycleAvgVal < weekTarget * 0.8;
    const priority = remaining * (isPrimary ? 2 : 1) + (chronicDeficit ? 5 : 0);

    return {
      muscle,
      current: currentVol,
      remaining,
      percentage,
      isPrimary,
      mesocycleAvg: mesocycleAvgVal,
      chronicDeficit,
      priority,
    };
  }).sort((a, b) => b.priority - a.priority);
}
