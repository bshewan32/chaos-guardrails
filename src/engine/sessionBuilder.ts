import {
  exerciseLibrary,
  MovementCategory,
  MuscleGroup,
  PRIMARY_MUSCLES,
} from '../data/exercises';
import { WorkoutEntry, getWorkoutsForWeek, calculateCurrentWeekVolume } from './volume';
import { getMuscleGroupPriorities } from './priority';
import { getSmartRecommendations, ExerciseRecommendation } from './recommendations';
import { selectVariant } from './variantSelector';

// ── Session builder constants (preserved from main.jsx) ───────────────────
const MAX_HIGH_AXIAL = 1;
const MAX_MODERATE_AXIAL = 2;
const MAX_HIGH_ERECTOR = 1;
const MAX_POSTERIOR_PER_SESSION = 2;

// Overreach threshold: if ALL primary muscles are at or above this % of target,
// switch to overreach mode (accessory-heavy balanced session).
const OVERREACH_THRESHOLD = 0.8;

export type SessionMode = 'normal' | 'overreach' | 'complete';

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
  mode: SessionMode;
  overreachNote: string | null;
}

function getAxialCost(exerciseName: string): 'high' | 'moderate' | 'low' {
  return exerciseLibrary[exerciseName]?.axialCost ?? 'low';
}

function getErectorCost(exerciseName: string): 'high' | 'moderate' | 'low' {
  return exerciseLibrary[exerciseName]?.erectorCost ?? 'low';
}

/** Determines session size based on remaining primary volume. */
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

/** Checks whether the week is in overreach territory:
 *  all primary muscles are at or above OVERREACH_THRESHOLD of the weekly target.
 */
function isOverreachWeek(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): boolean {
  const volume = calculateCurrentWeekVolume(history, weekStart);
  return PRIMARY_MUSCLES.every((m) => {
    const current = volume[m] || 0;
    return current >= weekTarget * OVERREACH_THRESHOLD;
  });
}

/** Checks whether the week is fully complete (all primary muscles at or above target). */
function isWeekComplete(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): boolean {
  const volume = calculateCurrentWeekVolume(history, weekStart);
  return PRIMARY_MUSCLES.every((m) => (volume[m] || 0) >= weekTarget);
}

/** Builds an overreach session: balanced across all 4 movement categories,
 *  pulling from compounds not done this week + accessories.
 *  Respects axial and posterior budgets.
 */
