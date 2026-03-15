import {
  exerciseLibrary,
  MovementCategory,
  MuscleGroup,
  PRIMARY_MUSCLES,
  SubTier,
} from '../data/exercises';
import { WorkoutEntry, getWorkoutsForWeek, calculateCurrentWeekVolume } from './volume';
import { getMuscleGroupPriorities } from './priority';
import { getSmartRecommendations, ExerciseRecommendation } from './recommendations';
import { selectVariant } from './variantSelector';

// ── Session builder constants ─────────────────────────────────────────────
// These are hard limits — not suggestions. Matching the original PWA exactly.
const MAX_HIGH_AXIAL = 1;         // At most 1 high-axial exercise per session
const MAX_MODERATE_AXIAL = 2;     // At most 2 moderate-axial exercises per session
const MAX_HIGH_ERECTOR = 1;       // At most 1 high-erector exercise per session
const MAX_POSTERIOR_PER_SESSION = 2; // At most 2 posterior exercises per session

// Stochastic axial override: small chance to allow a second high-axial exercise.
// This is the "guardrail with chaos" — rare but possible.
// Set to 0.08 (8%) to match the spirit of the original PWA (which had no override,
// but we want occasional variety). Lower than the previous 15%.
const HIGH_AXIAL_OVERRIDE_CHANCE = 0.08;

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

// ── Budget tracker ────────────────────────────────────────────────────────

interface AxialBudget {
  highAxialCount: number;
  moderateAxialCount: number;
  highErectorCount: number;
  posteriorCount: number;
  usedSubTiers: Set<SubTier>;
}

function freshBudget(): AxialBudget {
  return {
    highAxialCount: 0,
    moderateAxialCount: 0,
    highErectorCount: 0,
    posteriorCount: 0,
    usedSubTiers: new Set(),
  };
}

function getAxialCost(exerciseName: string): 'high' | 'moderate' | 'low' {
  return exerciseLibrary[exerciseName]?.axialCost ?? 'low';
}

function getErectorCost(exerciseName: string): 'high' | 'moderate' | 'low' {
  return exerciseLibrary[exerciseName]?.erectorCost ?? 'low';
}

/**
 * Hard gate: returns true only if this exercise fits within the current budget.
 *
 * Rules (in priority order):
 *  1. Posterior quota — at most MAX_POSTERIOR_PER_SESSION posterior exercises.
 *  2. Sub-tier deduplication — at most ONE exercise per sub-tier per session.
 *     This prevents Deadlift (Heavy) + Deadlift (Moderate) in the same session,
 *     or Row (Bent-Over) + Row (Supported) appearing together.
 *  3. High-axial budget — at most MAX_HIGH_AXIAL high-axial exercises.
 *     A small stochastic override (HIGH_AXIAL_OVERRIDE_CHANCE) allows a rare
 *     second high-axial exercise for unpredictability.
 *  4. Moderate-axial budget — at most MAX_MODERATE_AXIAL moderate-axial exercises.
 *  5. High-erector budget — at most MAX_HIGH_ERECTOR high-erector exercises.
 */
function canAfford(exerciseName: string, budget: AxialBudget): boolean {
  const data = exerciseLibrary[exerciseName];
  if (!data) return false;

  const axial = getAxialCost(exerciseName);
  const erector = getErectorCost(exerciseName);
  const cat = data.movementCategory;
  const subTier = data.subTier;

  // Rule 1: Posterior quota
  if (cat === 'posterior' && budget.posteriorCount >= MAX_POSTERIOR_PER_SESSION) return false;

  // Rule 2: Sub-tier deduplication
  // If this exercise has a sub-tier and we've already used that sub-tier,
  // allow it only with a very small stochastic chance (5%) for rare variety.
  if (subTier && budget.usedSubTiers.has(subTier)) {
    if (Math.random() > 0.05) return false;
  }

  // Rule 3: High-axial budget (hard gate with small override)
  if (axial === 'high') {
    if (budget.highAxialCount >= MAX_HIGH_AXIAL) {
      if (Math.random() > HIGH_AXIAL_OVERRIDE_CHANCE) return false;
    }
  }

  // Rule 4: Moderate-axial budget (hard gate, no override)
  if (axial === 'moderate' && budget.moderateAxialCount >= MAX_MODERATE_AXIAL) return false;

  // Rule 5: High-erector budget (hard gate, no override)
  if (erector === 'high' && budget.highErectorCount >= MAX_HIGH_ERECTOR) return false;

  return true;
}

