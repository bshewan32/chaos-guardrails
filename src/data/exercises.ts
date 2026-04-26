// ─────────────────────────────────────────────────────────────────────────────
// Exercise Library — Chaos with Guardrails
//
// 4 movement-pattern buckets, each with sub-tiers that carry a priorityMultiplier.
// The multiplier is: bucketWeight × subTierFactor, normalised so the top tier
// of the highest-priority bucket = 1.0.
//
// Bucket weights (approximate 3 : 2 : 2 : 1 ratio):
//   hip-dominant  → 3.0
//   squat         → 2.0
//   pull          → 2.0
//   press         → 1.0
//
// Sub-tier factors within each bucket (top tier = 1.0, decreasing):
//   hip-dominant:  heavy hinge 1.0 | moderate hinge 0.85 | single-leg 0.70 | GHD/ext 0.65
//   squat:         axial squat 1.0 | spine-friendly 0.90 | lunge/split 0.85
//   pull:          bent-over row 1.0 | supported row 0.90 | vertical pull 0.85
//   press:         horizontal 1.0 | vertical 0.90
//
// Accessories are not scored via priorityMultiplier — they enter sessions
// through the 35% finisher draw or the overreach session builder.
// ─────────────────────────────────────────────────────────────────────────────

export type AxialCost = 'high' | 'moderate' | 'low';
export type ErectorCost = 'high' | 'moderate' | 'low';

/** Top-level movement bucket — drives the 3:2:2:1 weighting. */
export type MovementBucket = 'hipDominant' | 'squat' | 'pull' | 'press';

/** Sub-tier within a bucket — drives the within-bucket ordering. */
export type HipDominantTier = 'heavyHinge' | 'moderateHinge' | 'singleLeg' | 'ghdExtension';
export type SquatTier = 'axialSquat' | 'spineFriendlySquat' | 'lungeSplit';
export type PullTier = 'bentOverRow' | 'supportedRow' | 'verticalPull';
export type PressTier = 'horizontalPress' | 'verticalPress';
export type SubTier = HipDominantTier | SquatTier | PullTier | PressTier;

/**
 * movementCategory is kept for UI colour-coding and legacy compatibility.
 * It maps to the bucket names used in the original PWA.
 */
export type MovementCategory = 'posterior' | 'squat' | 'pull' | 'press' | 'accessory';

export interface ExerciseData {
  muscles: Partial<Record<MuscleGroup, number>>;
  /** 'compound' = scored by the priority engine; 'accessory' = finisher/overreach only */
  category: 'compound' | 'accessory';
  movementCategory: MovementCategory;
  /** The 4-bucket classification (undefined for accessories) */
  bucket?: MovementBucket;
  /** Sub-tier within the bucket (undefined for accessories) */
  subTier?: SubTier;
  /**
   * Priority multiplier = bucketWeight × subTierFactor, normalised to 1.0 max.
   * Used by the recommendations engine to scale the base need score.
   * Undefined for accessories (they are not priority-scored).
   */
  priorityMultiplier?: number;
  variants: string[];
  axialCost?: AxialCost;
  erectorCost?: ErectorCost;
  isBonus?: boolean;
}

export type MuscleGroup =
  | 'chest'
  | 'lats'
  | 'upperBack'
  | 'quads'
  | 'glutes'
  | 'hamstrings'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'calves'
  | 'core';

export const PRIMARY_MUSCLES: MuscleGroup[] = [
  'chest', 'lats', 'upperBack', 'quads', 'glutes', 'hamstrings',
];

export const ACCESSORY_MUSCLES: MuscleGroup[] = [
  'shoulders', 'biceps', 'triceps', 'calves', 'core',
];

export const ALL_MUSCLES: MuscleGroup[] = [...PRIMARY_MUSCLES, ...ACCESSORY_MUSCLES];

export const MESOCYCLE_WEEKS = 6;