function buildOverreachSession(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
  lastUsedVariantsByExercise: Record<string, string[]>,
  isComplete: boolean,
): BuiltSession {
  const doneThisWeek = getExercisesDoneThisWeek(history, weekStart);

  let highAxialCount = 0;
  let moderateAxialCount = 0;
  let highErectorCount = 0;
  let posteriorCount = 0;

  const chosen: Array<{ name: string; data: typeof exerciseLibrary[string] }> = [];
  const chosenCategories = new Set<MovementCategory>();

  // Target: one exercise per movement category (pull, squat, press, posterior)
  const targetCategories: MovementCategory[] = ['pull', 'squat', 'press', 'posterior'];

  // Shuffle the category order for variety
  const shuffledCategories = shuffle(targetCategories);

  for (const cat of shuffledCategories) {
    // Find candidates in this category not done this week
    const candidates = Object.entries(exerciseLibrary).filter(([name, data]) => {
      if (doneThisWeek.has(name)) return false;
      if (data.movementCategory !== cat) return false;
      if (data.category === 'accessory') return false;

      const axial = getAxialCost(name);
      const erector = getErectorCost(name);

      if (axial === 'high' && highAxialCount >= MAX_HIGH_AXIAL && Math.random() > 0.15) return false;
      if (axial === 'moderate' && moderateAxialCount >= MAX_MODERATE_AXIAL) return false;
      if (erector === 'high' && highErectorCount >= MAX_HIGH_ERECTOR) return false;
      if (cat === 'posterior' && posteriorCount >= MAX_POSTERIOR_PER_SESSION) return false;

      return true;
    });

    if (candidates.length > 0) {
      // Pick randomly from candidates for variety
      const [name, data] = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.push({ name, data });
      chosenCategories.add(cat);

      const axial = getAxialCost(name);
      const erector = getErectorCost(name);
      if (axial === 'high') highAxialCount++;
      if (axial === 'moderate') moderateAxialCount++;
      if (erector === 'high') highErectorCount++;
      if (cat === 'posterior') posteriorCount++;
    }
  }

  // If we still have room (< 4 exercises), add accessories
  const accessoryNeeds = ['shoulders', 'biceps', 'triceps', 'calves', 'core'] as MuscleGroup[];
  if (chosen.length < 4) {
    const accessoryCandidates = Object.entries(exerciseLibrary).filter(([name, data]) => {
      if (doneThisWeek.has(name)) return false;
      if (data.category !== 'accessory') return false;
      return true;
    });

    const shuffledAccessories = shuffle(accessoryCandidates);
    for (const [name, data] of shuffledAccessories) {
      if (chosen.length >= 4) break;
      if (chosen.some((c) => c.name === name)) continue;
      chosen.push({ name, data });
    }
  }

  // Always add at least one accessory finisher if session has room
  if (chosen.length < 5) {
    const accessoryCandidates = Object.entries(exerciseLibrary).filter(([name, data]) => {
      if (doneThisWeek.has(name)) return false;
      if (data.category !== 'accessory') return false;
      if (chosen.some((c) => c.name === name)) return false;
      return true;
    });
    if (accessoryCandidates.length > 0) {
      const [name, data] = accessoryCandidates[Math.floor(Math.random() * accessoryCandidates.length)];
      chosen.push({ name, data });
    }
  }

  // Shuffle final order
  const shuffled = shuffle(chosen);

  const exercises: SessionExercise[] = shuffled.map(({ name, data }) => {
    const primaryMuscle =
      (Object.entries(data.muscles).find(([, s]) => s === 1)?.[0] as MuscleGroup) ||
      (Object.keys(data.muscles)[0] as MuscleGroup);
    const targets = Object.keys(data.muscles) as MuscleGroup[];

    return {
      exercise: name,
      variant: selectVariant(name, data.variants, lastUsedVariantsByExercise, weekStart),
      sets: 3,
      movementCategory: data.movementCategory,
      targets,
      primaryMuscle,
      score: null,
    };
  });

  // Fallback: if somehow still empty, return a pure accessory session
  if (exercises.length === 0) {
    const fallbacks = Object.entries(exerciseLibrary)
      .filter(([, d]) => d.category === 'accessory')
      .slice(0, 3);
    for (const [name, data] of fallbacks) {
      const primaryMuscle = Object.keys(data.muscles)[0] as MuscleGroup;
      exercises.push({
        exercise: name,
        variant: data.variants[0],
        sets: 3,
        movementCategory: data.movementCategory,
        targets: Object.keys(data.muscles) as MuscleGroup[],
        primaryMuscle,
        score: null,
      });
    }
  }

  const overreachNote = isComplete
    ? 'Weekly targets hit — this is bonus work. No pressure on volume.'
    : 'Almost there — this session tops off the week. Light and balanced.';

  return {
    label: isComplete ? 'Bonus Session' : 'Overreach Session',
    exercises,
    axialNote: null,
    mode: isComplete ? 'complete' : 'overreach',
    overreachNote,
  };
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
 *
 *  NEW: Falls back to overreach mode when primary volume is ≥80% complete.
 *  NEW: Never returns an empty session.
 */
export function buildSession(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
  lastUsedVariantsByExercise: Record<string, string[]>,
): BuiltSession {
  // ── Check for overreach / complete week ──────────────────────────────────
  const complete = isWeekComplete(history, weekStart, weekTarget);
  const overreach = isOverreachWeek(history, weekStart, weekTarget);

  if (complete || overreach) {
    return buildOverreachSession(
      history,
      weekStart,
      weekTarget,
      lastUsedVariantsByExercise,
      complete,
    );
  }

  // ── Normal mode ──────────────────────────────────────────────────────────
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

  // ── Guard: if still empty, fall back to overreach session ────────────────
  if (chosen.length === 0) {
    return buildOverreachSession(
      history,
      weekStart,
      weekTarget,
      lastUsedVariantsByExercise,
      false,
    );
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
    mode: 'normal',
    overreachNote: null,
  };
}
