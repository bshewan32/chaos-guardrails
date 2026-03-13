import { PRIMARY_MUSCLES, MESOCYCLE_WEEKS, MuscleGroup } from '../data/exercises';
import { WorkoutEntry, calculateVolumeForWorkouts, getWeekStart, getWorkoutsForWeek } from './volume';

export type GradeLetter = 'D' | 'C' | 'B' | 'A' | 'S';

export interface WeekGrade {
  grade: GradeLetter;
  label: string;
  accentColour: string;
  musclesHit: number;
  avgPercentage: number;
}

export interface WeekData {
  weekStart: string; // ISO string of Monday
  volumes: Record<MuscleGroup, number>;
  workouts: WorkoutEntry[];
  grade: WeekGrade;
  avgPercentage: number;
}

const GRADE_ACCENT: Record<GradeLetter, string> = {
  D: '#C0392B',
  C: '#E67E22',
  B: '#F1C40F',
  A: '#27AE60',
  S: '#00BFA5',
};

const GRADE_LABEL: Record<GradeLetter, string> = {
  D: 'Keep Going',
  C: 'Good',
  B: 'Great',
  A: 'Excellent',
  S: 'Perfect!',
};

export function calcGrade(avgPercentage: number, musclesHit: number): WeekGrade {
  let grade: GradeLetter;
  if (avgPercentage >= 100 || musclesHit === PRIMARY_MUSCLES.length) {
    grade = 'S';
  } else if (avgPercentage >= 80 || musclesHit >= 5) {
    grade = 'A';
  } else if (avgPercentage >= 65 || musclesHit >= 4) {
    grade = 'B';
  } else if (avgPercentage >= 50 || musclesHit >= 3) {
    grade = 'C';
  } else {
    grade = 'D';
  }
  return {
    grade,
    label: GRADE_LABEL[grade],
    accentColour: GRADE_ACCENT[grade],
    musclesHit,
    avgPercentage,
  };
}

/** Processes up to MESOCYCLE_WEEKS of weekly data from workout history. */
export function processWeeklyVolumes(
  history: WorkoutEntry[],
  weekTarget: number,
): WeekData[] {
  const weekMap = new Map<string, WeekData>();

  history.forEach((workout) => {
    const workoutDate = new Date(workout.date);
    const weekStart = getWeekStart(workoutDate);
    const weekKey = weekStart.toISOString();

    if (!weekMap.has(weekKey)) {
      const volumes: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
      // We'll accumulate below
      weekMap.set(weekKey, {
        weekStart: weekKey,
        volumes,
        workouts: [],
        grade: calcGrade(0, 0),
        avgPercentage: 0,
      });
    }

    const weekData = weekMap.get(weekKey)!;
    weekData.workouts.push(workout);
  });

  // Recalculate volumes and grades for each week
  weekMap.forEach((data) => {
    data.volumes = calculateVolumeForWorkouts(data.workouts);

    let totalPercentage = 0;
    let musclesHit = 0;

    PRIMARY_MUSCLES.forEach((muscle) => {
      const vol = data.volumes[muscle] || 0;
      const pct = Math.min((vol / weekTarget) * 100, 100);
      totalPercentage += pct;
      if (vol >= weekTarget) musclesHit++;
    });

    const avgPercentage = totalPercentage / PRIMARY_MUSCLES.length;
    data.avgPercentage = avgPercentage;
    data.grade = calcGrade(avgPercentage, musclesHit);
  });

  return Array.from(weekMap.values())
    .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
    .slice(0, MESOCYCLE_WEEKS);
}

/** Returns the mesocycle average volume per muscle across all tracked weeks. */
export function getMesocycleAverage(
  weeklyVolumes: WeekData[],
): Record<MuscleGroup, number> {
  if (weeklyVolumes.length === 0) {
    const empty: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
    return empty;
  }

  const totals: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;

  weeklyVolumes.forEach((week) => {
    Object.entries(week.volumes).forEach(([muscle, vol]) => {
      totals[muscle as MuscleGroup] = (totals[muscle as MuscleGroup] || 0) + vol;
    });
  });

  const averages: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  Object.entries(totals).forEach(([muscle, total]) => {
    averages[muscle as MuscleGroup] = total / weeklyVolumes.length;
  });

  return averages;
}

/** Returns the grade for the current week. */
export function getCurrentWeekGrade(
  history: WorkoutEntry[],
  weekStart: Date,
  weekTarget: number,
): WeekGrade {
  const workouts = getWorkoutsForWeek(history, weekStart);
  const volumes = calculateVolumeForWorkouts(workouts);

  let totalPercentage = 0;
  let musclesHit = 0;

  PRIMARY_MUSCLES.forEach((muscle) => {
    const vol = volumes[muscle] || 0;
    const pct = Math.min((vol / weekTarget) * 100, 100);
    totalPercentage += pct;
    if (vol >= weekTarget) musclesHit++;
  });

  const avgPercentage = totalPercentage / PRIMARY_MUSCLES.length;
  return calcGrade(avgPercentage, musclesHit);
}
