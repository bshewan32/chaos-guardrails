import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '../src/store/workoutStore';
import { COLOURS, FONT, RADIUS, SPACING, categoryColour, gradeAccent } from '../src/theme';
import { SessionExercise } from '../src/engine/sessionBuilder';
import { exerciseLibrary } from '../src/data/exercises';

export default function SessionBuilderScreen() {
  const router = useRouter();
  const {
    activeSession,
    buildNewSession,
    startSession,
    clearSession,
    getWeekGrade,
  } = useWorkoutStore();

  const grade = getWeekGrade();
  const accentColour = gradeAccent(grade.grade);

  const [editingSets, setEditingSets] = useState<Record<string, number>>({});
  const [editingVariants, setEditingVariants] = useState<Record<string, string>>({});

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No session built yet</Text>
          <TouchableOpacity
            style={[styles.buildBtn, { backgroundColor: accentColour }]}
            onPress={buildNewSession}
          >
            <Text style={styles.buildBtnText}>Build Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getSets = (exercise: string, defaultSets: number) =>
    editingSets[exercise] ?? defaultSets;
  const getVariant = (exercise: string, defaultVariant: string) =>
    editingVariants[exercise] ?? defaultVariant;

  const handleStart = () => {
    startSession();
    router.push('/active-session');
  };

  const handleShuffle = () => {
    buildNewSession();
    setEditingSets({});
    setEditingVariants({});
  };

  const axialNote = activeSession.axialNote;
  const overreachNote = activeSession.overreachNote;
  const isOverreach = activeSession.mode === 'overreach' || activeSession.mode === 'complete';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.sessionLabel}>{activeSession.label}</Text>
            <Text style={styles.sessionCount}>
              {activeSession.exercises.length} exercises
            </Text>
          </View>
          <TouchableOpacity onPress={handleShuffle} style={styles.shuffleBtn}>
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        {/* Overreach / complete week banner */}
        {isOverreach && overreachNote && (
          <View style={[styles.axialNote, styles.overreachBanner]}>
            <Text style={styles.axialNoteIcon}>
              {activeSession.mode === 'complete' ? '🏆' : '⚡'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.overreachTitle}>
                {activeSession.mode === 'complete' ? 'Week Complete' : 'Almost There'}
              </Text>
              <Text style={styles.axialNoteText}>{overreachNote}</Text>
            </View>
          </View>
        )}

        {/* Axial note */}
        {axialNote && !isOverreach && (
          <View style={styles.axialNote}>
            <Text style={styles.axialNoteIcon}>🛡</Text>
            <Text style={styles.axialNoteText}>{axialNote}</Text>
          </View>
        )}

        {/* Exercise cards */}
        <View style={styles.exerciseList}>
          {activeSession.exercises.map((ex, idx) => {
            const colour = categoryColour(ex.movementCategory);
            const sets = getSets(ex.exercise, ex.sets);
            const variant = getVariant(ex.exercise, ex.variant);
            const allVariants = exerciseLibrary[ex.exercise]?.variants ?? [variant];
            const axialCost = exerciseLibrary[ex.exercise]?.axialCost ?? 'low';

            return (
              <View key={ex.exercise} style={[styles.exCard, { borderLeftColor: colour }]}>
                {/* Exercise header */}
                <View style={styles.exHeader}>
                  <View style={styles.exHeaderLeft}>
                    <View style={styles.exNumberBadge}>
                      <Text style={[styles.exNumber, { color: colour }]}>{idx + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.exName}>{ex.exercise}</Text>
                      <Text style={styles.exTargets}>{ex.targets.join(', ')}</Text>
                    </View>
                  </View>
                  <View style={styles.exHeaderRight}>
                    {axialCost !== 'low' && (
                      <View style={[
                        styles.axialPill,
                        { backgroundColor: axialCost === 'high' ? COLOURS.danger + '33' : COLOURS.gradeC + '33' },
                      ]}>
                        <Text style={[
                          styles.axialPillText,
                          { color: axialCost === 'high' ? COLOURS.danger : COLOURS.gradeC },
                        ]}>
                          {axialCost} load
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Variant chip row */}
                <Text style={styles.fieldLabel}>VARIATION</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {allVariants.map((v) => (
                    <TouchableOpacity
                      key={v}
                      onPress={() =>
                        setEditingVariants((prev) => ({ ...prev, [ex.exercise]: v }))
                      }
                      style={[
                        styles.chip,
                        variant === v
                          ? { backgroundColor: colour, borderColor: colour }
                          : { borderColor: COLOURS.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: variant === v ? '#000' : COLOURS.textSecondary },
                        ]}
                      >
                        {v}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Sets stepper */}
                <View style={styles.setsRow}>
                  <Text style={styles.fieldLabel}>SETS</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        setEditingSets((prev) => ({
                          ...prev,
                          [ex.exercise]: Math.max(1, (prev[ex.exercise] ?? ex.sets) - 1),
                        }))
                      }
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.setsValue}>{sets}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        setEditingSets((prev) => ({
                          ...prev,
                          [ex.exercise]: Math.min(10, (prev[ex.exercise] ?? ex.sets) + 1),
                        }))
                      }
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: accentColour }]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Start Session</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLOURS.base },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.lg },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  emptyTitle: {
    color: COLOURS.textSecondary,
    fontSize: FONT.lg,
    fontWeight: '700',
  },
  buildBtn: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  buildBtnText: {
    color: '#000',
    fontSize: FONT.md,
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backBtn: { padding: SPACING.xs },
  backText: { color: COLOURS.textSecondary, fontSize: FONT.md, fontWeight: '600' },
  headerCenter: { alignItems: 'center', flex: 1 },
  sessionLabel: {
    color: COLOURS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '900',
  },
  sessionCount: { color: COLOURS.textSecondary, fontSize: FONT.sm },
  shuffleBtn: {
    backgroundColor: COLOURS.surfaceHigh,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  shuffleText: { color: COLOURS.textPrimary, fontSize: FONT.sm, fontWeight: '700' },
  axialNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  axialNoteIcon: { fontSize: 18 },
  axialNoteText: {
    color: COLOURS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  overreachBanner: {
    borderWidth: 1,
    borderColor: COLOURS.gradeA + '55',
    backgroundColor: COLOURS.gradeA + '12',
    alignItems: 'flex-start',
  },
  overreachTitle: {
    color: COLOURS.gradeA,
    fontSize: FONT.md,
    fontWeight: '800',
    marginBottom: 2,
  },
  exerciseList: { gap: SPACING.md, marginBottom: SPACING.xl },
  exCard: {
    backgroundColor: COLOURS.surface,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flex: 1,
  },
  exNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLOURS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exNumber: { fontSize: FONT.sm, fontWeight: '900' },
  exName: { color: COLOURS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  exTargets: { color: COLOURS.textSecondary, fontSize: FONT.xs, textTransform: 'capitalize' },
  exHeaderRight: { alignItems: 'flex-end' },
  axialPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  axialPillText: { fontSize: FONT.xs, fontWeight: '700' },
  fieldLabel: {
    color: COLOURS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingRight: SPACING.md,
    marginTop: SPACING.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  chipText: { fontSize: FONT.sm, fontWeight: '600' },
  setsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLOURS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '700',
    lineHeight: FONT.xl + 4,
  },
  setsValue: {
    color: COLOURS.textPrimary,
    fontSize: FONT.xxl,
    fontWeight: '900',
    minWidth: 40,
    textAlign: 'center',
  },
  startBtn: {
    borderRadius: RADIUS.full,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  startBtnText: {
    color: '#000',
    fontSize: FONT.lg,
    fontWeight: '900',
  },
});
