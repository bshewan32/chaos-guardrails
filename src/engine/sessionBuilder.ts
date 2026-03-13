import {
  exerciseLibrary,
  MovementCategory,
  MuscleGroup,
  PRIMARY_MUSCLES,
} from '../data/exercises';
import { WorkoutEntry, getWorkoutsForWeek } from './volume';
import { getMuscleGroupPriorities } from './priority';
import { getSmartRecommendations, ExerciseRecommendation } from './recommendations';
import { selectVariant } from './variantSelector';

// ── Session builder constants (preserved from main.jsx) ───────────────────
const MAX_HIGH_AXIAL = 1;
const MAX_MODERATE_AXIAL = 2;
const MAX_HIGH_ERECTOR = 1;
const MAX_POSTERIOR_PER_SESSION = 2;

export interface SessionExercise {
  exercise: string;
  variant: string;
  sets: number;
  movementCategory: MovementCategory;
  targets: MuscleGroup[];
  primaryMuscle: MuscleGroup;
  score: number | null;
}

export interface BuiltSession {
  label: string;
  exercises: SessionExercise[];
  axialNote: string | null;
}

function getAxialCost(exerciseName: string): 'high' | 'moderate' | 'low' {
  return exerciseLibrary[exerciseName]?.axialCost ?? 'low';
}

function getErectorCost(exerciseName: string): 'high' | 'moderate' | 'low' {
  return exerciseLibrary[exerciseName]?.erectorCost ?? 'low';
}

/** Determines session size (number of exercises) based on how much volume
 *  is still needed across primary muscles. Preserved from main.jsx. */
function getSessionSize(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): number {
  const priorities = getMuscleGroupPriorities(history, weekStart, weekTarget);
  const primaryNeeds = priorities.filter((p) => p.isPrimary && p.remaining > 0);
  const totalRemaining = primaryNeeds.reduce((sum, p) => sum + p.remaining, 0);
  const avgRemaining = primaryNeeds.length > 0 ? totalRemaining / primaryNeeds.length : 0;

  if (avgRemaining <= 1) return 2;
  if (avgRemaining <= 2) return 3;
  if (avgRemaining <= 4) return 4;
  if (avgRemaining <= 6) return 5;
  return 5;
}

/** Returns the set of exercises already done this week (by name). */
function getExercisesDoneThisWeek(
  history: WorkoutEntry[],
  weekStart: Date,
): Set<string> {
  return new Set(getWorkoutsForWeek(history, weekStart).map((w) => w.exercise));
}

/** Stochastic Fisher-Yates shuffle. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SESSION_LABELS: Record<number, string> = {
  2: 'Quick Finisher',
  3: 'Light Session',
  4: 'Balanced Session',
  5: 'Solid Session',
};

/** Builds a priority-based session.
 *  Preserves all logic from buildPrioritySessionFromTopRecs in main.jsx:
 *  - Session sizing
 *  - Axial budget (MAX_HIGH_AXIAL, MAX_MODERATE_AXIAL, MAX_HIGH_ERECTOR)
 *  - Posterior quota (MAX_POSTERIOR_PER_SESSION)
 *  - Category diversity pass
 *  - Stochastic shuffle of final order
 *  - 35% accessory finisher
 */