// ── Bucket weights (raw, before normalisation) ────────────────────────────
// hipDominant = 3.0, squat = 2.0, pull = 2.0, press = 1.0
// Top sub-tier of hipDominant = 3.0 × 1.0 = 3.0 → normalised to 1.0
// All other multipliers are divided by 3.0.

const B = {
  hipDominant: 3.0,
  squat: 2.0,
  pull: 2.0,
  press: 1.0,
};

const T = {
  // hip-dominant sub-tiers
  heavyHinge:      1.00,
  moderateHinge:   0.85,
  singleLeg:       0.70,
  ghdExtension:    0.65,
  // squat sub-tiers
  axialSquat:      1.00,
  spineFriendly:   0.90,
  lungeSplit:      0.85,
  // pull sub-tiers
  bentOverRow:     1.00,
  supportedRow:    0.90,
  verticalPull:    0.85,
  // press sub-tiers
  horizontal:      1.00,
  vertical:        0.90,
};

/** Normalised priority multiplier: (bucketWeight × subTierFactor) / 3.0 */
function pm(bucket: keyof typeof B, tier: keyof typeof T): number {
  return parseFloat(((B[bucket] * T[tier]) / 3.0).toFixed(3));
}

// ── Major lifts for category injection guard ──────────────────────────────
export const MAJOR_LIFTS: Record<string, MuscleGroup[]> = {
  'Deadlift (Heavy)':     ['glutes', 'hamstrings', 'upperBack'],
  'Deadlift (Moderate)':  ['glutes', 'hamstrings', 'upperBack'],
  'Squat (Barbell)':      ['quads', 'glutes'],
  'Squat (Spine-Friendly)': ['quads', 'glutes'],
  'Leg Press':            ['quads', 'glutes'],
  'Row (Bent-Over)':      ['upperBack', 'lats'],
  'Row (Supported)':      ['upperBack', 'lats'],
  'Bench Press':          ['chest', 'triceps'],
  'Chest Press (Machine)': ['chest', 'triceps'],
};

// ── Movement category metadata (UI use) ──────────────────────────────────
export const MOVEMENT_CATEGORY_META: Record<
  Exclude<MovementCategory, 'accessory'>,
  {
    label: string;
    subtitle: string;
    description: string;
    primaryMuscles: MuscleGroup[];
    accessoryMuscles: MuscleGroup[];
    colour: string;
  }
