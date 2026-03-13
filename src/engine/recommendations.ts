import {
  exerciseLibrary,
  MAJOR_LIFTS,
  MovementCategory,
  MuscleGroup,
  PRIMARY_MUSCLES,
} from '../data/exercises';
import { WorkoutEntry, calculateCurrentWeekVolume, getWorkoutsForWeek } from './volume';
import { getMuscleGroupPriorities, MusclePriority } from './priority';

export interface ExerciseRecommendation {
  exercise: string;
  score: number;
  targets: MuscleGroup[];
  primaryMuscle: MuscleGroup;
  category: 'compound' | 'accessory';
  variants: string[];
  movementCategory: MovementCategory;
}

/** Returns scored exercise recommendations sorted by descending score.
 *  Preserves all logic from getSmartRecommendations in main.jsx:
 *  - Zero-boost (1.5×) for muscles not yet touched this week
 *  - Chronic deficit boost (1.5×)
 *  - Progressive posterior penalty (0.7× at 2 sessions, 0.5× at 3+)
 *  - Major lift injection if a movement category is entirely absent
 */
export function getSmartRecommendations(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): ExerciseRecommendation[] {
  const priorities = getMuscleGroupPriorities(history, weekStart, weekTarget);
  const currentWeekVolume = calculateCurrentWeekVolume(history, weekStart);
  const thisWeekWorkouts = getWorkoutsForWeek(history, weekStart);

  const topNeeds: MusclePriority[] = priorities
    .filter((p) => p.isPrimary && p.remaining > 0)
    .slice(0, 6);

  // Count how many times each movement category was done this week
  const recentSessions: Partial<Record<MovementCategory, number>> = {};
  thisWeekWorkouts.forEach((w) => {
    const ex = exerciseLibrary[w.exercise];
    if (ex?.movementCategory) {
      recentSessions[ex.movementCategory] = (recentSessions[ex.movementCategory] || 0) + 1;
    }
  });

  const recs: ExerciseRecommendation[] = [];

  Object.entries(exerciseLibrary).forEach(([exercise, data]) => {
    if (data.category === 'accessory') return;

    let score = 0;
    const targets: MuscleGroup[] = [];

    topNeeds.forEach((need) => {
      const muscleScore = data.muscles[need.muscle] || 0;
      if (muscleScore > 0) {
        const alreadyHit = (currentWeekVolume[need.muscle] || 0) > 0;
        const zeroBoost = alreadyHit ? 1.0 : 1.5;
        const chronicBoost = need.chronicDeficit ? 1.5 : 1.0;
        const weight = need.remaining * 3 * zeroBoost * chronicBoost;
        score += muscleScore * weight;
        targets.push(need.muscle);
      }
    });

    // Progressive posterior penalty for expensive posterior movements
    if (score > 0) {
      const cat = data.movementCategory || 'press';
      if (cat === 'posterior') {
        const n = recentSessions['posterior'] || 0;
        const expensive =
          (data.axialCost && data.axialCost !== 'low') ||
          (data.erectorCost && data.erectorCost !== 'low');
        if (expensive) {
          const penalty = n >= 3 ? 0.5 : n >= 2 ? 0.7 : 1.0;
          score *= penalty;
        }
      }
    }

    if (score > 0) {
      const primaryMuscle =
        (Object.entries(data.muscles).find(([, s]) => s === 1)?.[0] as MuscleGroup) ||
        targets[0] ||
        ('mixed' as MuscleGroup);

      recs.push({
        exercise,
        score,
        targets: targets.length ? targets : [primaryMuscle],
        primaryMuscle,
        category: data.category,
        variants: data.variants,
        movementCategory: data.movementCategory,
      });
    }
  });

  // Inject major lifts if their movement category is completely missing
  const coveredCategories = new Set(recs.map((r) => r.movementCategory));
  Object.keys(MAJOR_LIFTS).forEach((lift) => {
    const exists = recs.some((r) => r.exercise === lift);
    if (!exists && exerciseLibrary[lift]) {
      const data = exerciseLibrary[lift];
      const cat = data.movementCategory;
      if (!coveredCategories.has(cat)) {
        const primaryMuscle =
          (Object.entries(data.muscles).find(([, s]) => s === 1)?.[0] as MuscleGroup) ||
          ('mixed' as MuscleGroup);
        const targets = Object.keys(data.muscles).filter((m) =>
          PRIMARY_MUSCLES.includes(m as MuscleGroup),
        ) as MuscleGroup[];
        recs.push({
          exercise: lift,
          score: 0.1,
          targets: targets.length ? targets : [primaryMuscle],
          primaryMuscle,
          category: data.category,
          variants: data.variants,
          movementCategory: cat,
        });
        coveredCategories.add(cat);
      }
    }
  });

  return recs.sort((a, b) => b.score - a.score);
}
