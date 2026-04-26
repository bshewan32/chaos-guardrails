import { GradeLetter } from '../engine/grades';
import { MovementCategory } from '../data/exercises';

// ── Base palette — light mode ─────────────────────────────────────────────────
export const COLOURS = {
  // Backgrounds
  base: '#F2F2F7',          // iOS system grouped background (light grey)
  surface: '#FFFFFF',       // Card / sheet surface
  surfaceHigh: '#F0F0F5',   // Elevated surface (chips, badges)
  border: '#D1D1D6',        // Subtle separator

  // Text
  textPrimary: '#1C1C1E',   // Near-black
  textSecondary: '#48484A', // Dark grey
  textMuted: '#8E8E93',     // Muted grey

  // Semantic
  danger: '#C0392B',

  // Grade-driven accents (kept vibrant for contrast on light bg)
  gradeD: '#C0392B',
  gradeC: '#E67E22',
  gradeB: '#D4A017',        // Slightly deeper gold for light bg readability
  gradeA: '#27AE60',
  gradeS: '#00897B',        // Slightly deeper teal for light bg readability

  // Movement categories (slightly deeper for light bg contrast)
  pull: '#00897B',          // Teal
  squat: '#7C6FCD',         // Purple
  press: '#E05555',         // Red
  posterior: '#D4A017',     // Gold
  accessory: '#8E8E93',     // Grey

  // Progress ring states
  ringEmpty: '#D1D1D6',
  ringLow: '#C0392B',
  ringMid: '#E67E22',
  ringHigh: '#D4A017',
  ringDone: '#27AE60',
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
