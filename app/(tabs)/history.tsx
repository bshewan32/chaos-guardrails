import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { COLOURS, FONT, RADIUS, SPACING, gradeAccent } from '../../src/theme';
import { ACHIEVEMENT_DEFINITIONS, AchievementKey } from '../../src/engine/stats';
import { ALL_MUSCLES } from '../../src/data/exercises';

const ACHIEVEMENT_ICONS: Record<AchievementKey, string> = {
  firstWorkout: '🎯',
  week1Complete: '✅',
  perfectWeek: '⭐',
  streak3: '🔥',
  streak5: '🔥',
  volume100: '💯',
  volume500: '💪',
  allMusclesHit: '👑',
  dedication: '🏆',
};

export default function HistoryScreen() {
  const {
    workoutHistory,
    weekTarget,
    personalBests,
    unlockedAchievements,
    getWeeklyVolumes,
    getStats,
  } = useWorkoutStore();

  const weeklyVolumes = getWeeklyVolumes();
  const stats = getStats();

  const sorted = [...workoutHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const avgWorkoutsPerWeek =
    weeklyVolumes.length > 0
      ? (workoutHistory.length / weeklyVolumes.length).toFixed(1)
      : '0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>History</Text>

        {/* ── Stats grid ────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Workouts', value: stats.totalWorkouts, colour: COLOURS.pull },
            { label: 'Total Sets', value: stats.totalSets, colour: COLOURS.gradeA },
            { label: 'Week Streak', value: stats.currentStreak, colour: COLOURS.squat },
            { label: 'Workouts/Week', value: avgWorkoutsPerWeek, colour: COLOURS.posterior },
          ].map(({ label, value, colour }) => (
            <View key={label} style={styles.statTile}>
              <Text style={[styles.statValue, { color: colour }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── 6-week mesocycle grid ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>6-WEEK MESOCYCLE</Text>
          {weeklyVolumes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No weeks tracked yet</Text>
            </View>
          ) : (
            weeklyVolumes.map((week) => {
              const weekDate = new Date(week.weekStart);
              const label = weekDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              const accent = gradeAccent(week.grade.grade);

              return (
                <View key={week.weekStart} style={[styles.weekRow, { borderLeftColor: accent }]}>
                  <View style={styles.weekLeft}>
                    <Text style={[styles.weekGrade, { color: accent }]}>
                      {week.grade.grade}
                    </Text>
                    <Text style={styles.weekDate}>{label}</Text>
                  </View>
                  <View style={styles.weekBars}>
                    {['chest', 'lats', 'upperBack', 'quads', 'glutes', 'hamstrings'].map((m) => {
                      const vol = (week.volumes as Record<string, number>)[m] || 0;
                      const pct = Math.min((vol / weekTarget) * 100, 100);
                      return (
                        <View key={m} style={styles.microBar}>
                          <View
                            style={[
                              styles.microFill,
                              {
                                height: `${pct}%` as any,
                                backgroundColor: pct >= 100 ? COLOURS.ringDone : COLOURS.gradeC,
                              },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.weekRight}>
                    <Text style={styles.weekPct}>{Math.round(week.avgPercentage)}%</Text>
                    <Text style={styles.weekWorkouts}>{week.workouts.length} sessions</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Personal bests ────────────────────────────────────────────── */}
        {Object.keys(personalBests).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PERSONAL BESTS</Text>
            <View style={styles.bestsGrid}>
              {Object.entries(personalBests)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([muscle, vol]) => (
                  <View key={muscle} style={styles.bestTile}>
                    <Text style={styles.bestMuscle}>{muscle}</Text>
                    <Text style={styles.bestVol}>{vol.toFixed(1)}</Text>
                    <Text style={styles.bestUnit}>sets/wk</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* ── Achievements ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            ACHIEVEMENTS — {Object.keys(unlockedAchievements).length}/
            {Object.keys(ACHIEVEMENT_DEFINITIONS).length}
          </Text>
          <View style={styles.achievementGrid}>
            {(Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementKey[]).map((key) => {
              const def = ACHIEVEMENT_DEFINITIONS[key];
              const unlocked = !!unlockedAchievements[key];
              return (
                <View
                  key={key}
                  style={[styles.achievementTile, !unlocked && styles.achievementLocked]}
                >
                  <Text style={styles.achievementIcon}>{ACHIEVEMENT_ICONS[key]}</Text>
                  <Text style={[styles.achievementLabel, !unlocked && styles.lockedText]}>
                    {def.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Recent activity ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECENT ACTIVITY</Text>
          {sorted.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No workouts logged yet</Text>
            </View>
          ) : (
            sorted.slice(0, 10).map((w) => {
              const d = new Date(w.date);
              return (
                <View key={w.id} style={styles.activityRow}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityExercise}>{w.exercise}</Text>
                    <Text style={styles.activityVariant}>{w.variant}</Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activitySets}>{w.sets} sets</Text>
                    <Text style={styles.activityDate}>
                      {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.base },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.lg },
  pageTitle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '900',
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  statValue: {
    fontSize: FONT.xxl,
    fontWeight: '900',
  },
  statLabel: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '600',
  },
  section: { marginBottom: SPACING.lg },
  sectionHeader: {
    color: COLOURS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptyCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.md,
  },
  weekRow: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.md,
  },
  weekLeft: { alignItems: 'center', width: 36 },
  weekGrade: { fontSize: FONT.xl, fontWeight: '900' },
  weekDate: { color: COLOURS.textSecondary, fontSize: FONT.xs, fontWeight: '600', marginTop: 2 },
  weekBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 32,
    alignItems: 'flex-end',
  },
  microBar: {
    flex: 1,
    height: '100%',
    backgroundColor: COLOURS.border,
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  microFill: {
    width: '100%',
    borderRadius: 2,
  },
  weekRight: { alignItems: 'flex-end', width: 60 },
  weekPct: { color: COLOURS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  weekWorkouts: { color: COLOURS.textSecondary, fontSize: FONT.xs },
  bestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  bestTile: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  bestMuscle: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bestVol: { color: COLOURS.posterior, fontSize: FONT.xl, fontWeight: '900' },
  bestUnit: { color: COLOURS.textMuted, fontSize: FONT.xs },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  achievementTile: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLOURS.border,
  },
  achievementLocked: { opacity: 0.35 },
  achievementIcon: { fontSize: 28 },
  achievementLabel: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedText: { color: COLOURS.textSecondary },
  activityRow: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  activityLeft: { gap: 2 },
  activityExercise: { color: COLOURS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  activityVariant: { color: COLOURS.textSecondary, fontSize: FONT.sm },
  activityRight: { alignItems: 'flex-end', gap: 2 },
  activitySets: { color: COLOURS.pull, fontSize: FONT.md, fontWeight: '700' },
  activityDate: { color: COLOURS.textSecondary, fontSize: FONT.xs },
});
