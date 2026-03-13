import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { ProgressRing } from '../../src/components/ProgressRing';
import { GradeBadge } from '../../src/components/GradeBadge';
import { CategoryCard } from '../../src/components/CategoryCard';
import { NudgeCard } from '../../src/components/NudgeCard';
import { COLOURS, FONT, RADIUS, SPACING, gradeAccent } from '../../src/theme';
import { PRIMARY_MUSCLES, MOVEMENT_CATEGORY_META, MovementCategory } from '../../src/data/exercises';

const CATEGORY_ORDER: Exclude<MovementCategory, 'accessory'>[] = [
  'pull', 'squat', 'press', 'posterior',
];

export default function TodayScreen() {
  const router = useRouter();
  const {
    weekTarget,
    activeSession,
    sessionProgress,
    sessionStarted,
    nudgeSuggestions,
    getPriorities,
    getSmartRecs,
    getWeekGrade,
    getStats,
    logWorkout,
    logQuickFinisher,
    dismissNudge,
    buildNewSession,
    startSession,
  } = useWorkoutStore();

  const priorities = getPriorities();
  const smartRecs = getSmartRecs();
  const grade = getWeekGrade();
  const stats = getStats();

  const primaryPriorities = priorities.filter((p) => p.isPrimary);

  // Group recs by movement category, sorted by score
  const recsByCategory = useMemo(() => {
    const map: Record<string, typeof smartRecs> = {};
    CATEGORY_ORDER.forEach((cat) => (map[cat] = []));
    smartRecs.forEach((rec) => {
      if (rec.movementCategory !== 'accessory' && map[rec.movementCategory]) {
        map[rec.movementCategory].push(rec);
      }
    });
    return map;
  }, [smartRecs]);

  // Sort categories by their top score descending
  const sortedCategories = useMemo(() => {
    return [...CATEGORY_ORDER].sort((a, b) => {
      const aScore = recsByCategory[a]?.[0]?.score ?? 0;
      const bScore = recsByCategory[b]?.[0]?.score ?? 0;
      return bScore - aScore;
    });
  }, [recsByCategory]);

  // Summary line
  const summaryParts = primaryPriorities
    .filter((p) => p.remaining > 0)
    .slice(0, 3)
    .map((p) => {
      if (p.remaining <= 2) return `${p.muscle}: ${p.remaining.toFixed(1)} sets away`;
      return null;
    })
    .filter(Boolean);

  const doneCount = primaryPriorities.filter((p) => p.percentage >= 100).length;
  const summaryLine =
    doneCount === 6
      ? 'All primary muscles hit this week!'
      : summaryParts.length > 0
      ? summaryParts.join(' · ')
      : `${doneCount}/6 primary muscles done`;

  const accentColour = gradeAccent(grade.grade);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { borderColor: accentColour + '44' }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.appTitle}>Chaos with Guardrails</Text>
              <Text style={styles.weekLabel}>This Week</Text>
              {stats.currentStreak > 0 && (
                <View style={styles.streakPill}>
                  <Text style={styles.streakText}>🔥 {stats.currentStreak} week streak</Text>
                </View>
              )}
            </View>
            <GradeBadge grade={grade} size="md" />
          </View>

          {/* Ring cluster 2×3 */}
          <View style={styles.ringGrid}>
            {primaryPriorities.map((p) => (
              <ProgressRing
                key={p.muscle}
                percentage={p.percentage}
                size={72}
                strokeWidth={6}
                muscle={p.muscle}
              />
            ))}
          </View>

          {/* Summary line */}
          <Text style={styles.summaryLine}>{summaryLine}</Text>
        </View>

        {/* ── Nudge card ────────────────────────────────────────────────── */}
        {nudgeSuggestions.length > 0 && (
          <NudgeCard
            suggestions={nudgeSuggestions}
            onLog={logQuickFinisher}
            onDismiss={dismissNudge}
          />
        )}

        {/* ── Active session banner ─────────────────────────────────────── */}
        {activeSession && sessionStarted && (
          <View style={[styles.sessionBanner, { borderColor: accentColour }]}>
            <View style={styles.sessionBannerLeft}>
              <Text style={styles.sessionBannerTitle}>{activeSession.label}</Text>
              <Text style={styles.sessionBannerSub}>
                {Object.values(sessionProgress).filter(Boolean).length} /{' '}
                {activeSession.exercises.length} done
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: accentColour }]}
              onPress={() => router.push('/active-session')}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Category cards ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MOVEMENT PATTERNS</Text>
          {sortedCategories.map((cat) => (
            <CategoryCard
              key={cat}
              catKey={cat}
              exercises={recsByCategory[cat] ?? []}
              priorities={priorities}
              weekTarget={weekTarget}
              onLog={logWorkout}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLOURS.base,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  hero: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  heroLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  appTitle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  weekLabel: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  streakPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLOURS.surfaceHigh,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginTop: SPACING.xs,
  },
  streakText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.xs,
    fontWeight: '600',
  },
  ringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  summaryLine: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  sessionBanner: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sessionBannerLeft: {
    gap: 2,
  },
  sessionBannerTitle: {
    color: COLOURS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
  sessionBannerSub: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
  },
  continueBtn: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  continueBtnText: {
    color: '#000',
    fontSize: FONT.sm,
    fontWeight: '800',
  },
  section: {
    gap: SPACING.xs,
  },
  sectionHeader: {
    color: COLOURS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
});