> = {
  posterior: {
    label: 'Hip-Dominant',
    subtitle: 'Posterior Chain Power',
    description: 'Heavy deadlifts, RDLs, single-leg hinges, GHD extensions',
    primaryMuscles: ['glutes', 'hamstrings'],
    accessoryMuscles: ['upperBack', 'core'],
    colour: '#FDCB6E',
  },
  squat: {
    label: 'Squat / Knee-Dom',
    subtitle: 'Knee-Dominant Lower Body',
    description: 'Squats, leg press, lunges, split squats, step-ups',
    primaryMuscles: ['quads', 'glutes'],
    accessoryMuscles: [],
    colour: '#A29BFE',
  },
  pull: {
    label: 'Pull',
    subtitle: 'Rows & Vertical Pulling',
    description: 'Bent-over rows, supported rows, pull-ups, lat pulldowns',
    primaryMuscles: ['lats', 'upperBack'],
    accessoryMuscles: ['biceps'],
    colour: '#4ECDC4',
  },
  press: {
    label: 'Press',
    subtitle: 'Horizontal & Vertical Pressing',
    description: 'Bench press, overhead press, push-ups, dips',
    primaryMuscles: ['chest'],
    accessoryMuscles: ['shoulders', 'triceps'],
    colour: '#FF6B6B',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Exercise Library
// ─────────────────────────────────────────────────────────────────────────────

export const exerciseLibrary: Record<string, ExerciseData> = {

  // ══════════════════════════════════════════════════════════════════════════
  // HIP-DOMINANT — Sub-tier 1: Heavy Hinge (high axial, high erector)
  // priorityMultiplier = 3.0 × 1.00 / 3.0 = 1.000
  // ══════════════════════════════════════════════════════════════════════════

  'Deadlift (Heavy)': {
    muscles: { glutes: 1, hamstrings: 1, upperBack: 0.6, core: 0.4 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'heavyHinge',
    priorityMultiplier: pm('hipDominant', 'heavyHinge'), // 1.000
    axialCost: 'high',
    erectorCost: 'high',
    variants: ['Conventional Deadlift', 'Sumo Deadlift', 'Deficit Deadlift'],
  },

  'Good Mornings': {
    muscles: { hamstrings: 1, glutes: 0.7, upperBack: 0.4, core: 0.5 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'heavyHinge',
    priorityMultiplier: pm('hipDominant', 'heavyHinge'), // 1.000
    axialCost: 'high',
    erectorCost: 'high',
    variants: ['Barbell Good Morning', 'Safety Bar Good Morning', 'Seated Good Morning'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HIP-DOMINANT — Sub-tier 2: Moderate Hinge (moderate axial)
  // priorityMultiplier = 3.0 × 0.85 / 3.0 = 0.850
  // ══════════════════════════════════════════════════════════════════════════

  'Deadlift (Moderate)': {
    muscles: { glutes: 0.9, hamstrings: 1, upperBack: 0.5, core: 0.3 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'moderateHinge',
    priorityMultiplier: pm('hipDominant', 'moderateHinge'), // 0.850
    axialCost: 'moderate',
    erectorCost: 'moderate',
    variants: ['Trap Bar Deadlift', 'Romanian Deadlift', 'Block Pull'],
  },

  'Hip Thrusts/Bridges': {
    muscles: { glutes: 1, hamstrings: 0.5, core: 0.2 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'moderateHinge',
    priorityMultiplier: pm('hipDominant', 'moderateHinge'), // 0.850
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Barbell Hip Thrust',
      'Dumbbell Hip Thrust',
      'Smith Machine Hip Thrust',
      'Single-Leg Hip Thrust',
      'Banded Hip Thrust',
      'Glute Bridge',
    ],
  },

  'Cable Pull-Through': {
    muscles: { glutes: 1, hamstrings: 0.6, core: 0.2 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'moderateHinge',
    priorityMultiplier: pm('hipDominant', 'moderateHinge'), // 0.850
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Cable Pull-Through', 'Band Pull-Through', 'Kettlebell Swing'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HIP-DOMINANT — Sub-tier 3: Single-Leg Hinge
  // priorityMultiplier = 3.0 × 0.70 / 3.0 = 0.700
  // ══════════════════════════════════════════════════════════════════════════

  'Single-Leg RDL': {
    muscles: { glutes: 1, hamstrings: 0.9, core: 0.4 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'singleLeg',
    priorityMultiplier: pm('hipDominant', 'singleLeg'), // 0.700
    axialCost: 'moderate',
    erectorCost: 'moderate',
    variants: [
      'Dumbbell Single-Leg RDL',
      'Kettlebell Single-Leg RDL',
      'Barbell Single-Leg RDL',
      'Kickstand RDL',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HIP-DOMINANT — Sub-tier 4: GHD / Back Extension
  // priorityMultiplier = 3.0 × 0.65 / 3.0 = 0.650
  // ══════════════════════════════════════════════════════════════════════════

  'Back Extensions': {
    muscles: { glutes: 0.8, hamstrings: 0.7, core: 0.3 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'ghdExtension',
    priorityMultiplier: pm('hipDominant', 'ghdExtension'), // 0.650
    axialCost: 'moderate',
    erectorCost: 'moderate',
    variants: [
      '45° Back Extension (Glute Focus)',
      'Horizontal Back Extension',
      'Reverse Hyper',
      'Natural Glute Ham Raise',
    ],
  },

  'GHD Hip Extension': {
    muscles: { glutes: 1, hamstrings: 0.8, core: 0.3 },
    category: 'compound',
    movementCategory: 'posterior',
    bucket: 'hipDominant',
    subTier: 'ghdExtension',
    priorityMultiplier: pm('hipDominant', 'ghdExtension'), // 0.650
    axialCost: 'moderate',
    erectorCost: 'high',
    variants: ['GHD Hip Extension', 'GHD Back Extension (Hip Focus)'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SQUAT / KNEE-DOMINANT — Sub-tier 1: Axial Squat (high axial)
  // priorityMultiplier = 2.0 × 1.00 / 3.0 = 0.667
  // ══════════════════════════════════════════════════════════════════════════

  'Squat (Barbell)': {
    muscles: { quads: 1, glutes: 0.6, core: 0.3 },
    category: 'compound',
    movementCategory: 'squat',
    bucket: 'squat',
    subTier: 'axialSquat',
    priorityMultiplier: pm('squat', 'axialSquat'), // 0.667
    axialCost: 'high',
    erectorCost: 'moderate',
    variants: ['Back Squat', 'Front Squat', 'Pause Squat', 'Box Squat'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SQUAT / KNEE-DOMINANT — Sub-tier 2: Spine-Friendly Squat
  // priorityMultiplier = 2.0 × 0.90 / 3.0 = 0.600
  // ══════════════════════════════════════════════════════════════════════════

  'Squat (Spine-Friendly)': {
    muscles: { quads: 0.9, glutes: 0.5, core: 0.2 },
    category: 'compound',
    movementCategory: 'squat',
    bucket: 'squat',
    subTier: 'spineFriendlySquat',
    priorityMultiplier: pm('squat', 'spineFriendly'), // 0.600
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Goblet Squat', 'Belt Squat', 'Zercher Squat'],
  },

  'Leg Press': {
    muscles: { quads: 1, glutes: 0.6, hamstrings: 0.3 },
    category: 'compound',
    movementCategory: 'squat',
    bucket: 'squat',
    subTier: 'spineFriendlySquat',
    priorityMultiplier: pm('squat', 'spineFriendly'), // 0.600
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Leg Press (Standard)', 'Leg Press (High Foot)', 'Leg Press (Narrow Stance)', 'Single-Leg Press'],
  },

  'Hack Squat (Machine)': {
    muscles: { quads: 1, glutes: 0.4, core: 0.2 },
    category: 'compound',
    movementCategory: 'squat',
    bucket: 'squat',
    subTier: 'spineFriendlySquat',
    priorityMultiplier: pm('squat', 'spineFriendly'), // 0.600
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Hack Squat (Machine)', 'Hack Squat (Narrow Stance)', 'Hack Squat (Pause)'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SQUAT / KNEE-DOMINANT — Sub-tier 3: Lunge / Split Squat
  // priorityMultiplier = 2.0 × 0.85 / 3.0 = 0.567
  // ══════════════════════════════════════════════════════════════════════════

  'Lunge / Split Squat': {
    muscles: { quads: 0.9, glutes: 0.6, core: 0.2 },
    category: 'compound',
    movementCategory: 'squat',
    bucket: 'squat',
    subTier: 'lungeSplit',
    priorityMultiplier: pm('squat', 'lungeSplit'), // 0.567
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Reverse Lunge',
      'Walking Lunge',
      'Bulgarian Split Squat',
      'Step-Up',
      'Lateral Lunge',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PULL — Sub-tier 1: Bent-Over Row (moderate axial)
  // priorityMultiplier = 2.0 × 1.00 / 3.0 = 0.667
  // ══════════════════════════════════════════════════════════════════════════

  'Row (Bent-Over)': {
    muscles: { upperBack: 1, lats: 0.6, biceps: 0.3 },
    category: 'compound',
    movementCategory: 'pull',
    bucket: 'pull',
    subTier: 'bentOverRow',
    priorityMultiplier: pm('pull', 'bentOverRow'), // 0.667
    axialCost: 'moderate',
    erectorCost: 'moderate',
    variants: [
      'Barbell Row (Overhand)',
      'Barbell Row (Underhand)',
      'Pendlay Row',
      'Dumbbell Row',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PULL — Sub-tier 2: Supported Row (low axial)
  // priorityMultiplier = 2.0 × 0.90 / 3.0 = 0.600
  // ══════════════════════════════════════════════════════════════════════════

  'Row (Supported)': {
    muscles: { upperBack: 1, lats: 0.5, biceps: 0.3 },
    category: 'compound',
    movementCategory: 'pull',
    bucket: 'pull',
    subTier: 'supportedRow',
    priorityMultiplier: pm('pull', 'supportedRow'), // 0.600
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Chest-Supported Row',
      'Seated Cable Row',
      'Machine Row',
      'Single-Arm Cable Row',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PULL — Sub-tier 3: Vertical Pull (low axial)
  // priorityMultiplier = 2.0 × 0.85 / 3.0 = 0.567
  // ══════════════════════════════════════════════════════════════════════════

  'Pull-Up / Chin-Up': {
    muscles: { lats: 1, biceps: 0.5, upperBack: 0.3 },
    category: 'compound',
    movementCategory: 'pull',
    bucket: 'pull',
    subTier: 'verticalPull',
    priorityMultiplier: pm('pull', 'verticalPull'), // 0.567
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Wide-Grip Pull-Up',
      'Chin-Up',
      'Neutral-Grip Pull-Up',
      'Assisted Pull-Up',
      'Weighted Pull-Up',
    ],
  },

  'Lat Pulldown': {
    muscles: { lats: 1, biceps: 0.4, upperBack: 0.2 },
    category: 'compound',
    movementCategory: 'pull',
    bucket: 'pull',
    subTier: 'verticalPull',
    priorityMultiplier: pm('pull', 'verticalPull'), // 0.567
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Wide Grip Lat Pulldown',
      'Close Grip Lat Pulldown',
      'Neutral Grip Pulldown',
      'Single-Arm Pulldown',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRESS — Sub-tier 1: Horizontal Press (low axial)
  // priorityMultiplier = 1.0 × 1.00 / 3.0 = 0.333
  // ══════════════════════════════════════════════════════════════════════════

  'Bench Press': {
    muscles: { chest: 1, triceps: 0.5, shoulders: 0.3 },
    category: 'compound',
    movementCategory: 'press',
    bucket: 'press',
    subTier: 'horizontalPress',
    priorityMultiplier: pm('press', 'horizontal'), // 0.333
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Flat Barbell Bench',
      'Incline Barbell Bench',
      'Decline Barbell Bench',
      'Dumbbell Bench Press',
      'Incline Dumbbell Press',
    ],
  },

  'Chest Press (Machine)': {
    muscles: { chest: 1, triceps: 0.4, shoulders: 0.2 },
    category: 'compound',
    movementCategory: 'press',
    bucket: 'press',
    subTier: 'horizontalPress',
    priorityMultiplier: pm('press', 'horizontal'), // 0.333
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Chest Press (Machine)', 'Incline Chest Press (Machine)', 'Decline Chest Press (Machine)', 'Cable Chest Press'],
  },

  'Push-Up Variations': {
    muscles: { chest: 0.8, triceps: 0.4, shoulders: 0.3 },
    category: 'compound',
    movementCategory: 'press',
    bucket: 'press',
    subTier: 'horizontalPress',
    priorityMultiplier: pm('press', 'horizontal'), // 0.333
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Standard Push-Up', 'Wide Push-Up', 'Diamond Push-Up', 'Decline Push-Up'],
  },

  'Dips': {
    muscles: { chest: 0.7, triceps: 1, shoulders: 0.3 },
    category: 'compound',
    movementCategory: 'press',
    bucket: 'press',
    subTier: 'horizontalPress',
    priorityMultiplier: pm('press', 'horizontal'), // 0.333
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Parallel Bar Dips', 'Weighted Dips', 'Assisted Dips', 'Bench Dips'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRESS — Sub-tier 2: Vertical Press (moderate axial)
  // priorityMultiplier = 1.0 × 0.90 / 3.0 = 0.300
  // ══════════════════════════════════════════════════════════════════════════

  'Overhead Press': {
    muscles: { shoulders: 1, triceps: 0.4, chest: 0.2 },
    category: 'compound',
    movementCategory: 'press',
    bucket: 'press',
    subTier: 'verticalPress',
    priorityMultiplier: pm('press', 'vertical'), // 0.300
    axialCost: 'moderate',
    erectorCost: 'moderate',
    variants: [
      'Barbell OHP',
      'Dumbbell OHP',
      'Seated Dumbbell Press',
      'Arnold Press',
      'Push Press',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ACCESSORIES — Isolation work. Not priority-scored.
  // Enter sessions via the 35% finisher draw (normal sessions) or the
  // overreach/complete session builder (when weekly volume is done).
  // ══════════════════════════════════════════════════════════════════════════

  // Hip-dominant accessories
  'Hamstring Curl': {
    muscles: { hamstrings: 1 },
    category: 'accessory',
    movementCategory: 'posterior',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Lying Leg Curl', 'Seated Leg Curl', 'Nordic Curl', 'Cable Leg Curl'],
  },

  // Squat accessories
  'Leg Extension': {
    muscles: { quads: 1 },
    category: 'accessory',
    movementCategory: 'squat',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Machine Leg Extension', 'Single-Leg Extension', 'Cable Leg Extension'],
  },

  // Pull accessories
  'Face Pulls': {
    muscles: { upperBack: 0.8, shoulders: 0.5 },
    category: 'accessory',
    movementCategory: 'pull',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Cable Face Pull', 'Band Face Pull'],
  },

  'Bicep Curls': {
    muscles: { biceps: 1 },
    category: 'accessory',
    movementCategory: 'pull',
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Barbell Curl',
      'Dumbbell Curl',
      'Hammer Curl',
      'Cable Curl',
      'Incline Curl',
    ],
  },

  'Shrugs': {
    muscles: { upperBack: 1 },
    category: 'accessory',
    movementCategory: 'pull',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Barbell Shrug', 'Dumbbell Shrug', 'Trap Bar Shrug', 'Cable Shrug'],
  },

  // Press accessories
  'Tricep Isolation': {
    muscles: { triceps: 1 },
    category: 'accessory',
    movementCategory: 'press',
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Tricep Pushdown',
      'Overhead Tricep Extension',
      'Skull Crushers',
      'Close-Grip Bench',
    ],
  },

  'Lateral Raises': {
    muscles: { shoulders: 1 },
    category: 'accessory',
    movementCategory: 'press',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Dumbbell Lateral Raise', 'Cable Lateral Raise', 'Machine Lateral Raise'],
  },

  'Chest Fly': {
    muscles: { chest: 1, shoulders: 0.2 },
    category: 'accessory',
    movementCategory: 'press',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Dumbbell Fly', 'Cable Fly', 'Pec Deck Machine', 'Incline Fly', 'Decline Fly'],
  },

  // Pure accessories (no bucket)
  'Calf Raises': {
    muscles: { calves: 1 },
    category: 'accessory',
    movementCategory: 'accessory',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Standing Calf Raises', 'Seated Calf Raises', 'Leg Press Calf Raises'],
  },

  'Crunches': {
    muscles: { core: 1 },
    category: 'accessory',
    movementCategory: 'accessory',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Floor Crunch', 'Cable Crunch', 'Reverse Crunch'],
  },

  'Planks': {
    muscles: { core: 1 },
    category: 'accessory',
    movementCategory: 'accessory',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Front Plank', 'Side Plank', 'Weighted Plank'],
  },

  'Loaded Carries': {
    muscles: { upperBack: 0.6, core: 1, glutes: 0.4 },
    category: 'accessory',
    movementCategory: 'accessory',
    axialCost: 'low',
    erectorCost: 'low',
    isBonus: true,
    variants: ['Farmers Walk', 'Suitcase Carry', 'Overhead Carry', 'Waiter Walk', 'Trap Bar Carry'],
  },
};
