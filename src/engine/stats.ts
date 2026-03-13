import { WorkoutEntry } from './volume';
import { WeekData } from './grades';
import { MuscleGroup, ALL_MUSCLES } from '../data/exercises';

export interface AppStats {
  totalWorkouts: number;
  totalSets: number;
  currentStreak: number;
  bestStreak: number;
  perfectWeeks: number;
  weeksCompleted: number;
  allMusclesHitWeeks: number;
}

export interface PersonalBests {
  [muscle: string]: number;
}

export type AchievementKey =
  | 'firstWorkout'
  | 'week1Complete'
  | 'perfectWeek'
  | 'streak3'
  | 'streak5'
  | 'volume100'
  | 'volume500'
  | 'allMusclesHit'
  | 'dedication';

export interface AchievementDefinition {
  label: string;
  description: string;
  check: (stats: AppStats) => boolean;
}

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementKey, AchievementDefinition> = {
  firstWorkout: {
    label: 'First Steps',
    description: 'Log your first workout',
    check: (s) => s.totalWorkouts >= 1,
  },
  week1Complete: {
    label: 'Week Warrior',
    description: 'Complete a full training week',
    check: (s) => s.weeksCompleted >= 1,
  },
  perfectWeek: {
    label: 'Perfect Week',
    description: 'Hit all 6 primary muscles in one week',
    check: (s) => s.perfectWeeks >= 1,
  },
  streak3: {
    label: 'On Fire',
    description: 'Maintain a 3-week streak',
    check: (s) => s.currentStreak >= 3,
  },
  streak5: {
    label: 'Unstoppable',
    description: 'Maintain a 5-week streak',
    check: (s) => s.currentStreak >= 5,
  },
  volume100: {
    label: 'Century Club',
    description: 'Log 100 total sets',
    check: (s) => s.totalSets >= 100,
  },
  volume500: {
    label: 'Volume Beast',
    description: 'Log 500 total sets',
    check: (s) => s.totalSets >= 500,
  },
  allMusclesHit: {
    label: 'Completionist',
    description: 'Hit all 11 muscle groups in one week',
    check: (s) => s.allMusclesHitWeeks >= 1,
  },
  dedication: {
    label: 'Dedication',
    description: 'Log 50 workouts',
    check: (s) => s.totalWorkouts >= 50,
  },
};

export function calculateStats(
  history: WorkoutEntry[],
  weeklyVolumes: WeekData[],
  currentWeekStartISO: string,
  weekTarget: number,
): AppStats {
  const totalWorkouts = history.length;
  const totalSets = history.reduce((sum, w) => sum + w.sets, 0);

  const sortedWeeks = [...weeklyVolumes].sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let perfectWeeks = 0;
  let weeksCompleted = 0;
  let allMusclesHitWeeks = 0;

  sortedWeeks.forEach((week) => {
    const avgPct = week.avgPercentage || 0;
    const musclesHit = week.grade?.musclesHit || 0;
    const isGoodWeek = avgPct >= 50 || musclesHit >= 3;

    if (isGoodWeek) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
      weeksCompleted++;
      if (week.weekStart === currentWeekStartISO) {
        currentStreak = tempStreak;
      }
    } else {
      if (week.weekStart !== currentWeekStartISO) tempStreak = 0;
    }

    if (week.grade?.grade === 'S') perfectWeeks++;

    // All 11 muscles hit check
    const allHit = ALL_MUSCLES.every(
      (m) => (week.volumes[m] || 0) >= weekTarget,
    );
    if (allHit) allMusclesHitWeeks++;
  });

  return {
    totalWorkouts,
    totalSets,
    currentStreak,
    bestStreak,
    perfectWeeks,
    weeksCompleted,
    allMusclesHitWeeks,
  };
}

export function updatePersonalBests(
  currentBests: PersonalBests,
  weeklyVolumes: WeekData[],
): PersonalBests {
  const newBests = { ...currentBests };
  weeklyVolumes.forEach((week) => {
    ALL_MUSCLES.forEach((muscle) => {
      const vol = week.volumes[muscle] || 0;
      if (vol > (newBests[muscle] || 0)) {
        newBests[muscle] = vol;
      }
    });
  });
  return newBests;
}

export function checkNewAchievements(
  stats: AppStats,
  unlockedAchievements: Partial<Record<AchievementKey, boolean>>,
): AchievementKey[] {
  const newlyUnlocked: AchievementKey[] = [];
  (Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementKey[]).forEach((key) => {
    if (!unlockedAchievements[key] && ACHIEVEMENT_DEFINITIONS[key].check(stats)) {
      newlyUnlocked.push(key);
    }
  });
  return newlyUnlocked;
}
