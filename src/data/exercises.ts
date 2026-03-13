// ─────────────────────────────────────────────────────────────────────────────
// Exercise Library — ported from med-workout-tracker/src/main.jsx
// Fractional muscle contributions, axial/erector costs, movement categories,
// variant lists, and isBonus flags are all preserved exactly.
// ─────────────────────────────────────────────────────────────────────────────

export type AxialCost = 'high' | 'moderate' | 'low';
export type ErectorCost = 'high' | 'moderate' | 'low';
export type MovementCategory = 'pull' | 'squat' | 'press' | 'posterior' | 'accessory';

export interface ExerciseData {
  muscles: Partial<Record<MuscleGroup, number>>;
  category: 'compound' | 'accessory';
  movementCategory: MovementCategory;
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

export const MAJOR_LIFTS: Record<string, MuscleGroup[]> = {
  'Squat (Barbell)': ['quads', 'glutes'],
  'Squat (Spine-Friendly)': ['quads', 'glutes'],
  'Bench Press': ['chest', 'triceps'],
  'Deadlift (Heavy)': ['glutes', 'hamstrings', 'upperBack'],
  'Deadlift (Moderate)': ['glutes', 'hamstrings', 'upperBack'],
  'Row (Bent-Over)': ['upperBack', 'lats'],
  'Row (Supported)': ['upperBack', 'lats'],
};

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
  pull: {
    label: 'Pull',
    subtitle: 'Vertical & Horizontal Pulling',
    description: 'Pull-ups, rows, and pulldown variations',
    primaryMuscles: ['lats', 'upperBack'],
    accessoryMuscles: ['biceps'],
    colour: '#4ECDC4',
  },
  squat: {
    label: 'Squat / Single-Leg',
    subtitle: 'Knee-Dominant Lower Body',
    description: 'Squats, leg press, lunges, split squats, step-ups',
    primaryMuscles: ['quads', 'glutes'],
    accessoryMuscles: [],
    colour: '#A29BFE',
  },
  press: {
    label: 'Press',
    subtitle: 'Horizontal & Vertical Pressing',
    description: 'Bench press, overhead press, push-ups, dips',
    primaryMuscles: ['chest'],
    accessoryMuscles: ['shoulders', 'triceps'],
    colour: '#FF6B6B',
  },
  posterior: {
    label: 'Hip-Dominant',
    subtitle: 'Posterior Chain Power',
    description: 'Deadlifts, RDLs, hip thrusts, hamstring curls',
    primaryMuscles: ['glutes', 'hamstrings'],
    accessoryMuscles: [],
    colour: '#FDCB6E',
  },
};

