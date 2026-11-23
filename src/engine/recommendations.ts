import {
  exerciseLibrary,
  MAJOR_LIFTS,
  MovementCategory,
  MuscleGroup,
  PRIMARY_MUSCLES,
} from '../data/exercises';
import { WorkoutEntry, calculateCurrentWeekVolume, getWorkoutsForWeek } from './volume';
import { getMuscleGroupPriorities, MusclePriority } from './priority';
import {
  ENABLE_EXPERIMENTAL_BALANCE,
  getMovementSetTotals,
  hasOverheadPressInRecentSessions,
  OVERHEAD_PRESS_CADENCE_BOOST,
  PRESS_BALANCE_SCORE_DAMPENING,
  PULL_BALANCE_SCORE_BOOST,
} from './recommendationExperiment';

export interface ExerciseRecommendation {
  exercise: string;
  score: number;
  targets: MuscleGroup[];
  primaryMuscle: MuscleGroup;
  category: 'compound' | 'accessory';
  variants: string[];
  movementCategory: MovementCategory;
}

/**
 * Returns scored exercise recommendations sorted by descending score.
 *
 * Philosophy: recommendations are primarily NEED-DRIVEN, matching the original PWA.
 * The builder handles structural balancing (category spread, axial budgets).
 * This function should not pre-bias the list by taxonomy — that would double-govern.
 *
 * Scoring formula (per muscle need):
 *   rawScore += muscleContribution × need.remaining × 3 × zeroBoost × chronicBoost
 *
 * The priorityMultiplier (bucket taxonomy) is applied only as a very light tiebreaker
 * (5% influence) so that within the same need-level, hip-dominant exercises are
 * slightly preferred — but need always dominates.
 *
 * Additional modifiers (preserved from original PWA):
 *   - Zero-boost (1.5×) for muscles not yet touched this week
 *   - Chronic deficit boost (1.5×)
 *   - Progressive posterior penalty (0.7× at 2 sessions, 0.5× at 3+) for expensive posterior
 *   - Major lift injection if a movement category is entirely absent
 */
/** Favourite boost — nudges preferred exercises up without overriding need. */
const FAVOURITE_BOOST = 1.3;

export function getSmartRecommendations(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
  favouriteExercises: string[] = [],
): ExerciseRecommendation[] {
  const priorities = getMuscleGroupPriorities(history, weekStart, weekTarget);
  const currentWeekVolume = calculateCurrentWeekVolume(history, weekStart);
  const thisWeekWorkouts = getWorkoutsForWeek(history, weekStart);
  const movementSetTotals = getMovementSetTotals(thisWeekWorkouts);
  const pullSetsBehindPress = movementSetTotals.pull < movementSetTotals.press;
  const overheadPressNeedsCadence =
    ENABLE_EXPERIMENTAL_BALANCE && !hasOverheadPressInRecentSessions(history, 2);

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
    // Only score compound exercises — accessories enter via finisher draw
    if (data.category === 'accessory') return;

    let rawScore = 0;
    const targets: MuscleGroup[] = [];

    topNeeds.forEach((need) => {
      const muscleScore = data.muscles[need.muscle] || 0;
      if (muscleScore > 0) {
        const alreadyHit = (currentWeekVolume[need.muscle] || 0) > 0;
        const zeroBoost = alreadyHit ? 1.0 : 1.5;
        const chronicBoost = need.chronicDeficit ? 1.5 : 1.0;
        const weight = need.remaining * 3 * zeroBoost * chronicBoost;
        rawScore += muscleScore * weight;
        targets.push(need.muscle);
      }
    });

    if (rawScore <= 0) return;

    // Need-driven score — this is the primary signal.
    // The priorityMultiplier is applied at only 5% influence so it acts as a
    // tiebreaker within the same need-level, not as a structural pre-filter.
    // This matches the original PWA philosophy: "what best hits current needs?"
    const multiplier = data.priorityMultiplier ?? 0.333;
    const cat = data.movementCategory;
    // 95% need-driven + 5% taxonomy tiebreaker
    let score = rawScore * (0.95 + 0.05 * multiplier);

    // EXPERIMENT (rollback: set ENABLE_EXPERIMENTAL_BALANCE=false):
    // keep need as the dominant signal, but gently repair a pull deficit by
    // sets. This does not force a pull or suppress a press; it only changes
    // close calls in the sorted recommendation list.
    if (ENABLE_EXPERIMENTAL_BALANCE && pullSetsBehindPress) {
      if (cat === 'pull') score *= PULL_BALANCE_SCORE_BOOST;
      if (cat === 'press') score *= PRESS_BALANCE_SCORE_DAMPENING;
    }

    // EXPERIMENT (rollback: set ENABLE_EXPERIMENTAL_BALANCE=false):
    // overhead press is still need-driven and still subject to axial budgets,
    // but gets a modest cadence nudge after two sessions without it.
    if (
      ENABLE_EXPERIMENTAL_BALANCE &&
      exercise === 'Overhead Press' &&
      overheadPressNeedsCadence
    ) {
      score *= OVERHEAD_PRESS_CADENCE_BOOST;
    }

    // Favourite boost — applied after all other scoring so it can never
    // manufacture a recommendation from zero need, only elevate an existing one.
    if (favouriteExercises.includes(exercise)) {
      score *= FAVOURITE_BOOST;
    }

    // Progressive posterior penalty for expensive posterior movements.
    // Preserved from original PWA: progressively devalues high/moderate axial
    // posterior work based on how many posterior sessions have already happened
    // this week. Does NOT ban posterior — just reduces its score.
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
  });

  // Inject major lifts if their movement category is completely missing
  const coveredCategories = new Set(recs.map((r) => r.movementCategory));
  Object.keys(MAJOR_LIFTS).forEach((lift) => {
    const exists = recs.some((r) => r.exercise === lift);
    if (!exists && exerciseLibrary[lift]) {
      const data = exerciseLibrary[lift];
      const liftCat = data.movementCategory;
      if (!coveredCategories.has(liftCat)) {
        const primaryMuscle =
          (Object.entries(data.muscles).find(([, s]) => s === 1)?.[0] as MuscleGroup) ||
          ('mixed' as MuscleGroup);
        const liftTargets = Object.keys(data.muscles).filter((m) =>
          PRIMARY_MUSCLES.includes(m as MuscleGroup),
        ) as MuscleGroup[];
        recs.push({
          exercise: lift,
          score: 0.1,
          targets: liftTargets.length ? liftTargets : [primaryMuscle],
          primaryMuscle,
          category: data.category,
          variants: data.variants,
          movementCategory: liftCat,
        });
        coveredCategories.add(liftCat);
      }
    }
  });

  return recs.sort((a, b) => b.score - a.score);
}