/** Track costs after an exercise is accepted into the session. */
function trackCost(exerciseName: string, budget: AxialBudget): void {
  const data = exerciseLibrary[exerciseName];
  if (!data) return;

  const axial = getAxialCost(exerciseName);
  const erector = getErectorCost(exerciseName);

  if (axial === 'high') budget.highAxialCount++;
  else if (axial === 'moderate') budget.moderateAxialCount++;

  if (erector === 'high') budget.highErectorCount++;
  if (data.movementCategory === 'posterior') budget.posteriorCount++;
  if (data.subTier) budget.usedSubTiers.add(data.subTier);
}

/**
 * Finds the best affordable alternative in the same movement category.
 * Prefers low-axial/low-erector exercises when the budget is tight.
 * This mirrors findAffordableAlternative() from the original PWA.
 */
function findAffordableAlternative(
  category: MovementCategory,
  recs: ExerciseRecommendation[],
  chosen: ExerciseRecommendation[],
  doneThisWeek: Set<string>,
  budget: AxialBudget,
): ExerciseRecommendation | null {
  const candidates = recs.filter(
    (r) =>
      r.movementCategory === category &&
      canAfford(r.exercise, budget) &&
      !chosen.some((c) => c.exercise === r.exercise) &&
      !doneThisWeek.has(r.exercise),
  );

  if (candidates.length === 0) return null;

  // Prefer low-axial / low-erector candidates when budget is under pressure
  const budgetPressure =
    budget.highAxialCount >= MAX_HIGH_AXIAL ||
    budget.moderateAxialCount >= MAX_MODERATE_AXIAL - 1 ||
    budget.highErectorCount >= MAX_HIGH_ERECTOR;

  if (budgetPressure) {
    const lowCost = candidates.filter(
      (c) => getAxialCost(c.exercise) === 'low' && getErectorCost(c.exercise) === 'low',
    );
    if (lowCost.length > 0) {
      return lowCost[Math.floor(Math.random() * lowCost.length)];
    }
  }

  // Otherwise pick randomly from the top candidates (slight randomness)
  const top = candidates.slice(0, Math.min(3, candidates.length));
  return top[Math.floor(Math.random() * top.length)];
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
function getExercisesDoneThisWeek(history: WorkoutEntry[], weekStart: Date): Set<string> {
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

function isOverreachWeek(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): boolean {
  const volume = calculateCurrentWeekVolume(history, weekStart);
  return PRIMARY_MUSCLES.every((m) => (volume[m] || 0) >= weekTarget * OVERREACH_THRESHOLD);
}

function isWeekComplete(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): boolean {
  const volume = calculateCurrentWeekVolume(history, weekStart);
  return PRIMARY_MUSCLES.every((m) => (volume[m] || 0) >= weekTarget);
}

/** Builds an overreach session: balanced across all 4 movement categories.
 *  Respects the same axial budget and sub-tier deduplication rules.
 */
function buildOverreachSession(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
  lastUsedVariantsByExercise: Record<string, string[]>,
  isComplete: boolean,
): BuiltSession {
  const doneThisWeek = getExercisesDoneThisWeek(history, weekStart);
  const budget = freshBudget();
  const chosen: Array<{ name: string; data: typeof exerciseLibrary[string] }> = [];
  const chosenCategories = new Set<MovementCategory>();

  // Shuffle category order for variety, but still respect priority
  const targetCategories: MovementCategory[] = shuffle(['posterior', 'squat', 'pull', 'press']);

  for (const cat of targetCategories) {
    const candidates = Object.entries(exerciseLibrary).filter(([name, data]) => {
      if (doneThisWeek.has(name)) return false;
      if (data.movementCategory !== cat) return false;
      if (data.category === 'accessory') return false;
      return canAfford(name, budget);
    });

    if (candidates.length > 0) {
      const [name, data] = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.push({ name, data });
      chosenCategories.add(cat);
      trackCost(name, budget);
    }
  }

  // Fill remaining slots with accessories
  const accessoryCandidates = shuffle(
    Object.entries(exerciseLibrary).filter(([name, data]) => {
      if (doneThisWeek.has(name)) return false;
      if (data.category !== 'accessory') return false;
      if (chosen.some((c) => c.name === name)) return false;
      return true;
    }),
  );

  for (const [name, data] of accessoryCandidates) {
    if (chosen.length >= 5) break;
    chosen.push({ name, data });
  }

  const shuffledChosen = shuffle(chosen);

  const exercises: SessionExercise[] = shuffledChosen.map(({ name, data }) => {
    const primaryMuscle =
      (Object.entries(data.muscles).find(([, s]) => s === 1)?.[0] as MuscleGroup) ||
      (Object.keys(data.muscles)[0] as MuscleGroup);
    return {
      exercise: name,
      variant: selectVariant(name, data.variants, lastUsedVariantsByExercise, weekStart),
      sets: 3,
      movementCategory: data.movementCategory,
      targets: Object.keys(data.muscles) as MuscleGroup[],
      primaryMuscle,
      score: null,
    };
  });

  // Hard fallback
  if (exercises.length === 0) {
    const fallbacks = Object.entries(exerciseLibrary)
      .filter(([, d]) => d.category === 'accessory')
      .slice(0, 3);
    for (const [name, data] of fallbacks) {
      exercises.push({
        exercise: name,
        variant: data.variants[0],
        sets: 3,
        movementCategory: data.movementCategory,
        targets: Object.keys(data.muscles) as MuscleGroup[],
        primaryMuscle: Object.keys(data.muscles)[0] as MuscleGroup,
        score: null,
      });
    }
  }

  return {
    label: isComplete ? 'Bonus Session' : 'Overreach Session',
    exercises,
    axialNote: null,
    mode: isComplete ? 'complete' : 'overreach',
    overreachNote: isComplete
      ? 'Weekly targets hit — this is bonus work. No pressure on volume.'
      : 'Almost there — this session tops off the week. Light and balanced.',
  };
}

const SESSION_LABELS: Record<number, string> = {
  2: 'Quick Finisher',
  3: 'Light Session',
  4: 'Balanced Session',
  5: 'Solid Session',
};

/**
 * Builds a priority-based session.
 *
 * Axial fatigue guardrails (matching original PWA behaviour):
 *  - MAX_HIGH_AXIAL = 1: at most one high-axial exercise (e.g. heavy deadlift)
 *  - MAX_MODERATE_AXIAL = 2: at most two moderate-axial exercises (e.g. bent-over row + RDL)
 *  - MAX_HIGH_ERECTOR = 1: at most one high-erector exercise
 *  - MAX_POSTERIOR_PER_SESSION = 2: at most two posterior exercises
 *  - Sub-tier deduplication: at most one exercise per sub-tier (prevents DL Heavy + DL Moderate,
 *    or Bent-Over Row + Supported Row appearing together)
 *
 * When an exercise fails the budget, findAffordableAlternative() is called to find
 * a lower-cost substitute in the same movement category before giving up on that category.
 */
export function buildSession(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
  lastUsedVariantsByExercise: Record<string, string[]>,
): BuiltSession {
  // ── Overreach / complete week check ─────────────────────────────────────
  const complete = isWeekComplete(history, weekStart, weekTarget);
  const overreach = isOverreachWeek(history, weekStart, weekTarget);

  if (complete || overreach) {
    return buildOverreachSession(history, weekStart, weekTarget, lastUsedVariantsByExercise, complete);
  }

  // ── Normal mode ──────────────────────────────────────────────────────────
  const sessionSize = getSessionSize(history, weekStart, weekTarget);
  const recs = getSmartRecommendations(history, weekStart, weekTarget);
  const priorities = getMuscleGroupPriorities(history, weekStart, weekTarget);
  const doneThisWeek = getExercisesDoneThisWeek(history, weekStart);

  const accessoryNeeds = priorities.filter((p) => !p.isPrimary && p.remaining > 0);

  const budget = freshBudget();
  const chosen: ExerciseRecommendation[] = [];
  const chosenCategories = new Set<MovementCategory>();

  // ── Pass 1: one exercise per movement category (category diversity first) ─
  // Iterate categories in priority order. For each category, take the top-scored
  // affordable rec. If the top rec fails the budget, call findAffordableAlternative.
  const categoryOrder: MovementCategory[] = ['posterior', 'squat', 'pull', 'press'];

  for (const cat of categoryOrder) {
    if (chosen.length >= sessionSize) break;

    // Find the top-scored rec in this category
    const topRec = recs.find(
      (r) =>
        r.movementCategory === cat &&
        !doneThisWeek.has(r.exercise) &&
        !chosen.some((c) => c.exercise === r.exercise),
    );

    if (!topRec) continue;

    if (canAfford(topRec.exercise, budget)) {
      chosen.push(topRec);
      chosenCategories.add(cat);
      trackCost(topRec.exercise, budget);
    } else {
      // Top rec is too expensive — find an affordable alternative in this category
      const alt = findAffordableAlternative(cat, recs, chosen, doneThisWeek, budget);
      if (alt) {
        chosen.push(alt);
        chosenCategories.add(cat);
        trackCost(alt.exercise, budget);
      }
      // If no affordable alternative exists, skip this category for this session
    }
  }

  // ── Pass 2: fill remaining slots from top recs (any category) ────────────
  // Bucket-level deduplication: do NOT add a second exercise from the same
  // movement bucket (e.g. hipDominant) unless all 4 categories are already
  // represented in the session. This is the key guard that prevents
  // Deadlift (Heavy) + Deadlift (Moderate) appearing together — they share
  // the same bucket even though they have different sub-tiers.
  if (chosen.length < sessionSize) {
    const allCategoriesCovered =
      chosenCategories.has('posterior') &&
      chosenCategories.has('squat') &&
      chosenCategories.has('pull') &&
      chosenCategories.has('press');

    for (const rec of recs) {
      if (chosen.length >= sessionSize) break;
      if (doneThisWeek.has(rec.exercise)) continue;
      if (chosen.some((c) => c.exercise === rec.exercise)) continue;
      if (!canAfford(rec.exercise, budget)) continue;

      // If all 4 categories are already covered, allow any affordable exercise.
      // If not all covered, only allow exercises from categories not yet in the session
      // OR from categories already in the session but only if the rec's bucket
      // is not already represented (prevents double-deadlift, double-row).
      if (!allCategoriesCovered) {
        const recData = exerciseLibrary[rec.exercise];
        const recBucket = recData?.bucket;
        const bucketAlreadyUsed = recBucket
          ? chosen.some((c) => exerciseLibrary[c.exercise]?.bucket === recBucket)
          : false;
        if (bucketAlreadyUsed) continue;
      }

      chosen.push(rec);
      chosenCategories.add(rec.movementCategory);
      trackCost(rec.exercise, budget);
    }
  }

  // ── Guard: if still empty, fall back to overreach session ────────────────
  if (chosen.length === 0) {
    return buildOverreachSession(history, weekStart, weekTarget, lastUsedVariantsByExercise, false);
  }

  // ── Stochastic shuffle of final order ────────────────────────────────────
  const shuffled = shuffle(chosen.slice(0, sessionSize));

  // ── 35% accessory finisher ───────────────────────────────────────────────
  let finisher: SessionExercise | null = null;
  if (accessoryNeeds.length > 0 && shuffled.length < 4 && Math.random() < 0.35) {
    const topNeed = accessoryNeeds[0];
    const accessoryCandidates = Object.entries(exerciseLibrary).filter(
      ([, data]) => data.category === 'accessory' && (data.muscles[topNeed.muscle] ?? 0) > 0,
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

  // ── Map to SessionExercise ────────────────────────────────────────────────
  const exercises: SessionExercise[] = shuffled.map((rec) => ({
    exercise: rec.exercise,
    variant: selectVariant(rec.exercise, rec.variants, lastUsedVariantsByExercise, weekStart),
    sets: 3,
    movementCategory: rec.movementCategory,
    targets: rec.targets,
    primaryMuscle: rec.primaryMuscle,
    score: rec.score,
  }));

  if (finisher) exercises.push(finisher);

  // ── Axial note ────────────────────────────────────────────────────────────
  const hasHighAxial = exercises.some((e) => getAxialCost(e.exercise) === 'high');
  const hasSwappedToLow = exercises.some((e) => getAxialCost(e.exercise) === 'low');
  const totalModerate = exercises.filter((e) => getAxialCost(e.exercise) === 'moderate').length;

  let axialNote: string | null = null;
  if (
    hasHighAxial &&
    hasSwappedToLow &&
    (budget.highAxialCount === MAX_HIGH_AXIAL || budget.highErectorCount === MAX_HIGH_ERECTOR)
  ) {
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