export const exerciseLibrary: Record<string, ExerciseData> = {
  // ── POSTERIOR / HIP-DOMINANT ─────────────────────────────────────────────
  'Deadlift (Heavy)': {
    muscles: { hamstrings: 1, glutes: 0.8, upperBack: 0.6, core: 0.4 },
    category: 'compound',
    movementCategory: 'posterior',
    axialCost: 'high',
    erectorCost: 'high',
    variants: ['Conventional Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift'],
  },
  'Deadlift (Moderate)': {
    muscles: { hamstrings: 0.8, glutes: 0.6, upperBack: 0.4, core: 0.3 },
    category: 'compound',
    movementCategory: 'posterior',
    axialCost: 'moderate',
    erectorCost: 'moderate',
    variants: ['Romanian Deadlift', 'Stiff-Leg Deadlift', 'Single-Leg RDL'],
  },
  'Hip Thrusts/Bridges': {
    muscles: { glutes: 1, hamstrings: 0.4, core: 0.2 },
    category: 'compound',
    movementCategory: 'posterior',
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Barbell Hip Thrust',
      'Dumbbell Hip Thrust',
      'Glute Bridge',
      'Single-Leg Hip Thrust',
      'Banded Hip Thrust',
      'Machine Hip Thrust',
      'Cable Pull-Through',
      'Kettlebell Swing',
      'Frog Pump',
      'Elevated Hip Thrust',
    ],
  },
  'Good Mornings': {
    muscles: { hamstrings: 0.8, glutes: 0.4, upperBack: 0.3 },
    category: 'compound',
    movementCategory: 'posterior',
    axialCost: 'moderate',
    erectorCost: 'high',
    variants: ['Barbell Good Morning', 'Safety Bar Good Morning', 'Seated Good Morning'],
  },

  // ── SQUAT / KNEE-DOMINANT ────────────────────────────────────────────────
  'Squat (Barbell)': {
    muscles: { quads: 1, glutes: 0.6, core: 0.3 },
    category: 'compound',
    movementCategory: 'squat',
    axialCost: 'high',
    erectorCost: 'moderate',
    variants: ['Back Squat', 'Front Squat', 'Pause Squat', 'Box Squat'],
  },
  'Squat (Spine-Friendly)': {
    muscles: { quads: 0.9, glutes: 0.5, core: 0.2 },
    category: 'compound',
    movementCategory: 'squat',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Goblet Squat', 'Hack Squat', 'Leg Press', 'Belt Squat'],
  },
  'Lunge / Split Squat': {
    muscles: { quads: 0.9, glutes: 0.6, core: 0.2 },
    category: 'compound',
    movementCategory: 'squat',
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
  'Leg Extension': {
    muscles: { quads: 1 },
    category: 'accessory',
    movementCategory: 'squat',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Machine Leg Extension', 'Single-Leg Extension', 'Cable Leg Extension'],
  },

  // ── PULL ─────────────────────────────────────────────────────────────────
  'Pull-Up / Chin-Up': {
    muscles: { lats: 1, biceps: 0.5, upperBack: 0.3 },
    category: 'compound',
    movementCategory: 'pull',
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
  'Row (Bent-Over)': {
    muscles: { upperBack: 1, lats: 0.6, biceps: 0.3 },
    category: 'compound',
    movementCategory: 'pull',
    axialCost: 'moderate',
    erectorCost: 'moderate',
    variants: [
      'Barbell Row (Overhand)',
      'Barbell Row (Underhand)',
      'Pendlay Row',
      'Dumbbell Row',
    ],
  },
  'Row (Supported)': {
    muscles: { upperBack: 1, lats: 0.5, biceps: 0.3 },
    category: 'compound',
    movementCategory: 'pull',
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Chest-Supported Row',
      'Seated Cable Row',
      'Machine Row',
      'Single-Arm Cable Row',
    ],
  },
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
  'Lat Pulldown': {
    muscles: { lats: 1, biceps: 0.4 },
    category: 'accessory',
    movementCategory: 'pull',
    axialCost: 'low',
    erectorCost: 'low',
    variants: [
      'Wide Grip Lat Pulldown',
      'Close Grip Lat Pulldown',
      'Neutral Grip Pulldown',
      'Single-Arm Pulldown',
    ],
  },

  // ── PRESS ────────────────────────────────────────────────────────────────
  'Bench Press': {
    muscles: { chest: 1, triceps: 0.5, shoulders: 0.3 },
    category: 'compound',
    movementCategory: 'press',
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
  'Overhead Press': {
    muscles: { shoulders: 1, triceps: 0.4, chest: 0.2 },
    category: 'compound',
    movementCategory: 'press',
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
  'Push-Up Variations': {
    muscles: { chest: 0.8, triceps: 0.4, shoulders: 0.3 },
    category: 'compound',
    movementCategory: 'press',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Standard Push-Up', 'Wide Push-Up', 'Diamond Push-Up', 'Decline Push-Up'],
  },
  'Dips': {
    muscles: { chest: 0.7, triceps: 1, shoulders: 0.3 },
    category: 'compound',
    movementCategory: 'press',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Parallel Bar Dips', 'Weighted Dips', 'Assisted Dips', 'Bench Dips'],
  },
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

  // ── ACCESSORY / ISOLATION ────────────────────────────────────────────────
  'Hamstring Curl': {
    muscles: { hamstrings: 1 },
    category: 'accessory',
    movementCategory: 'posterior',
    axialCost: 'low',
    erectorCost: 'low',
    variants: ['Lying Leg Curl', 'Seated Leg Curl', 'Nordic Curl', 'Cable Leg Curl'],
  },
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