export function buildSession(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
  lastUsedVariantsByExercise: Record<string, string[]>,
): BuiltSession {
  const sessionSize = getSessionSize(history, weekStart, weekTarget);
  const recs = getSmartRecommendations(history, weekStart, weekTarget);
  const priorities = getMuscleGroupPriorities(history, weekStart, weekTarget);
  const doneThisWeek = getExercisesDoneThisWeek(history, weekStart);

  const accessoryNeeds = priorities.filter((p) => !p.isPrimary && p.remaining > 0);

  let highAxialCount = 0;
  let moderateAxialCount = 0;
  let highErectorCount = 0;
  let posteriorCount = 0;

  const chosen: ExerciseRecommendation[] = [];
  const chosenCategories = new Set<MovementCategory>();

  // ── Pass 1: fill from top recommendations, respecting budgets ────────────
  for (const rec of recs) {
    if (chosen.length >= sessionSize) break;
    if (doneThisWeek.has(rec.exercise)) continue;

    const axial = getAxialCost(rec.exercise);
    const erector = getErectorCost(rec.exercise);
    const cat = rec.movementCategory;

    // Axial budget
    if (axial === 'high') {
      // Stochastic override: 15% chance to allow a second high-axial
      if (highAxialCount >= MAX_HIGH_AXIAL && Math.random() > 0.15) continue;
    }
    if (axial === 'moderate' && moderateAxialCount >= MAX_MODERATE_AXIAL) continue;
    if (erector === 'high' && highErectorCount >= MAX_HIGH_ERECTOR) continue;

    // Posterior quota
    if (cat === 'posterior' && posteriorCount >= MAX_POSTERIOR_PER_SESSION) continue;

    chosen.push(rec);
    chosenCategories.add(cat);

    if (axial === 'high') highAxialCount++;
    if (axial === 'moderate') moderateAxialCount++;
    if (erector === 'high') highErectorCount++;
    if (cat === 'posterior') posteriorCount++;
  }

  // ── Pass 2: category diversity — inject missing categories ───────────────
  const allCategories: MovementCategory[] = ['pull', 'squat', 'press', 'posterior'];
  if (chosen.length < sessionSize) {
    for (const cat of allCategories) {
      if (chosenCategories.has(cat)) continue;
      const candidate = recs.find(
        (r) =>
          r.movementCategory === cat &&
          !chosen.some((c) => c.exercise === r.exercise) &&
          !doneThisWeek.has(r.exercise),
      );
      if (candidate) {
        chosen.push(candidate);
        chosenCategories.add(cat);
        if (chosen.length >= sessionSize) break;
      }
    }
  }

  // ── Stochastic shuffle of final order ────────────────────────────────────
  const shuffled = shuffle(chosen.slice(0, sessionSize));

  // ── 35% accessory finisher ───────────────────────────────────────────────
  let finisher: SessionExercise | null = null;
  if (accessoryNeeds.length > 0 && shuffled.length < 4 && Math.random() < 0.35) {
    const topNeed = accessoryNeeds[0];
    const accessoryCandidates = Object.entries(exerciseLibrary).filter(
      ([, data]) =>
        data.category === 'accessory' && (data.muscles[topNeed.muscle] ?? 0) > 0,
    );
    if (accessoryCandidates.length > 0) {
      const [name, data] =
        accessoryCandidates[Math.floor(Math.random() * accessoryCandidates.length)];
      const primaryMuscle =
        (Object.entries(data.muscles).find(([, s]) => s === 1)?.[0] as MuscleGroup) ||
        topNeed.muscle;
      finisher = {
        exercise: name,
        variant: selectVariant(name, data.variants, lastUsedVariantsByExercise, weekStart),
        sets: 3,
        movementCategory: data.movementCategory,
        targets: [topNeed.muscle],
        primaryMuscle,
        score: null,
      };
    }
  }

  // ── Map to SessionExercise with variant and default sets ─────────────────
  const exercises: SessionExercise[] = shuffled.map((rec) => ({
    exercise: rec.exercise,
    variant: selectVariant(
      rec.exercise,
      rec.variants,
      lastUsedVariantsByExercise,
      weekStart,
    ),
    sets: 3,
    movementCategory: rec.movementCategory,
    targets: rec.targets,
    primaryMuscle: rec.primaryMuscle,
    score: rec.score,
  }));

  if (finisher) exercises.push(finisher);

  // ── Axial note for toast ─────────────────────────────────────────────────
  const hasHighAxial = exercises.some((e) => getAxialCost(e.exercise) === 'high');
  const hasSwappedToLow = exercises.some((e) => getAxialCost(e.exercise) === 'low');
  const totalModerate = exercises.filter((e) => getAxialCost(e.exercise) === 'moderate').length;

  let axialNote: string | null = null;
  if (hasHighAxial && hasSwappedToLow && (highAxialCount === MAX_HIGH_AXIAL || highErectorCount === MAX_HIGH_ERECTOR)) {
    axialNote = 'Smart fatigue management';
  } else if (totalModerate === 2 && !hasHighAxial) {
    axialNote = 'Manageable load';
  }

  return {
    label: SESSION_LABELS[exercises.length] ?? `${exercises.length}-Exercise Session`,
    exercises,
    axialNote,
  };
}
