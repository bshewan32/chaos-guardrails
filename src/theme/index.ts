import { GradeLetter } from '../engine/grades';
import { MovementCategory } from '../data/exercises';

// ── Base palette ──────────────────────────────────────────────────────────────
export const COLOURS = {
  base: '#0F0F14',
  surface: '#1A1A24',
  surfaceHigh: '#252535',
  border: '#2E2E42',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#4A4A5A',
  danger: '#C0392B',

  // Grade-driven accent
  gradeD: '#C0392B',
  gradeC: '#E67E22',
  gradeB: '#F1C40F',
  gradeA: '#27AE60',
  gradeS: '#00BFA5',

  // Movement categories
  pull: '#4ECDC4',
  squat: '#A29BFE',
  press: '#FF6B6B',
  posterior: '#FDCB6E',
  accessory: '#8E8E93',

  // Progress ring states
  ringEmpty: '#2E2E42',
  ringLow: '#C0392B',     // < 50%
  ringMid: '#E67E22',     // 50–75%
  ringHigh: '#F1C40F',    // 75–100%
  ringDone: '#27AE60',    // 100%
} as const;

export function gradeAccent(grade: GradeLetter): string {
  return COLOURS[`grade${grade}`];
}

export function categoryColour(cat: MovementCategory): string {
  if (cat === 'pull') return COLOURS.pull;
  if (cat === 'squat') return COLOURS.squat;
  if (cat === 'press') return COLOURS.press;
  if (cat === 'posterior') return COLOURS.posterior;
  return COLOURS.accessory;
}

export function ringColour(percentage: number): string {
  if (percentage >= 100) return COLOURS.ringDone;
  if (percentage >= 75) return COLOURS.ringHigh;
  if (percentage >= 50) return COLOURS.ringMid;
  return COLOURS.ringLow;
}

// ── Spacing ───────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ── Font sizes ────────────────────────────────────────────────────────────────
export const FONT = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 36,
} as const;
